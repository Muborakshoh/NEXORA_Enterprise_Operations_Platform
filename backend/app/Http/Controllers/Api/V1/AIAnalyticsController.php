<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;

use App\Models\AIAnalytics;
use App\Models\AIAnalyticsResult;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class AIAnalyticsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $query = AIAnalytics::where('organization_id', $user->organization_id ?? $user->id);

        if ($request->filled('search')) {
            $query->where('name', 'ilike', '%' . $request->get('search') . '%');
        }
        if ($request->has('type')) {
            $query->whereIn('type', (array) $request->get('type'));
        }
        if ($request->has('scheduled')) {
            $query->whereNotNull('schedule');
        }

        $perPage = min(max((int) $request->get('per_page', 20), 1), 100);
        $items = $query->orderBy('updated_at', 'desc')->paginate($perPage);

        return response()->json([
            'analytics' => $items->items(),
            'total' => $items->total(),
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $item = AIAnalytics::findOrFail($id);
        return response()->json($item);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|string|in:trend,pattern,anomaly,correlation,outlier,trend_analysis,pattern_detection,correlation_analysis,forecasting,segmentation,clustering',
            'data_source' => 'required|string',
            'query' => 'required|array',
            'schedule' => 'nullable|array',
        ]);

        $validated['organization_id'] = Auth::user()->organization_id ?? Auth::id();
        $validated['created_by'] = Auth::id();

        $item = AIAnalytics::create($validated);
        return response()->json($item, 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $item = AIAnalytics::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'query' => 'nullable|array',
            'schedule' => 'nullable|array',
        ]);

        $item->update($validated);
        return response()->json($item);
    }

    public function destroy(string $id): JsonResponse
    {
        $item = AIAnalytics::findOrFail($id);
        $item->delete();
        return response()->json(['message' => 'Analytics deleted']);
    }

    public function run(string $id): JsonResponse
    {
        $analytics = AIAnalytics::findOrFail($id);

        $result = AIAnalyticsResult::create([
            'analytics_id' => $analytics->id,
            'status' => 'completed',
            'result' => [
                'summary' => ['total_records' => 0, 'analyzed_at' => now()->toIso8601String()],
                'insights' => [],
                'visualizations' => [],
                'recommendations' => [],
            ],
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        $analytics->update(['last_run_at' => now()]);

        return response()->json($result);
    }

    public function results(Request $request, string $id): JsonResponse
    {
        $results = AIAnalyticsResult::where('analytics_id', $id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'results' => $results->items(),
        ]);
    }

    public function toggleSchedule(Request $request, string $id): JsonResponse
    {
        $item = AIAnalytics::findOrFail($id);
        $validated = $request->validate(['enabled' => 'required|boolean']);

        $schedule = $item->schedule ?? [];
        $schedule['enabled'] = $validated['enabled'];
        $item->update(['schedule' => $schedule]);

        return response()->json($item);
    }
}
