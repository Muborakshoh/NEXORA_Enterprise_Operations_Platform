<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ParsesFilters;
use App\Http\Controllers\Controller;
use App\Models\AnalyticsAggregation;
use App\Services\Analytics\AggregationEngine;
use App\Services\Analytics\DataSourceRegistry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;

class AggregationController extends Controller
{
    use ParsesFilters;

    private const FIELDS = ['name', 'description', 'data_source', 'metric', 'aggregation_type', 'dimensions', 'filters', 'time_granularity'];

    public function __construct(
        private readonly AggregationEngine $engine,
        private readonly DataSourceRegistry $registry,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'data_source' => ['nullable', 'string', 'max:50'],
            'search' => ['nullable', 'string', 'max:100'],
        ]);

        $query = AnalyticsAggregation::where('organization_id', $request->user()->organization_id);

        if ($request->filled('data_source')) {
            $query->where('data_source', $request->input('data_source'));
        }
        if ($types = $this->csv($request, 'aggregation_type')) {
            $query->whereIn('aggregation_type', $types);
        }
        if ($request->filled('search')) {
            $like = '%' . addcslashes((string) $request->input('search'), '%_\\') . '%';
            $query->where(fn ($q) => $q->where('name', 'ilike', $like)->orWhere('description', 'ilike', $like));
        }

        [$limit, $offset] = $this->limitOffset($request, 100, 200);
        $total = (clone $query)->count();
        $items = $query->orderBy('name')->skip($offset)->take($limit)->get();

        return $this->ok(['aggregations' => $items, 'total' => $total]);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        return $this->ok($this->orgModel($request, AnalyticsAggregation::class, $id));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules(false));
        $this->engine->plan($data);

        $aggregation = AnalyticsAggregation::create(
            Arr::only($data, self::FIELDS) + [
                'organization_id' => $request->user()->organization_id,
                'created_by' => $request->user()->id,
            ],
        );

        return $this->ok($aggregation->refresh(), 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $aggregation = $this->orgModel($request, AnalyticsAggregation::class, $id);
        $data = $request->validate($this->rules(true));

        $this->engine->plan(array_merge($aggregation->only(self::FIELDS), $data));
        $aggregation->update(Arr::only($data, self::FIELDS));

        return $this->ok($aggregation->refresh());
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $this->orgModel($request, AnalyticsAggregation::class, $id)->delete();

        return $this->ok(null);
    }

    public function execute(Request $request, string $id): JsonResponse
    {
        $request->validate(['timeRange' => ['nullable', 'array']]);
        $aggregation = $this->orgModel($request, AnalyticsAggregation::class, $id);

        return $this->ok($this->compute($request, $aggregation, $request->input('timeRange')));
    }

    /**
     * The frontend client cannot send nested query parameters, so the time range arrives flat:
     * ?type=relative&amount=7&unit=days or ?type=absolute&start=...&end=...
     */
    public function results(Request $request, string $id): JsonResponse
    {
        $aggregation = $this->orgModel($request, AnalyticsAggregation::class, $id);

        $timeRange = match ($request->query('type')) {
            'relative' => ['type' => 'relative', 'relative' => [
                'amount' => $request->query('amount'),
                'unit' => $request->query('unit'),
            ]],
            'absolute' => ['type' => 'absolute', 'absolute' => [
                'start' => $request->query('start'),
                'end' => $request->query('end'),
            ]],
            default => null,
        };

        return $this->ok($this->compute($request, $aggregation, $timeRange));
    }

    private function compute(Request $request, AnalyticsAggregation $aggregation, mixed $timeRange): array
    {
        $result = $this->engine->run($request->user()->organization_id, [
            'data_source' => $aggregation->data_source,
            'metric' => $aggregation->metric,
            'aggregation_type' => $aggregation->aggregation_type,
            'dimensions' => $aggregation->dimensions ?? [],
            'filters' => $aggregation->filters ?? [],
            'time_granularity' => $aggregation->time_granularity,
            'time_range' => $timeRange,
        ]);

        return ['aggregation_id' => $aggregation->id] + $result;
    }

    private function rules(bool $partial): array
    {
        $presence = $partial ? ['sometimes', 'required'] : ['required'];

        return [
            'name' => array_merge($presence, ['string', 'max:255']),
            'description' => ['nullable', 'string', 'max:1000'],
            'data_source' => array_merge($presence, ['string', Rule::in($this->registry->ids())]),
            'metric' => array_merge($presence, ['string', 'max:100']),
            'aggregation_type' => array_merge($presence, [Rule::in(AggregationEngine::AGGREGATIONS)]),
            'dimensions' => ['nullable', 'array', 'max:' . AggregationEngine::MAX_DIMENSIONS],
            'dimensions.*' => ['string', 'max:100'],
            'filters' => ['nullable', 'array', 'max:20'],
            'time_granularity' => ['nullable', Rule::in(AggregationEngine::GRANULARITIES)],
        ];
    }
}
