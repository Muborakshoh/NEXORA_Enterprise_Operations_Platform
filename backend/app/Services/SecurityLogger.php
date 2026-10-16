<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\SecurityEvent;
use App\Models\SuspiciousActivity;
use App\Models\User;
use App\Models\UserSession;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Throwable;

class SecurityLogger
{
    private const BRUTE_FORCE_THRESHOLD = 5;
    private const BRUTE_FORCE_WINDOW_MINUTES = 15;

    public static function signedIn(User $user, string $tokenId, Request $request): void
    {
        self::safe(function () use ($user, $tokenId, $request) {
            self::event($user, 'login_success', 'info', 'Successful sign-in', "User {$user->email} signed in.", 'authentication', $request);
            self::audit($user, 'login', 'user', $user->id, $user->email, $request);
            self::startSession($user, $tokenId, $request);
        });
    }

    public static function signedOut(User $user, string $tokenId, Request $request): void
    {
        self::safe(function () use ($user, $tokenId, $request) {
            self::event($user, 'logout', 'info', 'Sign-out', "User {$user->email} signed out.", 'authentication', $request);
            self::audit($user, 'logout', 'user', $user->id, $user->email, $request);
            UserSession::where('user_id', $user->id)->where('token_id', $tokenId)->update(['is_active' => false]);
        });
    }

    public static function loginFailed(User $user, Request $request): void
    {
        self::safe(function () use ($user, $request) {
            self::event($user, 'login_failed', 'medium', 'Failed sign-in attempt', "Wrong password for {$user->email}.", 'authentication', $request);

            $since = now()->subMinutes(self::BRUTE_FORCE_WINDOW_MINUTES);
            $failures = SecurityEvent::where('organization_id', $user->organization_id)
                ->where('user_id', $user->id)
                ->where('type', 'login_failed')
                ->where('created_at', '>=', $since)
                ->count();

            if ($failures < self::BRUTE_FORCE_THRESHOLD) {
                return;
            }

            $alreadyReported = SuspiciousActivity::where('organization_id', $user->organization_id)
                ->where('user_id', $user->id)
                ->where('type', 'brute_force')
                ->whereIn('status', ['detected', 'investigating'])
                ->where('created_at', '>=', $since)
                ->exists();

            if ($alreadyReported) {
                return;
            }

            $window = self::BRUTE_FORCE_WINDOW_MINUTES;

            SuspiciousActivity::create([
                'organization_id' => $user->organization_id,
                'type' => 'brute_force',
                'confidence' => min(95, 40 + $failures * 10),
                'title' => 'Possible brute-force attack',
                'description' => "{$failures} failed sign-ins for {$user->email} within {$window} minutes.",
                'user_id' => $user->id,
                'ip_address' => self::ip($request),
                'indicators' => [[
                    'type' => 'failed_logins',
                    'value' => (string) $failures,
                    'description' => "Failed sign-ins in the last {$window} minutes",
                    'severity' => 'high',
                ]],
                'status' => 'detected',
            ]);

            self::event($user, 'brute_force_attempt', 'high', 'Brute-force attempt detected', "{$failures} failed sign-ins for {$user->email} within {$window} minutes.", 'authentication', $request);
        });
    }

    /** Для токенов, выданных до появления журнала сессий. */
    public static function ensureSession(User $user, string $tokenId, Request $request): void
    {
        if ($tokenId === '') {
            return;
        }

        self::safe(function () use ($user, $tokenId, $request) {
            $exists = UserSession::where('user_id', $user->id)->where('token_id', $tokenId)->exists();
            if (! $exists) {
                self::startSession($user, $tokenId, $request);
            }
        });
    }

    public static function event(User $user, string $type, string $severity, string $title, string $description, string $source, Request $request, array $metadata = []): SecurityEvent
    {
        return SecurityEvent::create([
            'organization_id' => $user->organization_id,
            'type' => $type,
            'severity' => $severity,
            'title' => $title,
            'description' => $description,
            'source' => $source,
            'user_id' => $user->id,
            'ip_address' => self::ip($request),
            'user_agent' => Str::limit((string) $request->userAgent(), 250, ''),
            'metadata' => $metadata ?: null,
            'status' => 'active',
        ]);
    }

    public static function audit(User $user, string $action, string $resourceType, ?string $resourceId, ?string $resourceName, Request $request, array $metadata = []): AuditLog
    {
        $requestId = $request->header('X-Request-ID');

        return AuditLog::create([
            'organization_id' => $user->organization_id,
            'user_id' => $user->id,
            'action' => $action,
            'resource_type' => $resourceType,
            'resource_id' => $resourceId,
            'resource_name' => $resourceName,
            'ip_address' => self::ip($request),
            'user_agent' => Str::limit((string) $request->userAgent(), 250, ''),
            'request_id' => $requestId ? Str::limit((string) $requestId, 100, '') : null,
            'metadata' => $metadata ?: null,
        ]);
    }

    public static function startSession(User $user, string $tokenId, Request $request): UserSession
    {
        $ua = (string) $request->userAgent();
        $minutes = (int) config('sanctum.expiration') ?: 480;

        return UserSession::create([
            'organization_id' => $user->organization_id,
            'user_id' => $user->id,
            'token_id' => $tokenId,
            'ip_address' => self::ip($request),
            'user_agent' => Str::limit($ua, 250, ''),
            'device_type' => self::device($ua),
            'browser' => self::browser($ua),
            'os' => self::os($ua),
            'is_current' => false,
            'is_active' => true,
            'last_active_at' => now(),
            'expires_at' => now()->addMinutes($minutes),
        ]);
    }

    private static function ip(Request $request): string
    {
        return $request->ip() ?? '0.0.0.0';
    }

    private static function device(string $ua): string
    {
        if ($ua === '') {
            return 'unknown';
        }
        if (preg_match('/iPad|Tablet/i', $ua)) {
            return 'tablet';
        }
        if (preg_match('/Mobi|Android|iPhone/i', $ua)) {
            return 'mobile';
        }

        return 'desktop';
    }

    private static function browser(string $ua): string
    {
        return match (true) {
            (bool) preg_match('/Edg\//', $ua) => 'Edge',
            (bool) preg_match('/OPR\/|Opera/', $ua) => 'Opera',
            (bool) preg_match('/Firefox\//', $ua) => 'Firefox',
            (bool) preg_match('/Chrome\//', $ua) => 'Chrome',
            (bool) preg_match('/Safari\//', $ua) => 'Safari',
            default => 'Unknown',
        };
    }

    private static function os(string $ua): string
    {
        return match (true) {
            (bool) preg_match('/Windows/', $ua) => 'Windows',
            (bool) preg_match('/iPhone|iPad/', $ua) => 'iOS',
            (bool) preg_match('/Android/', $ua) => 'Android',
            (bool) preg_match('/Mac OS X/', $ua) => 'macOS',
            (bool) preg_match('/Linux/', $ua) => 'Linux',
            default => 'Unknown',
        };
    }

    private static function safe(callable $fn): void
    {
        try {
            $fn();
        } catch (Throwable $e) {
            report($e);
        }
    }
}
