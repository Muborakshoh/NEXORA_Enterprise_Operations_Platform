<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;

use App\Models\AIAnomalyDetector;
use App\Models\AIAnomaly;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class AIAnomalyController extends Controller
{
    public function detectorsIndex(Request $request): JsonResponse
    {
        $user = Auth::user();
        $query = AIAnomalyDetector::where('organization_id', $user->organization_id ?? $user->id);

        if ($request->filled('search')) {
            $query->where('name', 'ilike', '%' . $request->get('search') . '%');
        }
        if ($request->has('algorithm')) {
            $query->whereIn('algorithm', (array) $request->get('algorithm'));
        }
        if ($request->has('enabled')) {
            $query->where('enabled', $request->boolean('enabled'));
        }

        $perPage = min(max((int) $request->get('per_page', 20), 1), 100);
        $items = $query->orderBy('updated_at', 'desc')->paginate($perPage);

        return response()->json([
            'detectors' => $items->items(),
            'total' => $items->total(),
        ]);
    }

    public function detectorsShow(string $id): JsonResponse
    {
        $item = AIAnomalyDetector::findOrFail($id);
        return response()->json($item);
    }

    public function detectorsStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'data_source' => 'required|string',
            'metric' => 'required|string',
            'algorithm' => 'required|string|in:statistical,ml,isolation_forest,lstm,machine_learning,time_series,autoencoder,custom',
            'config' => 'nullable|array',
            'enabled' => 'nullable|boolean',
        ]);

        $validated['organization_id'] = Auth::user()->organization_id ?? Auth::id();
        $validated['created_by'] = Auth::id();

        $item = AIAnomalyDetector::create($validated);
        return response()->json($item, 201);
    }

    public function detectorsUpdate(Request $request, string $id): JsonResponse
    {
        $item = AIAnomalyDetector::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'config' => 'nullable|array',
            'enabled' => 'nullable|boolean',
        ]);

        $item->update($validated);
        return response()->json($item);
    }

    public function detectorsDestroy(string $id): JsonResponse
    {
        $item = AIAnomalyDetector::findOrFail($id);
        $item->delete();
        return response()->json(['message' => 'Detector deleted']);
    }

    public function detectorsToggle(Request $request, string $id): JsonResponse
    {
        $item = AIAnomalyDetector::findOrFail($id);
        $validated = $request->validate(['enabled' => 'required|boolean']);
        $item->update(['enabled' => $validated['enabled']]);
        return response()->json($item);
    }

    public function anomaliesIndex(Request $request): JsonResponse
    {
        $query = AIAnomaly::with('detector');

        if ($request->has('detector_id')) {
            $query->where('detector_id', $request->get('detector_id'));
        }
        if ($request->has('severity')) {
            $query->whereIn('severity', (array) $request->get('severity'));
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
        $items = $query->orderBy('created_at', 'desc')->paginate($perPage);

        $summary = [
            'total' => AIAnomaly::count(),
            'by_severity' => [
                'low' => AIAnomaly::where('severity', 'low')->count(),
                'medium' => AIAnomaly::where('severity', 'medium')->count(),
                'high' => AIAnomaly::where('severity', 'high')->count(),
                'critical' => AIAnomaly::where('severity', 'critical')->count(),
            ],
            'by_status' => [
                'detected' => AIAnomaly::where('status', 'detected')->count(),
                'investigating' => AIAnomaly::where('status', 'investigating')->count(),
                'confirmed' => AIAnomaly::where('status', 'confirmed')->count(),
                'resolved' => AIAnomaly::where('status', 'resolved')->count(),
                'false_positive' => AIAnomaly::where('status', 'false_positive')->count(),
            ],
        ];

        return response()->json([
            'anomalies' => $items->items(),
            'total' => $items->total(),
            'summary' => $summary,
        ]);
    }

    public function anomaliesShow(string $id): JsonResponse
    {
        $item = AIAnomaly::with('detector')->findOrFail($id);
        return response()->json($item);
    }

    public function anomaliesUpdateStatus(Request $request, string $id): JsonResponse
    {
        $item = AIAnomaly::findOrFail($id);
        $validated = $request->validate([
            'status' => 'required|string|in:detected,investigating,confirmed,resolved,false_positive',
        ]);
        $item->update(['status' => $validated['status']]);
        return response()->json($item);
    }

    public function anomaliesResolve(Request $request, string $id): JsonResponse
    {
        $item = AIAnomaly::findOrFail($id);
        $validated = $request->validate(['resolution' => 'nullable|string']);
        $item->update([
            'status' => 'resolved',
            'resolved_at' => now(),
        ]);
        return response()->json($item);
    }
}
