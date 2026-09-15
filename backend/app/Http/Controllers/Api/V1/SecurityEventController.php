<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SecurityEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SecurityEventController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = SecurityEvent::where('organization_id', $request->user()->organization_id)
            ->with(['user', 'acknowledgedByUser']);

        if ($request->has('severity')) {
            $query->whereIn('severity', (array) $request->severity);
        }

        if ($request->has('status')) {
            $query->whereIn('status', (array) $request->status);
        }

        if ($request->has('type')) {
            $query->whereIn('type', (array) $request->type);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $events = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        $summary = [
            'total' => SecurityEvent::where('organization_id', $request->user()->organization_id)->count(),
            'critical' => SecurityEvent::where('organization_id', $request->user()->organization_id)->where('severity', 'critical')->count(),
            'high' => SecurityEvent::where('organization_id', $request->user()->organization_id)->where('severity', 'high')->count(),
            'medium' => SecurityEvent::where('organization_id', $request->user()->organization_id)->where('severity', 'medium')->count(),
            'low' => SecurityEvent::where('organization_id', $request->user()->organization_id)->where('severity', 'low')->count(),
            'info' => SecurityEvent::where('organization_id', $request->user()->organization_id)->where('severity', 'info')->count(),
            'active' => SecurityEvent::where('organization_id', $request->user()->organization_id)->where('status', 'active')->count(),
            'acknowledged' => SecurityEvent::where('organization_id', $request->user()->organization_id)->where('status', 'acknowledged')->count(),
            'resolved' => SecurityEvent::where('organization_id', $request->user()->organization_id)->where('status', 'resolved')->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $events,
            'meta' => [
                'summary' => $summary,
            ],
        ]);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $event = SecurityEvent::where('organization_id', $request->user()->organization_id)
            ->with(['user', 'acknowledgedByUser'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $event,
        ]);
    }

    public function acknowledge(Request $request, string $id): JsonResponse
    {
        $event = SecurityEvent::where('organization_id', $request->user()->organization_id)
            ->findOrFail($id);

        $event->update([
            'status' => 'acknowledged',
            'acknowledged' => true,
            'acknowledged_by' => $request->user()->id,
            'acknowledged_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $event->load(['user', 'acknowledgedByUser']),
        ]);
    }

    public function resolve(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'resolution' => 'nullable|string',
        ]);

        $event = SecurityEvent::where('organization_id', $request->user()->organization_id)
            ->findOrFail($id);

        $event->update([
            'status' => 'resolved',
            'resolved_at' => now(),
            'metadata' => array_merge($event->metadata ?? [], [
                'resolution' => $validated['resolution'] ?? null,
            ]),
        ]);

        return response()->json([
            'success' => true,
            'data' => $event->load(['user', 'acknowledgedByUser']),
        ]);
    }

    public function markFalsePositive(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'reason' => 'nullable|string',
        ]);

        $event = SecurityEvent::where('organization_id', $request->user()->organization_id)
            ->findOrFail($id);

        $event->update([
            'status' => 'false_positive',
            'metadata' => array_merge($event->metadata ?? [], [
                'false_positive_reason' => $validated['reason'] ?? null,
            ]),
        ]);

        return response()->json([
            'success' => true,
            'data' => $event->load(['user', 'acknowledgedByUser']),
        ]);
    }
}
