<?php

namespace App\Http\Controllers\Api\V1\Concerns;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

trait ParsesFilters
{
    /** Принимает ?key=a,b или ?key[]=a&key[]=b и возвращает массив значений. */
    protected function csv(Request $request, string $key): array
    {
        return collect(Arr::wrap($request->input($key)))
            ->filter(fn ($v) => is_scalar($v))
            ->flatMap(fn ($v) => explode(',', (string) $v))
            ->map(fn ($v) => trim($v))
            ->filter()
            ->values()
            ->all();
    }

    protected function limitOffset(Request $request, int $default = 50, int $max = 200): array
    {
        $limit = min(max((int) $request->input('limit', $default), 1), $max);
        $offset = max((int) $request->input('offset', 0), 0);

        return [$limit, $offset];
    }

    protected function applyDates($query, Request $request, string $column = 'created_at')
    {
        $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
        ]);

        if ($request->filled('date_from')) {
            $query->where($column, '>=', $request->input('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->where($column, '<=', $request->input('date_to'));
        }

        return $query;
    }

    protected function orgModel(Request $request, string $model, string $id, array $with = [])
    {
        abort_unless(Str::isUuid($id), 404);

        return $model::where('organization_id', $request->user()->organization_id)
            ->with($with)
            ->findOrFail($id);
    }

    protected function ok(mixed $data, int $status = 200): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $data], $status);
    }
}
