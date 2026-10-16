<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ParsesFilters;
use App\Http\Controllers\Controller;
use App\Models\SuspiciousActivity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SuspiciousActivityController extends Controller
{
    use ParsesFilters;

    private function filtered(Request $request)
    {
        $request->validate([
            'user_id' => 'nullable|uuid',
            'min_confidence' => 'nullable|integer|min:0|max:100',
        ]);

        $query = SuspiciousActivity::where('organization_id', $request->user()->organization_id);

        if ($types = $this->csv($request, 'type')) {
            $query->whereIn('type', $types);
        }
        if ($statuses = $this->csv($request, 'status')) {
            $query->whereIn('status', $statuses);
        }
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }
        if ($request->filled('ip_address')) {
            $query->where('ip_address', $request->input('ip_address'));
        }
        if ($request->filled('min_confidence')) {
            $query->where('confidence', '>=', (int) $request->input('min_confidence'));
        }

        return $this->applyDates($query, $request);
    }

    public function index(Request $request): JsonResponse
    {
        [$limit, $offset] = $this->limitOffset($request);

        $query = $this->filtered($request);
        $total = (clone $query)->count();

        $activities = $query->with('user:id,name,email')
            ->orderByDesc('created_at')
            ->skip($offset)
            ->take($limit)
            ->get();

        $counts = SuspiciousActivity::where('organization_id', $request->user()->organization_id)
            ->selectRaw('status, count(*) as c')
            ->groupBy('status')
            ->pluck('c', 'status');

        return $this->ok([
            'activities' => $activities,
            'total' => $total,
            'summary' => [
                'total' => (int) $counts->sum(),
                'detected' => (int) ($counts['detected'] ?? 0),
                'investigating' => (int) ($counts['investigating'] ?? 0),
                'confirmed' => (int) ($counts['confirmed'] ?? 0),
                'false_positive' => (int) ($counts['false_positive'] ?? 0),
                'resolved' => (int) ($counts['resolved'] ?? 0),
            ],
        ]);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        return $this->ok($this->orgModel($request, SuspiciousActivity::class, $id, ['user:id,name,email']));
    }

    private function transition(Request $request, string $id, array $attributes): JsonResponse
    {
        $activity = $this->orgModel($request, SuspiciousActivity::class, $id);
        $activity->update($attributes);

        return $this->ok($activity->load('user:id,name,email'));
    }

    private function reviewed(Request $request, string $status, ?string $note): array
    {
        return [
            'status' => $status,
            'reviewed' => true,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'resolution' => $note,
        ];
    }

    public function investigate(Request $request, string $id): JsonResponse
    {
        return $this->transition($request, $id, ['status' => 'investigating']);
    }

    public function confirm(Request $request, string $id): JsonResponse
    {
        $data = $request->validate(['notes' => 'nullable|string|max:2000']);

        return $this->transition($request, $id, $this->reviewed($request, 'confirmed', $data['notes'] ?? null));
    }

    public function markFalsePositive(Request $request, string $id): JsonResponse
    {
        $data = $request->validate(['reason' => 'nullable|string|max:2000']);

        return $this->transition($request, $id, $this->reviewed($request, 'false_positive', $data['reason'] ?? null));
    }

    public function resolve(Request $request, string $id): JsonResponse
    {
        $data = $request->validate(['resolution' => 'nullable|string|max:2000']);

        return $this->transition($request, $id, $this->reviewed($request, 'resolved', $data['resolution'] ?? null));
    }
}
