<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ParsesFilters;
use App\Http\Controllers\Controller;
use App\Models\SecurityEvent;
use App\Models\SuspiciousActivity;
use App\Models\UserSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SecurityStatsController extends Controller
{
    use ParsesFilters;

    public function show(Request $request): JsonResponse
    {
        $org = $request->user()->organization_id;
        $since = now()->subDay();

        $events = SecurityEvent::where('organization_id', $org);
        $recent = SecurityEvent::where('organization_id', $org)->where('created_at', '>=', $since);
        $sessions = UserSession::where('organization_id', $org);
        $suspicious = SuspiciousActivity::where('organization_id', $org);

        return $this->ok([
            'total_events' => (clone $events)->count(),
            'critical_events' => (clone $events)->where('severity', 'critical')->count(),
            'active_events' => (clone $events)->where('status', 'active')->count(),
            'total_sessions' => (clone $sessions)->count(),
            'active_sessions' => (clone $sessions)->where('is_active', true)->where('expires_at', '>', now())->count(),
            'suspicious_activities' => (clone $suspicious)->count(),
            'confirmed_threats' => (clone $suspicious)->where('status', 'confirmed')->count(),
            'failed_logins_24h' => (clone $recent)->where('type', 'login_failed')->count(),
            'successful_logins_24h' => (clone $recent)->where('type', 'login_success')->count(),
            'unique_ips_24h' => (clone $recent)->distinct()->count('ip_address'),
        ]);
    }
}
