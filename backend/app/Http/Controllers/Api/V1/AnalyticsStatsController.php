<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;

use App\Models\AnalyticsDashboard;
use App\Models\AnalyticsReport;
use App\Models\AnalyticsExport;
use App\Models\AnalyticsAggregation;
use App\Models\AnalyticsDataSource;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class AnalyticsStatsController extends Controller
{
    public function show(): JsonResponse
    {
        $orgId = Auth::user()->organization_id ?? Auth::id();

        return response()->json([
            'total_dashboards' => AnalyticsDashboard::where('organization_id', $orgId)->count(),
            'total_reports' => AnalyticsReport::where('organization_id', $orgId)->count(),
            'total_exports' => AnalyticsExport::where('organization_id', $orgId)->count(),
            'total_aggregations' => AnalyticsAggregation::where('organization_id', $orgId)->count(),
            'active_dashboards' => AnalyticsDashboard::where('organization_id', $orgId)->where('is_default', true)->count(),
            'scheduled_reports' => AnalyticsReport::where('organization_id', $orgId)->whereNotNull('schedule')->count(),
            'pending_exports' => AnalyticsExport::where('organization_id', $orgId)->where('status', 'pending')->count(),
            'data_sources_count' => AnalyticsDataSource::where('organization_id', $orgId)->count(),
        ]);
    }
}
