<?php

namespace App\Services\Analytics;

use Carbon\CarbonImmutable;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * Builds and runs aggregation queries over whitelisted data sources.
 *
 * plan() validates a specification without touching the database; run() executes it.
 * Every query is scoped to one organization, limited in size and time, and never
 * contains an identifier that did not come from DataSourceRegistry.
 */
final class AggregationEngine
{
    public const MAX_POINTS = 1000;
    public const MAX_DIMENSIONS = 3;
    public const AGGREGATIONS = ['sum', 'avg', 'count', 'min', 'max', 'group_by'];
    public const GRANULARITIES = ['minute', 'hour', 'day', 'week', 'month', 'quarter', 'year'];
    public const OPERATORS = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'not_in', 'between', 'contains'];

    private const FUNCTIONS = ['sum' => 'SUM', 'avg' => 'AVG', 'min' => 'MIN', 'max' => 'MAX'];
    private const RELATIVE_UNITS = ['minutes', 'hours', 'days', 'weeks', 'months', 'years'];
    private const MAX_FILTERS = 20;
    private const MAX_IN_VALUES = 100;
    private const STATEMENT_TIMEOUT_MS = 5000;

    public function __construct(private readonly DataSourceRegistry $registry)
    {
    }

    /**
     * Validates and normalizes a specification. Throws ValidationException on any problem.
     *
     * @param array{data_source?: mixed, metric?: mixed, aggregation_type?: mixed, dimensions?: mixed,
     *              filters?: mixed, time_range?: mixed, time_granularity?: mixed} $spec
     */
    public function plan(array $spec): array
    {
        $sourceId = is_string($spec['data_source'] ?? null) ? $spec['data_source'] : '';
        $source = $this->registry->get($sourceId);

        $type = $spec['aggregation_type'] ?? 'count';
        if (! is_string($type) || ! in_array($type, self::AGGREGATIONS, true)) {
            $this->fail('aggregation_type', 'Unsupported aggregation type.');
        }

        $metric = null;
        if (isset(self::FUNCTIONS[$type])) {
            $metric = is_string($spec['metric'] ?? null) ? $spec['metric'] : '';
            if (($source['fields'][$metric]['role'] ?? null) !== 'measure') {
                $this->fail('metric', sprintf("'%s' is not a measure of data source '%s'.", Str::limit($metric, 50), $sourceId));
            }
        }

        $rawDimensions = $spec['dimensions'] ?? [];
        if (! is_array($rawDimensions)) {
            $this->fail('dimensions', 'Dimensions must be an array.');
        }
        foreach ($rawDimensions as $dimension) {
            if (! is_string($dimension)) {
                $this->fail('dimensions', 'Dimension names must be strings.');
            }
        }
        $dimensions = array_values(array_unique($rawDimensions));
        if (count($dimensions) > self::MAX_DIMENSIONS) {
            $this->fail('dimensions', 'At most ' . self::MAX_DIMENSIONS . ' dimensions are allowed.');
        }
        foreach ($dimensions as $dimension) {
            if (($source['fields'][$dimension]['role'] ?? null) !== 'dimension') {
                $this->fail('dimensions', sprintf("'%s' cannot be used as a dimension of '%s'.", Str::limit($dimension, 50), $sourceId));
            }
        }

        // Money is never summed across currencies.
        $money = $metric !== null && ! empty($source['fields'][$metric]['money']);
        if ($money && $source['currency_column'] !== null && ! in_array($source['currency_column'], $dimensions, true)) {
            $dimensions[] = $source['currency_column'];
        }

        $granularity = $spec['time_granularity'] ?? null;
        if ($granularity === '') {
            $granularity = null;
        }
        if ($granularity !== null && (! is_string($granularity) || ! in_array($granularity, self::GRANULARITIES, true))) {
            $this->fail('time_granularity', 'Unsupported time granularity.');
        }

        return [
            'source_id' => $sourceId,
            'source' => $source,
            'type' => $type,
            'metric' => $metric,
            'money' => $money,
            'dimensions' => $dimensions,
            'granularity' => $granularity,
            'range' => $this->resolveTimeRange($spec['time_range'] ?? null),
            'filters' => $this->normalizeFilters($source, $spec['filters'] ?? []),
        ];
    }

    /** Executes a specification for one organization and returns { data, metadata }. */
    public function run(string $organizationId, array $spec): array
    {
        $plan = $this->plan($spec);
        $source = $plan['source'];

        $query = DB::table($source['table'])->where($source['org_column'], $organizationId);
        if ($source['soft_deletes']) {
            $query->whereNull('deleted_at');
        }
        foreach ($source['base_conditions'] as $column => $value) {
            $query->where($column, $value);
        }

        $grammar = $query->getGrammar();
        $timeColumn = $source['time_column'];

        if ($plan['range'] !== null) {
            [$start, $end] = $plan['range'];
            $format = $source['fields'][$timeColumn]['type'] === 'date' ? 'Y-m-d' : 'Y-m-d H:i:s';
            $query->where($timeColumn, '>=', $start->format($format))
                ->where($timeColumn, '<=', $end->format($format));
        }

        foreach ($plan['filters'] as $filter) {
            $this->applyFilter($query, $filter);
        }

        $selects = [];
        $groups = [];
        $bucketExpr = null;

        if ($plan['granularity'] !== null) {
            $bucketExpr = sprintf("date_trunc('%s', %s::timestamp)", $plan['granularity'], $grammar->wrap($timeColumn));
            $selects[] = "{$bucketExpr} AS bucket";
            $groups[] = $bucketExpr;
        }
        foreach ($plan['dimensions'] as $i => $dimension) {
            $wrapped = $grammar->wrap($dimension);
            $selects[] = "{$wrapped} AS d{$i}";
            $groups[] = $wrapped;
        }

        $isCount = in_array($plan['type'], ['count', 'group_by'], true);
        $valueExpr = $isCount
            ? 'COUNT(*)'
            : self::FUNCTIONS[$plan['type']] . '(' . $grammar->wrap($plan['metric']) . ')';
        if ($plan['money']) {
            $valueExpr = "ROUND({$valueExpr}, 2)";
        }
        $selects[] = "{$valueExpr} AS agg_value";
        $selects[] = 'COUNT(*) AS row_count';

        $query->selectRaw(implode(', ', $selects));
        if ($groups !== []) {
            $query->groupByRaw(implode(', ', $groups));
            if ($bucketExpr !== null) {
                $query->orderByRaw('bucket ASC');
            }
            $query->orderByRaw('agg_value DESC');
        }
        $query->limit(self::MAX_POINTS + 1);

        $rows = DB::transaction(function () use ($query) {
            DB::statement('SET LOCAL statement_timeout = ' . self::STATEMENT_TIMEOUT_MS);

            return $query->get()->all();
        });

        $truncated = count($rows) > self::MAX_POINTS;
        $rows = array_slice($rows, 0, self::MAX_POINTS);

        $points = [];
        $total = 0;
        foreach ($rows as $row) {
            $point = [];
            if ($bucketExpr !== null) {
                $point['timestamp'] = CarbonImmutable::parse($row->bucket)->toIso8601String();
            }
            if ($plan['dimensions'] !== []) {
                $point['dimensions'] = [];
                foreach ($plan['dimensions'] as $i => $dimension) {
                    $point['dimensions'][$dimension] = $row->{'d' . $i};
                }
            }

            $raw = $row->agg_value;
            $point['value'] = $isCount ? (int) $raw : ($raw === null ? 0 : $raw + 0);
            if ($plan['money']) {
                $point['value_exact'] = $raw === null ? '0.00' : (string) $raw;
            }
            $point['count'] = (int) $row->row_count;

            $total += $point['count'];
            $points[] = $point;
        }

        return [
            'data' => $points,
            'metadata' => [
                'total_records' => $total,
                'time_range' => $plan['range'] === null ? null : [
                    'type' => 'absolute',
                    'absolute' => [
                        'start' => $plan['range'][0]->toIso8601String(),
                        'end' => $plan['range'][1]->toIso8601String(),
                    ],
                ],
                'truncated' => $truncated,
                'generated_at' => now()->toIso8601String(),
            ],
        ];
    }

    /** @return array{0: CarbonImmutable, 1: CarbonImmutable}|null */
    private function resolveTimeRange(mixed $range): ?array
    {
        if ($range === null || $range === []) {
            return null;
        }
        if (! is_array($range)) {
            $this->fail('time_range', 'Time range must be an object.');
        }

        $now = CarbonImmutable::now();
        $type = $range['type'] ?? null;

        if ($type === 'relative') {
            $amount = $range['relative']['amount'] ?? null;
            $unit = $range['relative']['unit'] ?? null;
            if (! is_numeric($amount) || (int) $amount < 1 || (int) $amount > 3650
                || ! is_string($unit) || ! in_array($unit, self::RELATIVE_UNITS, true)) {
                $this->fail('time_range', 'A relative time range needs amount (1-3650) and a valid unit.');
            }

            return [$now->modify('-' . (int) $amount . ' ' . $unit), $now];
        }

        if ($type === 'absolute') {
            $startRaw = $range['absolute']['start'] ?? null;
            $endRaw = $range['absolute']['end'] ?? null;
            if (! is_string($startRaw) || ! is_string($endRaw) || trim($startRaw) === '' || trim($endRaw) === '') {
                $this->fail('time_range', 'An absolute time range needs start and end.');
            }

            try {
                $start = CarbonImmutable::parse($startRaw);
                $end = CarbonImmutable::parse($endRaw);
            } catch (Throwable) {
                $this->fail('time_range', 'Invalid start or end date.');
            }
            if (strlen(trim($endRaw)) <= 10) {
                $end = $end->endOfDay();
            }
            if ($end->lt($start)) {
                $this->fail('time_range', 'The end of the time range is before its start.');
            }

            return [$start, $end];
        }

        $this->fail('time_range', "Time range type must be 'relative' or 'absolute'.");
    }

    /**
     * Accepts either a list of {field, operator, value} or a plain {field: value} map.
     *
     * @return list<array{field: string, operator: string, value: mixed}>
     */
    private function normalizeFilters(array $source, mixed $raw): array
    {
        if ($raw === null || $raw === []) {
            return [];
        }
        if (! is_array($raw)) {
            $this->fail('filters', 'Filters must be an array or an object.');
        }

        $list = array_is_list($raw)
            ? $raw
            : array_map(
                fn ($field, $value) => ['field' => $field, 'operator' => is_array($value) ? 'in' : 'eq', 'value' => $value],
                array_keys($raw),
                array_values($raw),
            );

        if (count($list) > self::MAX_FILTERS) {
            $this->fail('filters', 'At most ' . self::MAX_FILTERS . ' filters are allowed.');
        }

        $normalized = [];
        foreach ($list as $item) {
            if (! is_array($item)) {
                $this->fail('filters', 'Every filter must be an object.');
            }

            $name = $item['field'] ?? null;
            $operator = $item['operator'] ?? 'eq';
            if (! is_string($name) || ! isset($source['fields'][$name])) {
                $this->fail('filters', 'Unknown filter field.');
            }
            if (! is_string($operator) || ! in_array($operator, self::OPERATORS, true)) {
                $this->fail('filters', 'Unsupported filter operator.');
            }

            $normalized[] = [
                'field' => $name,
                'operator' => $operator,
                'value' => $this->castFilterValue($source['fields'][$name], $operator, $item['value'] ?? null),
            ];
        }

        return $normalized;
    }

    private function castFilterValue(array $field, string $operator, mixed $value): mixed
    {
        if ($operator === 'contains') {
            if (empty($field['searchable']) || ! is_string($value) || $value === '' || mb_strlen($value) > 100) {
                $this->fail('filters', "'contains' works only on searchable text fields with a value of up to 100 characters.");
            }

            return $value;
        }

        if ($operator === 'in' || $operator === 'not_in') {
            if (! is_array($value) || $value === [] || count($value) > self::MAX_IN_VALUES) {
                $this->fail('filters', "'in' needs a non-empty list of up to " . self::MAX_IN_VALUES . ' values.');
            }

            return array_map(fn ($v) => $this->castScalar($field, $v), array_values($value));
        }

        if ($operator === 'between') {
            if (! is_array($value) || count($value) !== 2) {
                $this->fail('filters', "'between' needs exactly two values.");
            }

            return array_map(fn ($v) => $this->castScalar($field, $v), array_values($value));
        }

        return $this->castScalar($field, $value);
    }

    private function castScalar(array $field, mixed $value): mixed
    {
        if (! is_scalar($value)) {
            $this->fail('filters', 'Filter values must be scalars.');
        }

        return match ($field['type']) {
            'number' => is_numeric($value) ? $value + 0 : $this->fail('filters', 'Expected a numeric filter value.'),
            'boolean' => filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE)
                ?? $this->fail('filters', 'Expected a boolean filter value.'),
            'uuid' => (is_string($value) && Str::isUuid($value)) ? $value : $this->fail('filters', 'Expected a UUID filter value.'),
            'date' => $this->parseDate($value, 'Y-m-d'),
            'datetime' => $this->parseDate($value, 'Y-m-d H:i:s'),
            default => mb_strlen((string) $value) <= 255 ? (string) $value : $this->fail('filters', 'Filter value is too long.'),
        };
    }

    private function parseDate(mixed $value, string $format): string
    {
        if (! is_string($value) || trim($value) === '') {
            $this->fail('filters', 'Expected a date filter value.');
        }

        try {
            return CarbonImmutable::parse($value)->format($format);
        } catch (Throwable) {
            $this->fail('filters', 'Invalid date filter value.');
        }
    }

    private function applyFilter(Builder $query, array $filter): void
    {
        $column = $filter['field'];
        $value = $filter['value'];

        match ($filter['operator']) {
            'eq' => $query->where($column, '=', $value),
            'neq' => $query->where($column, '!=', $value),
            'gt' => $query->where($column, '>', $value),
            'gte' => $query->where($column, '>=', $value),
            'lt' => $query->where($column, '<', $value),
            'lte' => $query->where($column, '<=', $value),
            'in' => $query->whereIn($column, $value),
            'not_in' => $query->whereNotIn($column, $value),
            'between' => $query->whereBetween($column, $value),
            'contains' => $query->where($column, 'ilike', '%' . addcslashes($value, '%_\\') . '%'),
        };
    }

    private function fail(string $key, string $message): never
    {
        throw ValidationException::withMessages([$key => [$message]]);
    }
}
