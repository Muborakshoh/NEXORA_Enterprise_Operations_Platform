<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;

use App\Models\AnalyticsDashboard;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class AnalyticsDashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $query = AnalyticsDashboard::where('organization_id', $user->organization_id ?? $user->id);

        if ($request->filled('search')) {
            $query->where('name', 'ilike', '%' . $request->get('search') . '%');
        }
        if ($request->has('is_default')) {
            $query->where('is_default', $request->boolean('is_default'));
        }

        $perPage = min(max((int) $request->get('per_page', 20), 1), 100);
        $items = $query->orderBy('updated_at', 'desc')->paginate($perPage);

        return response()->json([
            'dashboards' => $items->items(),
            'total' => $items->total(),
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $item = AnalyticsDashboard::findOrFail($id);
        return response()->json($item);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'widgets' => 'nullable|array',
            'layout' => 'nullable|array',
            'is_default' => 'nullable|boolean',
        ]);

        $validated['organization_id'] = Auth::user()->organization_id ?? Auth::id();
        $validated['created_by'] = Auth::id();

        $item = AnalyticsDashboard::create($validated);
        return response()->json($item, 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $item = AnalyticsDashboard::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'widgets' => 'nullable|array',
            'layout' => 'nullable|array',
            'is_default' => 'nullable|boolean',
        ]);

        $item->update($validated);
        return response()->json($item);
    }

    public function destroy(string $id): JsonResponse
    {
        $item = AnalyticsDashboard::findOrFail($id);
        $item->delete();
        return response()->json(['message' => 'Dashboard deleted']);
    }

    public function setDefault(Request $request, string $id): JsonResponse
    {
        $item = AnalyticsDashboard::findOrFail($id);
        $orgId = $item->organization_id;

        // Снимаем флаг is_default у остальных дашбордов этой организации
        AnalyticsDashboard::where('organization_id', $orgId)
            ->where('is_default', true)
            ->update(['is_default' => false]);

        $item->update(['is_default' => true]);
        return response()->json($item);
    }
}
