<?php

namespace Database\Seeders;

use App\Models\AuditLog;
use App\Models\SecurityEvent;
use App\Models\SecurityRule;
use App\Models\SuspiciousActivity;
use App\Models\User;
use Illuminate\Database\Seeder;

class SecurityDemoSeeder extends Seeder
{
    public function run(): void
    {
        $email = env('DEMO_EMAIL');
        $user = $email ? User::where('email', $email)->first() : null;

        if (! $user) {
            $this->command->error('Укажите существующий email: DEMO_EMAIL=you@example.com');

            return;
        }

        $org = $user->organization_id;

        // Удаляем прежние демо-записи (адреса из диапазона 203.0.113.x)
        SecurityEvent::where('organization_id', $org)->where('ip_address', 'like', '203.0.113.%')->delete();
        AuditLog::where('organization_id', $org)->where('ip_address', 'like', '203.0.113.%')->delete();
        SuspiciousActivity::where('organization_id', $org)->where('ip_address', 'like', '203.0.113.%')->delete();
        SecurityRule::where('organization_id', $org)->where('name', 'like', 'Demo:%')->delete();

        $events = [
            ['login_success', 'info', 'Successful sign-in', 'Administrator signed in from a known device.', 'authentication', 'active', 1],
            ['login_failed', 'medium', 'Failed sign-in attempt', 'Wrong password entered for the admin account.', 'authentication', 'active', 2],
            ['brute_force_attempt', 'critical', 'Brute-force attempt blocked', '12 failed sign-ins in 3 minutes from one address.', 'authentication', 'active', 3],
            ['unauthorized_access', 'high', 'Access to restricted resource denied', 'User tried to open billing settings without permission.', 'authorization', 'acknowledged', 5],
            ['password_changed', 'low', 'Password changed', 'User changed the account password.', 'user', 'resolved', 8],
            ['api_key_created', 'info', 'API key created', 'A new API key was generated.', 'api', 'resolved', 12],
            ['suspicious_login', 'high', 'Sign-in from unusual location', 'Sign-in from a country not seen before.', 'authentication', 'active', 20],
            ['data_export', 'medium', 'Large data export', 'Customer list exported (4,200 rows).', 'user', 'acknowledged', 26],
            ['permission_changed', 'medium', 'Role permissions changed', 'Manager role received extra permissions.', 'admin', 'resolved', 30],
            ['login_failed', 'low', 'Failed sign-in attempt', 'Unknown email entered on the sign-in form.', 'authentication', 'false_positive', 40],
            ['2fa_disabled', 'high', 'Two-factor authentication disabled', '2FA was turned off for a user account.', 'admin', 'active', 48],
            ['logout', 'info', 'Sign-out', 'User signed out.', 'user', 'resolved', 50],
        ];

        foreach ($events as $i => [$type, $severity, $title, $description, $source, $status, $hoursAgo]) {
            (new SecurityEvent)->forceFill([
                'organization_id' => $org,
                'user_id' => $user->id,
                'type' => $type,
                'severity' => $severity,
                'title' => $title,
                'description' => $description,
                'source' => $source,
                'ip_address' => '203.0.113.' . (10 + $i),
                'user_agent' => 'NEXORA demo seed',
                'status' => $status,
                'acknowledged' => $status === 'acknowledged',
                'acknowledged_by' => $status === 'acknowledged' ? $user->id : null,
                'acknowledged_at' => $status === 'acknowledged' ? now()->subHours($hoursAgo - 1) : null,
                'resolved_at' => $status === 'resolved' ? now()->subHours($hoursAgo - 1) : null,
                'created_at' => now()->subHours($hoursAgo),
                'updated_at' => now()->subHours($hoursAgo),
            ])->save();
        }

        $actions = ['create', 'update', 'delete', 'read', 'export', 'login'];
        $resources = ['customer', 'product', 'invoice', 'server'];

        for ($i = 0; $i < 15; $i++) {
            (new AuditLog)->forceFill([
                'organization_id' => $org,
                'user_id' => $user->id,
                'action' => $actions[$i % count($actions)],
                'resource_type' => $resources[$i % count($resources)],
                'resource_name' => 'Demo item ' . ($i + 1),
                'ip_address' => '203.0.113.' . (50 + $i),
                'user_agent' => 'NEXORA demo seed',
                'created_at' => now()->subHours($i * 3 + 1),
                'updated_at' => now()->subHours($i * 3 + 1),
            ])->save();
        }

        $suspicious = [
            ['brute_force', 85, 'Possible brute-force attack', '9 failed sign-ins within 15 minutes.', 'detected',
                [['type' => 'failed_logins', 'value' => '9', 'description' => 'Failed sign-ins in 15 minutes', 'severity' => 'high']], 4],
            ['unusual_location', 60, 'Sign-in from a new country', 'Sign-in from a location not seen before.', 'investigating',
                [['type' => 'geo', 'value' => 'unknown', 'description' => 'First sign-in from this country', 'severity' => 'medium']], 22],
            ['rapid_requests', 45, 'Unusually high request rate', '400 requests per minute from one address.', 'false_positive',
                [['type' => 'rate', 'value' => '400/min', 'description' => 'Request rate above threshold', 'severity' => 'low']], 60],
        ];

        foreach ($suspicious as $i => [$type, $confidence, $title, $description, $status, $indicators, $hoursAgo]) {
            (new SuspiciousActivity)->forceFill([
                'organization_id' => $org,
                'user_id' => $user->id,
                'type' => $type,
                'confidence' => $confidence,
                'title' => $title,
                'description' => $description,
                'ip_address' => '203.0.113.' . (100 + $i),
                'indicators' => $indicators,
                'status' => $status,
                'reviewed' => $status === 'false_positive',
                'created_at' => now()->subHours($hoursAgo),
                'updated_at' => now()->subHours($hoursAgo),
            ])->save();
        }

        $rules = [
            ['Demo: Brute-force detection', 'detection', [['field' => 'failed_logins', 'operator' => 'gt', 'value' => 5]], [['type' => 'alert', 'config' => []]], 90],
            ['Demo: Block unknown countries', 'prevention', [['field' => 'country', 'operator' => 'neq', 'value' => 'TJ']], [['type' => 'block', 'config' => []]], 50],
            ['Demo: Notify on data export', 'notification', [['field' => 'action', 'operator' => 'eq', 'value' => 'export']], [['type' => 'notify', 'config' => ['channel' => 'email']]], 10],
        ];

        foreach ($rules as [$name, $type, $conditions, $actionsList, $priority]) {
            SecurityRule::create([
                'organization_id' => $org,
                'name' => $name,
                'description' => 'Demo rule',
                'type' => $type,
                'conditions' => $conditions,
                'actions' => $actionsList,
                'priority' => $priority,
                'enabled' => true,
            ]);
        }

        $this->command->info('Демо-данные Security созданы для ' . $user->email);
    }
}
