<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ParsesFilters;
use App\Http\Controllers\Controller;
use App\Models\UserSession;
use App\Services\SecurityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SessionController extends Controller
{
    use ParsesFilters;

    private function currentTokenId(Request $request): string
    {
        return (string) ($request->user()->currentAccessToken()?->id ?? '');
    }

    /** Сессии только текущего пользователя. */
    private function mine(Request $request)
    {
        return UserSession::where('organization_id', $request->user()->organization_id)
            ->where('user_id', $request->user()->id);
    }

    private function present(UserSession $session, string $currentId): UserSession
    {
        $session->setAttribute('is_current', $currentId !== '' && (string) $session->token_id === $currentId);

        return $session;
    }

    private function touchCurrent(Request $request): string
    {
        $currentId = $this->currentTokenId($request);

        if ($currentId !== '') {
            SecurityLogger::ensureSession($request->user(), $currentId, $request);
            $this->mine($request)->where('token_id', $currentId)->update(['last_active_at' => now()]);
        }

        return $currentId;
    }

    public function index(Request $request): JsonResponse
    {
        $request->validate(['is_active' => 'nullable|in:true,false,1,0']);

        $currentId = $this->touchCurrent($request);

        $this->mine($request)
            ->where('is_active', true)
            ->where('expires_at', '<', now())
            ->update(['is_active' => false]);

        $query = $this->mine($request);

        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }
        if ($types = $this->csv($request, 'device_type')) {
            $query->whereIn('device_type', $types);
        }
        $this->applyDates($query, $request);

        [$limit, $offset] = $this->limitOffset($request);
        $total = (clone $query)->count();

        $sessions = $query->with('user:id,name,email')
            ->orderByDesc('last_active_at')
            ->skip($offset)
            ->take($limit)
            ->get()
            ->map(fn ($s) => $this->present($s, $currentId))
            ->values();

        $all = $this->mine($request);

        return $this->ok([
            'sessions' => $sessions,
            'total' => $total,
            'summary' => [
                'total' => (clone $all)->count(),
                'active' => (clone $all)->where('is_active', true)->count(),
                'current' => $currentId !== '' ? (clone $all)->where('token_id', $currentId)->count() : 0,
            ],
        ]);
    }

    public function current(Request $request): JsonResponse
    {
        $currentId = $this->touchCurrent($request);

        $session = $this->mine($request)
            ->where('token_id', $currentId)
            ->with('user:id,name,email')
            ->firstOrFail();

        return $this->ok($this->present($session, $currentId));
    }

    public function show(Request $request, string $id): JsonResponse
    {
        abort_unless(Str::isUuid($id), 404);

        $session = $this->mine($request)->with('user:id,name,email')->findOrFail($id);

        return $this->ok($this->present($session, $this->currentTokenId($request)));
    }

    public function revoke(Request $request, string $id): JsonResponse
    {
        abort_unless(Str::isUuid($id), 404);

        $session = $this->mine($request)->findOrFail($id);

        if ($session->token_id) {
            $request->user()->tokens()->where('id', $session->token_id)->delete();
        }
        $session->update(['is_active' => false]);

        SecurityLogger::audit($request->user(), 'custom', 'session', $session->id, "{$session->browser} / {$session->os}", $request, ['operation' => 'revoke']);

        return $this->ok(null);
    }

    public function revokeOthers(Request $request): JsonResponse
    {
        $currentId = $this->currentTokenId($request);
        abort_if($currentId === '', 400, 'Current token not found.');

        $request->user()->tokens()->where('id', '!=', $currentId)->delete();

        $this->mine($request)
            ->where('is_active', true)
            ->where(function ($q) use ($currentId) {
                $q->whereNull('token_id')->orWhere('token_id', '!=', $currentId);
            })
            ->update(['is_active' => false]);

        SecurityLogger::audit($request->user(), 'custom', 'session', null, 'all other sessions', $request, ['operation' => 'revoke_others']);

        return $this->ok(null);
    }
}
