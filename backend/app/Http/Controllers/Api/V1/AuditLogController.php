<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ParsesFilters;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AuditLogController extends Controller
{
    use ParsesFilters;

    private function filtered(Request $request)
    {
        $request->validate([
            'user_id' => 'nullable|uuid',
            'resource_id' => 'nullable|uuid',
        ]);

        $query = AuditLog::where('organization_id', $request->user()->organization_id);

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }
        if ($request->filled('resource_id')) {
            $query->where('resource_id', $request->input('resource_id'));
        }
        if ($actions = $this->csv($request, 'action')) {
            $query->whereIn('action', $actions);
        }
        if ($types = $this->csv($request, 'resource_type')) {
            $query->whereIn('resource_type', $types);
        }
        if ($request->filled('ip_address')) {
            $query->where('ip_address', $request->input('ip_address'));
        }
        if ($request->filled('search') && is_string($request->input('search'))) {
            $search = '%' . $request->input('search') . '%';
            $query->where(function ($q) use ($search) {
                $q->where('resource_name', 'ilike', $search)
                    ->orWhere('resource_type', 'ilike', $search)
                    ->orWhere('action', 'ilike', $search);
            });
        }

        return $this->applyDates($query, $request);
    }

    public function index(Request $request): JsonResponse
    {
        [$limit, $offset] = $this->limitOffset($request);

        $query = $this->filtered($request);
        $total = (clone $query)->count();

        $logs = $query->with('user:id,name,email')
            ->orderByDesc('created_at')
            ->skip($offset)
            ->take($limit)
            ->get();

        return $this->ok([
            'logs' => $logs,
            'total' => $total,
            'has_more' => $offset + $logs->count() < $total,
        ]);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        return $this->ok($this->orgModel($request, AuditLog::class, $id, ['user:id,name,email']));
    }

    public function export(Request $request): StreamedResponse
    {
        $format = $request->input('format') === 'json' ? 'json' : 'csv';

        $logs = $this->filtered($request)
            ->with('user:id,name,email')
            ->orderByDesc('created_at')
            ->limit(10000)
            ->get();

        if ($format === 'json') {
            return response()->streamDownload(function () use ($logs) {
                echo $logs->toJson();
            }, 'audit-logs.json', ['Content-Type' => 'application/json']);
        }

        return response()->streamDownload(function () use ($logs) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['id', 'created_at', 'user_email', 'action', 'resource_type', 'resource_id', 'resource_name', 'ip_address'], ',', '"', '');

            foreach ($logs as $log) {
                fputcsv($out, array_map([$this, 'cell'], [
                    $log->id,
                    $log->created_at?->toIso8601String(),
                    $log->user?->email,
                    $log->action,
                    $log->resource_type,
                    $log->resource_id,
                    $log->resource_name,
                    $log->ip_address,
                ]), ',', '"', '');
            }

            fclose($out);
        }, 'audit-logs.csv', ['Content-Type' => 'text/csv']);
    }

    /** Защита от CSV-инъекций: ячейки, начинающиеся с = + - @, экранируются. */
    private function cell(mixed $value): string
    {
        $text = (string) ($value ?? '');

        return preg_match('/^[=+\-@\t\r]/', $text) ? "'" . $text : $text;
    }
}
