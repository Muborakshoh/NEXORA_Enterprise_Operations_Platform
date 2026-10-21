<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;

use App\Models\AnalyticsDataSource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class AnalyticsDataSourceController extends Controller
{
    public function index(): JsonResponse
    {
        $user = Auth::user();
        $items = AnalyticsDataSource::where('organization_id', $user->organization_id ?? $user->id)
            ->orderBy('name')
            ->get();

        return response()->json([
            'data_sources' => $items,
            'total' => $items->count(),
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $item = AnalyticsDataSource::findOrFail($id);
        return response()->json($item);
    }

    public function schema(string $id): JsonResponse
    {
        $item = AnalyticsDataSource::findOrFail($id);
        return response()->json($item->schema ?? ['fields' => []]);
    }
}
