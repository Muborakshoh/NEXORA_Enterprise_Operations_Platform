<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;

use App\Models\AnalyticsReport;
use App\Models\AnalyticsReportExecution;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class AnalyticsReportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $query = AnalyticsReport::where('organization_id', $user->organization_id ?? $user->id);

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
            'reports' => $items->items(),
            'total' => $items->total(),
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $item = AnalyticsReport::findOrFail($id);
        return response()->json($item);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|string|in:custom,scheduled,on_demand,template',
            'data_source' => 'required|string',
            'query' => 'required|array',
            'schedule' => 'nullable|array',
            'format' => 'nullable|array',
            'recipients' => 'nullable|array',
        ]);

        $validated['organization_id'] = Auth::user()->organization_id ?? Auth::id();
        $validated['created_by'] = Auth::id();

        $item = AnalyticsReport::create($validated);
        return response()->json($item, 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $item = AnalyticsReport::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'query' => 'nullable|array',
            'schedule' => 'nullable|array',
            'format' => 'nullable|array',
            'recipients' => 'nullable|array',
        ]);

        $item->update($validated);
        return response()->json($item);
    }

    public function destroy(string $id): JsonResponse
    {
        $item = AnalyticsReport::findOrFail($id);
        $item->delete();
        return response()->json(['message' => 'Report deleted']);
    }

    public function execute(Request $request, string $id): JsonResponse
    {
        $report = AnalyticsReport::findOrFail($id);
        $validated = $request->validate(['format' => 'required|string|in:pdf,csv,excel,json']);

        $execution = AnalyticsReportExecution::create([
            'report_id' => $report->id,
            'format' => $validated['format'],
            'status' => 'pending',
        ]);

        return response()->json($execution, 201);
    }

    public function toggleSchedule(Request $request, string $id): JsonResponse
    {
        $item = AnalyticsReport::findOrFail($id);
        $validated = $request->validate(['enabled' => 'required|boolean']);

        $schedule = $item->schedule ?? [];
        $schedule['enabled'] = $validated['enabled'];
        $item->update(['schedule' => $schedule]);

        return response()->json($item);
    }

    public function showExecution(string $executionId): JsonResponse
    {
        $execution = AnalyticsReportExecution::findOrFail($executionId);
        return response()->json($execution);
    }
}
