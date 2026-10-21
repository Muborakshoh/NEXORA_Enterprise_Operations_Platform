<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;

use App\Models\AnalyticsExport;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class AnalyticsExportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $query = AnalyticsExport::where('organization_id', $user->organization_id ?? $user->id);

        if ($request->has('type')) {
            $query->whereIn('type', (array) $request->get('type'));
        }
        if ($request->has('format')) {
            $query->whereIn('format', (array) $request->get('format'));
        }
        if ($request->has('status')) {
            $query->whereIn('status', (array) $request->get('status'));
        }
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->get('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->get('date_to'));
        }

        $perPage = min(max((int) $request->get('per_page', 20), 1), 100);
        $items = $query->orderBy('updated_at', 'desc')->paginate($perPage);

        return response()->json([
            'exports' => $items->items(),
            'total' => $items->total(),
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $item = AnalyticsExport::findOrFail($id);
        return response()->json($item);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:data,report,dashboard,custom',
            'format' => 'required|string|in:csv,excel,pdf,json,xml',
            'data_source' => 'required|string',
            'filters' => 'nullable|array',
            'columns' => 'nullable|array',
        ]);

        $validated['organization_id'] = Auth::user()->organization_id ?? Auth::id();
        $validated['created_by'] = Auth::id();
        $validated['status'] = 'pending';

        $item = AnalyticsExport::create($validated);
        return response()->json($item, 201);
    }

    public function destroy(string $id): JsonResponse
    {
        $item = AnalyticsExport::findOrFail($id);
        $item->delete();
        return response()->json(['message' => 'Export deleted']);
    }

    public function download(string $id)
    {
        $export = AnalyticsExport::findOrFail($id);
        if ($export->status !== 'completed' || !$export->download_url) {
            return response()->json(['message' => 'Export not ready'], 404);
        }
        return response()->download($export->download_url);
    }

    public function status(string $id): JsonResponse
    {
        $item = AnalyticsExport::findOrFail($id);
        return response()->json($item);
    }
}
