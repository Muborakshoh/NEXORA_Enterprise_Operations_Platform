<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CustomerController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\SecurityEventController;
use App\Http\Controllers\Api\V1\AuditLogController;
use App\Http\Controllers\Api\V1\SecurityRuleController;
use App\Http\Controllers\Api\V1\SecurityStatsController;
use App\Http\Controllers\Api\V1\SessionController;
use App\Http\Controllers\Api\V1\SuspiciousActivityController;
use App\Http\Controllers\Api\V1\ServerController;
use App\Http\Controllers\Api\V1\TransactionController;
use App\Http\Controllers\Api\V1\AnalyticsDashboardController;
use App\Http\Controllers\Api\V1\AnalyticsReportController;
use App\Http\Controllers\Api\V1\AnalyticsExportController;
use App\Http\Controllers\Api\V1\AnalyticsAggregationController;
use App\Http\Controllers\Api\V1\AnalyticsDataSourceController;
use App\Http\Controllers\Api\V1\AnalyticsStatsController;
use App\Http\Controllers\Api\V1\AIAssistantController;
use App\Http\Controllers\Api\V1\AIToolController;
use App\Http\Controllers\Api\V1\AIAnalyticsController;
use App\Http\Controllers\Api\V1\AIAnomalyController;
use App\Http\Controllers\Api\V1\AIRecommendationController;
use App\Http\Controllers\Api\V1\AIStatsController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public routes
Route::prefix('v1')->group(function () {
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
});

// Protected routes
Route::prefix('v1')->middleware('auth:sanctum')->group(function () {
    // Authentication
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/user', [AuthController::class, 'user']);

    // CRM
    Route::apiResource('customers', CustomerController::class);

    // Finance
    Route::apiResource('transactions', TransactionController::class);

    // Inventory
    Route::apiResource('products', ProductController::class);

    // Infrastructure
    Route::apiResource('servers', ServerController::class);

    // Security: events
    Route::get('security/events', [SecurityEventController::class, 'index']);
    Route::get('security/events/{id}', [SecurityEventController::class, 'show']);
    Route::post('security/events/{id}/acknowledge', [SecurityEventController::class, 'acknowledge']);
    Route::post('security/events/{id}/resolve', [SecurityEventController::class, 'resolve']);
    Route::post('security/events/{id}/false-positive', [SecurityEventController::class, 'markFalsePositive']);

    // Security: audit log
    Route::get('security/audit', [AuditLogController::class, 'index']);
    Route::get('security/audit/export', [AuditLogController::class, 'export']);
    Route::get('security/audit/{id}', [AuditLogController::class, 'show']);

    // Security: sessions
    Route::get('security/sessions', [SessionController::class, 'index']);
    Route::get('security/sessions/current', [SessionController::class, 'current']);
    Route::post('security/sessions/revoke-others', [SessionController::class, 'revokeOthers']);
    Route::get('security/sessions/{id}', [SessionController::class, 'show']);
    Route::post('security/sessions/{id}/revoke', [SessionController::class, 'revoke']);

    // Security: suspicious activity
    Route::get('security/suspicious', [SuspiciousActivityController::class, 'index']);
    Route::get('security/suspicious/{id}', [SuspiciousActivityController::class, 'show']);
    Route::post('security/suspicious/{id}/investigate', [SuspiciousActivityController::class, 'investigate']);
    Route::post('security/suspicious/{id}/confirm', [SuspiciousActivityController::class, 'confirm']);
    Route::post('security/suspicious/{id}/false-positive', [SuspiciousActivityController::class, 'markFalsePositive']);
    Route::post('security/suspicious/{id}/resolve', [SuspiciousActivityController::class, 'resolve']);

    // Security: statistics and rules
    Route::get('security/stats', [SecurityStatsController::class, 'show']);
    Route::get('security/rules', [SecurityRuleController::class, 'index']);
    Route::post('security/rules', [SecurityRuleController::class, 'store']);
    Route::get('security/rules/{id}', [SecurityRuleController::class, 'show']);
    Route::put('security/rules/{id}', [SecurityRuleController::class, 'update']);
    Route::delete('security/rules/{id}', [SecurityRuleController::class, 'destroy']);
    Route::post('security/rules/{id}/toggle', [SecurityRuleController::class, 'toggle']);

    // Analytics: dashboards
    Route::get('analytics/dashboards', [AnalyticsDashboardController::class, 'index']);
    Route::post('analytics/dashboards', [AnalyticsDashboardController::class, 'store']);
    Route::get('analytics/dashboards/{id}', [AnalyticsDashboardController::class, 'show']);
    Route::put('analytics/dashboards/{id}', [AnalyticsDashboardController::class, 'update']);
    Route::delete('analytics/dashboards/{id}', [AnalyticsDashboardController::class, 'destroy']);
    Route::post('analytics/dashboards/{id}/set-default', [AnalyticsDashboardController::class, 'setDefault']);

    // Analytics: reports
    Route::get('analytics/reports', [AnalyticsReportController::class, 'index']);
    Route::post('analytics/reports', [AnalyticsReportController::class, 'store']);
    Route::get('analytics/reports/{id}', [AnalyticsReportController::class, 'show']);
    Route::put('analytics/reports/{id}', [AnalyticsReportController::class, 'update']);
    Route::delete('analytics/reports/{id}', [AnalyticsReportController::class, 'destroy']);
    Route::post('analytics/reports/{id}/execute', [AnalyticsReportController::class, 'execute']);
    Route::post('analytics/reports/{id}/toggle-schedule', [AnalyticsReportController::class, 'toggleSchedule']);
    Route::get('analytics/report-executions/{executionId}', [AnalyticsReportController::class, 'showExecution']);

    // Analytics: exports
    Route::get('analytics/exports', [AnalyticsExportController::class, 'index']);
    Route::post('analytics/exports', [AnalyticsExportController::class, 'store']);
    Route::get('analytics/exports/{id}', [AnalyticsExportController::class, 'show']);
    Route::delete('analytics/exports/{id}', [AnalyticsExportController::class, 'destroy']);
    Route::get('analytics/exports/{id}/download', [AnalyticsExportController::class, 'download']);
    Route::get('analytics/exports/{id}/status', [AnalyticsExportController::class, 'status']);

    // Analytics: aggregations
    Route::get('analytics/aggregations', [AnalyticsAggregationController::class, 'index']);
    Route::post('analytics/aggregations', [AnalyticsAggregationController::class, 'store']);
    Route::get('analytics/aggregations/{id}', [AnalyticsAggregationController::class, 'show']);
    Route::put('analytics/aggregations/{id}', [AnalyticsAggregationController::class, 'update']);
    Route::delete('analytics/aggregations/{id}', [AnalyticsAggregationController::class, 'destroy']);
    Route::post('analytics/aggregations/{id}/execute', [AnalyticsAggregationController::class, 'execute']);
    Route::get('analytics/aggregations/{id}/results', [AnalyticsAggregationController::class, 'results']);

    // Analytics: data sources
    Route::get('analytics/data-sources', [AnalyticsDataSourceController::class, 'index']);
    Route::get('analytics/data-sources/{id}', [AnalyticsDataSourceController::class, 'show']);
    Route::get('analytics/data-sources/{id}/schema', [AnalyticsDataSourceController::class, 'schema']);

    // Analytics: stats
    Route::get('analytics/stats', [AnalyticsStatsController::class, 'show']);

    // AI: assistants
    Route::get('ai/assistants', [AIAssistantController::class, 'index']);
    Route::post('ai/assistants', [AIAssistantController::class, 'store']);
    Route::get('ai/assistants/{id}', [AIAssistantController::class, 'show']);
    Route::put('ai/assistants/{id}', [AIAssistantController::class, 'update']);
    Route::delete('ai/assistants/{id}', [AIAssistantController::class, 'destroy']);
    Route::post('ai/assistants/{id}/chat', [AIAssistantController::class, 'sendMessage']);
    Route::get('ai/conversations', [AIAssistantController::class, 'conversations']);
    Route::get('ai/conversations/{id}', [AIAssistantController::class, 'showConversation']);

    // AI: tools
    Route::get('ai/tools', [AIToolController::class, 'index']);
    Route::post('ai/tools', [AIToolController::class, 'store']);
    Route::get('ai/tools/{id}', [AIToolController::class, 'show']);
    Route::put('ai/tools/{id}', [AIToolController::class, 'update']);
    Route::delete('ai/tools/{id}', [AIToolController::class, 'destroy']);
    Route::post('ai/tools/{id}/execute', [AIToolController::class, 'execute']);
    Route::get('ai/tools/executions', [AIToolController::class, 'executions']);

    // AI: analytics
    Route::get('ai/analytics', [AIAnalyticsController::class, 'index']);
    Route::post('ai/analytics', [AIAnalyticsController::class, 'store']);
    Route::get('ai/analytics/{id}', [AIAnalyticsController::class, 'show']);
    Route::put('ai/analytics/{id}', [AIAnalyticsController::class, 'update']);
    Route::delete('ai/analytics/{id}', [AIAnalyticsController::class, 'destroy']);
    Route::post('ai/analytics/{id}/run', [AIAnalyticsController::class, 'run']);
    Route::get('ai/analytics/{id}/results', [AIAnalyticsController::class, 'results']);
    Route::post('ai/analytics/{id}/toggle-schedule', [AIAnalyticsController::class, 'toggleSchedule']);

    // AI: anomaly detection
    Route::get('ai/anomaly/detectors', [AIAnomalyController::class, 'detectorsIndex']);
    Route::post('ai/anomaly/detectors', [AIAnomalyController::class, 'detectorsStore']);
    Route::get('ai/anomaly/detectors/{id}', [AIAnomalyController::class, 'detectorsShow']);
    Route::put('ai/anomaly/detectors/{id}', [AIAnomalyController::class, 'detectorsUpdate']);
    Route::delete('ai/anomaly/detectors/{id}', [AIAnomalyController::class, 'detectorsDestroy']);
    Route::post('ai/anomaly/detectors/{id}/toggle', [AIAnomalyController::class, 'detectorsToggle']);
    Route::get('ai/anomaly/anomalies', [AIAnomalyController::class, 'anomaliesIndex']);
    Route::get('ai/anomaly/anomalies/{id}', [AIAnomalyController::class, 'anomaliesShow']);
    Route::post('ai/anomaly/anomalies/{id}/status', [AIAnomalyController::class, 'anomaliesUpdateStatus']);
    Route::post('ai/anomaly/anomalies/{id}/resolve', [AIAnomalyController::class, 'anomaliesResolve']);

    // AI: recommendations
    Route::get('ai/recommendations', [AIRecommendationController::class, 'index']);
    Route::get('ai/recommendations/{id}', [AIRecommendationController::class, 'show']);
    Route::post('ai/recommendations/{id}/accept', [AIRecommendationController::class, 'accept']);
    Route::post('ai/recommendations/{id}/reject', [AIRecommendationController::class, 'reject']);
    Route::post('ai/recommendations/{id}/implement', [AIRecommendationController::class, 'implement']);
    Route::post('ai/recommendations/refresh', [AIRecommendationController::class, 'refresh']);

    // AI: stats
    Route::get('ai/stats', [AIStatsController::class, 'show']);
});
