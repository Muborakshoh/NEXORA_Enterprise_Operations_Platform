<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ParsesFilters;
use App\Http\Controllers\Controller;
use App\Models\AnalyticsDashboard;
use App\Services\Analytics\AggregationEngine;
use App\Services\Analytics\DataSourceRegistry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class DashboardController extends Controller
{
    use ParsesFilters;

    private const WIDGET_TYPES = ['kpi_card', 'line_chart', 'bar_chart', 'pie_chart', 'area_chart', 'table', 'metric', 'gauge', 'heatmap', 'funnel'];
    private const DEFAULT_LAYOUT = ['columns' => 12, 'row_height' => 80, 'margin' => 8];

    public function __construct(
        private readonly AggregationEngine $engine,
        private readonly DataSourceRegistry $registry,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'is_default' => ['nullable', 'in:true,false,1,0'],
            'search' => ['nullable', 'string', 'max:100'],
        ]);

        $query = AnalyticsDashboard::where('organization_id', $request->user()->organization_id);

        if ($request->filled('is_default')) {
            $query->where('is_default', filter_var($request->input('is_default'), FILTER_VALIDATE_BOOLEAN));
        }
        if ($request->filled('search')) {
            $like = '%' . addcslashes((string) $request->input('search'), '%_\\') . '%';
            $query->where(fn ($q) => $q->where('name', 'ilike', $like)->orWhere('description', 'ilike', $like));
        }

        [$limit, $offset] = $this->limitOffset($request, 100, 200);
        $total = (clone $query)->count();
        $items = $query->orderByDesc('is_default')->orderBy('name')->skip($offset)->take($limit)->get();

        return $this->ok(['dashboards' => $items, 'total' => $total]);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        return $this->ok($this->orgModel($request, AnalyticsDashboard::class, $id));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules(false));
        $widgets = $data['widgets'] ?? [];
        $this->assertWidgetsRunnable($widgets);

        $organizationId = $request->user()->organization_id;

        $dashboard = DB::transaction(function () use ($request, $data, $widgets, $organizationId) {
            // The first dashboard of an organization becomes its default one.
            $isDefault = array_key_exists('is_default', $data)
                ? filter_var($data['is_default'], FILTER_VALIDATE_BOOLEAN)
                : ! AnalyticsDashboard::where('organization_id', $organizationId)->exists();

            if ($isDefault) {
                $this->clearDefault($organizationId);
            }

            return AnalyticsDashboard::create([
                'organization_id' => $organizationId,
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'widgets' => $widgets,
                'layout' => $data['layout'] ?? self::DEFAULT_LAYOUT,
                'is_default' => $isDefault,
                'created_by' => $request->user()->id,
            ]);
        });

        return $this->ok($dashboard->refresh(), 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $dashboard = $this->orgModel($request, AnalyticsDashboard::class, $id);
        $data = $request->validate($this->rules(true));

        if (isset($data['widgets'])) {
            $this->assertWidgetsRunnable($data['widgets']);
        }

        DB::transaction(function () use ($dashboard, $data) {
            if (array_key_exists('is_default', $data) && filter_var($data['is_default'], FILTER_VALIDATE_BOOLEAN)) {
                $this->clearDefault($dashboard->organization_id, $dashboard->id);
            }
            $dashboard->update($data);
        });

        return $this->ok($dashboard->refresh());
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $this->orgModel($request, AnalyticsDashboard::class, $id)->delete();

        return $this->ok(null);
    }

    public function setDefault(Request $request, string $id): JsonResponse
    {
        $dashboard = $this->orgModel($request, AnalyticsDashboard::class, $id);

        DB::transaction(function () use ($dashboard) {
            $this->clearDefault($dashboard->organization_id, $dashboard->id);
            $dashboard->update(['is_default' => true]);
        });

        return $this->ok($dashboard->refresh());
    }

    private function clearDefault(string $organizationId, ?string $exceptId = null): void
    {
        AnalyticsDashboard::where('organization_id', $organizationId)
            ->where('is_default', true)
            ->when($exceptId !== null, fn ($q) => $q->where('id', '!=', $exceptId))
            ->update(['is_default' => false]);
    }

    /** A widget must describe a query the engine can actually run. */
    private function assertWidgetsRunnable(array $widgets): void
    {
        foreach ($widgets as $index => $widget) {
            $config = $widget['config'];

            try {
                $this->engine->plan([
                    'data_source' => $config['data_source'],
                    'metric' => $config['metric'] ?? null,
                    'aggregation_type' => $config['aggregation'] ?? 'count',
                    'dimensions' => $config['dimensions'] ?? [],
                    'filters' => $config['filters'] ?? [],
                    'time_range' => $config['time_range'] ?? null,
                ]);
            } catch (ValidationException $e) {
                throw ValidationException::withMessages([
                    "widgets.{$index}.config" => collect($e->errors())->flatten()->all(),
                ]);
            }
        }
    }

    private function rules(bool $partial): array
    {
        $presence = $partial ? ['sometimes', 'required'] : ['required'];

        return [
            'name' => array_merge($presence, ['string', 'max:255']),
            'description' => ['nullable', 'string', 'max:1000'],
            'is_default' => ['sometimes', 'boolean'],
            'layout' => ['sometimes', 'array'],
            'layout.columns' => ['required_with:layout', 'integer', 'min:1', 'max:24'],
            'layout.row_height' => ['required_with:layout', 'integer', 'min:20', 'max:400'],
            'layout.margin' => ['required_with:layout', 'integer', 'min:0', 'max:64'],
            'widgets' => ['sometimes', 'array', 'max:50'],
            'widgets.*.id' => ['required', 'string', 'max:100'],
            'widgets.*.type' => ['required', Rule::in(self::WIDGET_TYPES)],
            'widgets.*.title' => ['required', 'string', 'max:255'],
            'widgets.*.config' => ['required', 'array'],
            'widgets.*.config.data_source' => ['required', Rule::in($this->registry->ids())],
            'widgets.*.config.metric' => ['nullable', 'string', 'max:100'],
            'widgets.*.config.dimensions' => ['nullable', 'array', 'max:' . AggregationEngine::MAX_DIMENSIONS],
            'widgets.*.config.dimensions.*' => ['string', 'max:100'],
            'widgets.*.config.time_range' => ['nullable', 'array'],
            'widgets.*.config.aggregation' => ['nullable', Rule::in(AggregationEngine::AGGREGATIONS)],
            'widgets.*.config.filters' => ['nullable', 'array'],
            'widgets.*.config.display_options' => ['nullable', 'array'],
            'widgets.*.position' => ['required', 'array'],
            'widgets.*.position.x' => ['required', 'integer', 'min:0', 'max:1000'],
            'widgets.*.position.y' => ['required', 'integer', 'min:0', 'max:10000'],
            'widgets.*.position.w' => ['required', 'integer', 'min:1', 'max:24'],
            'widgets.*.position.h' => ['required', 'integer', 'min:1', 'max:100'],
            'widgets.*.filters' => ['nullable', 'array', 'max:20'],
            'widgets.*.filters.*.field' => ['required', 'string', 'max:100'],
            'widgets.*.filters.*.operator' => ['required', Rule::in(['eq', 'neq', 'gt', 'lt', 'in', 'between'])],
            'widgets.*.filters.*.value' => ['present'],
        ];
    }
}
