<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;

use App\Models\AIRecommendation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class AIRecommendationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $query = AIRecommendation::where('organization_id', $user->organization_id ?? $user->id);

        if ($request->has('type')) {
            $query->whereIn('type', (array) $request->get('type'));
        }
        if ($request->has('category')) {
            $query->whereIn('category', (array) $request->get('category'));
        }
        if ($request->has('impact')) {
            $query->whereIn('impact', (array) $request->get('impact'));
        }
        if ($request->has('status')) {
            $query->whereIn('status', (array) $request->get('status'));
        }
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'ilike', '%' . $request->get('search') . '%')
                  ->orWhere('description', 'ilike', '%' . $request->get('search') . '%');
            });
        }

        $perPage = min(max((int) $request->get('per_page', 20), 1), 100);
        $items = $query->orderBy('created_at', 'desc')->paginate($perPage);

        $summary = [
            'total' => AIRecommendation::where('organization_id', $user->organization_id ?? $user->id)->count(),
            'new' => AIRecommendation::where('organization_id', $user->organization_id ?? $user->id)->where('status', 'new')->count(),
            'accepted' => AIRecommendation::where('organization_id', $user->organization_id ?? $user->id)->where('status', 'accepted')->count(),
            'rejected' => AIRecommendation::where('organization_id', $user->organization_id ?? $user->id)->where('status', 'rejected')->count(),
            'implemented' => AIRecommendation::where('organization_id', $user->organization_id ?? $user->id)->where('status', 'implemented')->count(),
        ];

        return response()->json([
            'recommendations' => $items->items(),
            'total' => $items->total(),
            'summary' => $summary,
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $item = AIRecommendation::findOrFail($id);
        return response()->json($item);
    }

    public function accept(string $id): JsonResponse
    {
        $item = AIRecommendation::findOrFail($id);
        $item->update(['status' => 'accepted']);
        return response()->json($item);
    }

    public function reject(Request $request, string $id): JsonResponse
    {
        $item = AIRecommendation::findOrFail($id);
        $validated = $request->validate(['reason' => 'nullable|string']);
        $item->update([
            'status' => 'rejected',
            'metadata' => array_merge($item->metadata ?? [], ['rejection_reason' => $validated['reason'] ?? null]),
        ]);
        return response()->json($item);
    }

    public function implement(string $id): JsonResponse
    {
        $item = AIRecommendation::findOrFail($id);
        $item->update(['status' => 'implemented']);
        return response()->json($item);
    }

    public function refresh(): JsonResponse
    {
        $user = Auth::user();
        $orgId = $user->organization_id ?? $user->id;

        // Generate mock recommendations
        $types = ['cost_optimization', 'security', 'performance', 'operational'];
        $categories = ['infrastructure', 'security', 'finance'];
        $impacts = ['low', 'medium', 'high', 'critical'];

        for ($i = 0; $i < 3; $i++) {
            AIRecommendation::create([
                'organization_id' => $orgId,
                'type' => $types[array_rand($types)],
                'category' => $categories[array_rand($categories)],
                'title' => 'Recommendation ' . uniqid(),
                'description' => 'AI-generated recommendation based on system analysis.',
                'impact' => $impacts[array_rand($impacts)],
                'confidence' => rand(70, 99) / 100,
                'source' => 'ai_analysis',
                'status' => 'new',
            ]);
        }

        $items = AIRecommendation::where('organization_id', $orgId)
            ->where('status', 'new')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        $summary = [
            'total' => AIRecommendation::where('organization_id', $orgId)->count(),
            'new' => AIRecommendation::where('organization_id', $orgId)->where('status', 'new')->count(),
            'accepted' => AIRecommendation::where('organization_id', $orgId)->where('status', 'accepted')->count(),
            'rejected' => AIRecommendation::where('organization_id', $orgId)->where('status', 'rejected')->count(),
            'implemented' => AIRecommendation::where('organization_id', $orgId)->where('status', 'implemented')->count(),
        ];

        return response()->json([
            'recommendations' => $items->items(),
            'total' => $items->total(),
            'summary' => $summary,
        ]);
    }
}
