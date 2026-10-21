<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;

use App\Models\AITool;
use App\Models\AIToolExecution;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class AIToolController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $query = AITool::where('organization_id', $user->organization_id ?? $user->id);

        if ($request->filled('search')) {
            $query->where('name', 'ilike', '%' . $request->get('search') . '%');
        }
        if ($request->has('category')) {
            $query->whereIn('category', (array) $request->get('category'));
        }
        if ($request->has('enabled')) {
            $query->where('enabled', $request->boolean('enabled'));
        }

        $perPage = min(max((int) $request->get('per_page', 20), 1), 100);
        $items = $query->orderBy('name')->paginate($perPage);

        return response()->json([
            'tools' => $items->items(),
            'total' => $items->total(),
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $item = AITool::findOrFail($id);
        return response()->json($item);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'required|string',
            'parameters' => 'nullable|array',
            'return_type' => 'required|string',
            'enabled' => 'nullable|boolean',
        ]);

        $validated['organization_id'] = Auth::user()->organization_id ?? Auth::id();

        $item = AITool::create($validated);
        return response()->json($item, 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $item = AITool::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'parameters' => 'nullable|array',
            'enabled' => 'nullable|boolean',
        ]);

        $item->update($validated);
        return response()->json($item);
    }

    public function destroy(string $id): JsonResponse
    {
        $item = AITool::findOrFail($id);
        $item->delete();
        return response()->json(['message' => 'Tool deleted']);
    }

    public function execute(Request $request, string $id): JsonResponse
    {
        $tool = AITool::findOrFail($id);
        $validated = $request->validate([
            'arguments' => 'nullable|array',
        ]);

        $startTime = microtime(true);

        // Mock execution
        $execution = AIToolExecution::create([
            'tool_id' => $tool->id,
            'tool_name' => $tool->name,
            'arguments' => $validated['arguments'] ?? [],
            'result' => ['status' => 'success', 'message' => 'Tool executed successfully'],
            'execution_time_ms' => (int) ((microtime(true) - $startTime) * 1000),
            'created_at' => now(),
        ]);

        return response()->json($execution, 201);
    }

    public function executions(Request $request): JsonResponse
    {
        $executions = AIToolExecution::with('tool')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'executions' => $executions->items(),
        ]);
    }
}
