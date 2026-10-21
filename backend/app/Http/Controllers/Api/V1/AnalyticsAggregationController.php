<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;

use App\Models\AnalyticsAggregation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class AnalyticsAggregationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $query = AnalyticsAggregation::where('organization_id', $user->organization_id ?? $user->id);

        if ($request->filled('search')) {
            $query->where('name', 'ilike', '%' . $request->get('search') . '%');
        }
        if ($request->has('aggregation_type')) {
            $query->whereIn('aggregation_type', (array) $request->get('aggregation_type'));
        }
        if ($request->filled('data_source')) {
            $query->where('data_source', $request->get('data_source'));
        }

        $perPage = min(max((int) $request->get('per_page', 20), 1), 100);
        $items = $query->orderBy('updated_at', 'desc')->paginate($perPage);

        return response()->json([
            'aggregations' => $items->items(),
            'total' => $items->total(),
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $item = AnalyticsAggregation::findOrFail($id);
        return response()->json($item);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'data_source' => 'required|string',
            'metric' => 'required|string',
            'aggregation_type' => 'required|string|in:sum,avg,count,min,max,group_by',
            'dimensions' => 'nullable|array',
            'filters' => 'nullable|array',
            'time_granularity' => 'nullable|string|in:minute,hour,day,week,month,quarter,year',
        ]);

        $validated['organization_id'] = Auth::user()->organization_id ?? Auth::id();
        $validated['created_by'] = Auth::id();

        $item = AnalyticsAggregation::create($validated);
        return response()->json($item, 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $item = AnalyticsAggregation::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'metric' => 'sometimes|string',
            'aggregation_type' => 'sometimes|string|in:sum,avg,count,min,max,group_by',
            'dimensions' => 'nullable|array',
            'filters' => 'nullable|array',
            'time_granularity' => 'nullable|string|in:minute,hour,day,week,month,quarter,year',
        ]);

        $item->update($validated);
        return response()->json($item);
    }

    public function destroy(string $id): JsonResponse
    {
        $item = AnalyticsAggregation::findOrFail($id);
        $item->delete();
        return response()->json(['message' => 'Aggregation deleted']);
    }

    public function execute(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'timeRange' => 'nullable|array',
        ]);

        $aggregation = AnalyticsAggregation::findOrFail($id);

        return response()->json([
            'aggregation_id' => $aggregation->id,
            'data' => [],
            'metadata' => [
                'aggregation_type' => $aggregation->aggregation_type,
                'metric' => $aggregation->metric,
                'executed_at' => now()->toIso8601String(),
            ],
        ]);
    }

    public function results(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'timeRange' => 'nullable|array',
        ]);

        $aggregation = AnalyticsAggregation::findOrFail($id);

        return response()->json([
            'aggregation_id' => $aggregation->id,
            'data' => [],
            'metadata' => [
                'aggregation_type' => $aggregation->aggregation_type,
                'metric' => $aggregation->metric,
            ],
        ]);
    }
}
