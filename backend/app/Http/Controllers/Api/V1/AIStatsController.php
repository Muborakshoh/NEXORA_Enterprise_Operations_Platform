<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;

use App\Models\AIAssistant;
use App\Models\AIConversation;
use App\Models\AITool;
use App\Models\AIAnalytics;
use App\Models\AIAnomalyDetector;
use App\Models\AIAnomaly;
use App\Models\AIRecommendation;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class AIStatsController extends Controller
{
    public function show(): JsonResponse
    {
        $orgId = Auth::user()->organization_id ?? Auth::id();

        return response()->json([
            'total_assistants' => AIAssistant::where('organization_id', $orgId)->count(),
            'active_assistants' => AIAssistant::where('organization_id', $orgId)->where('is_active', true)->count(),
            'total_conversations' => AIConversation::whereHas('assistant', function ($q) use ($orgId) {
                $q->where('organization_id', $orgId);
            })->count(),
            'total_tools' => AITool::where('organization_id', $orgId)->count(),
            'enabled_tools' => AITool::where('organization_id', $orgId)->where('enabled', true)->count(),
            'total_analytics' => AIAnalytics::where('organization_id', $orgId)->count(),
            'active_analytics' => AIAnalytics::where('organization_id', $orgId)->whereNotNull('schedule')->count(),
            'total_anomalies' => AIAnomaly::whereHas('detector', function ($q) use ($orgId) {
                $q->where('organization_id', $orgId);
            })->count(),
            'active_anomalies' => AIAnomaly::whereHas('detector', function ($q) use ($orgId) {
                $q->where('organization_id', $orgId);
            })->whereIn('status', ['detected', 'investigating'])->count(),
            'total_recommendations' => AIRecommendation::where('organization_id', $orgId)->count(),
            'new_recommendations' => AIRecommendation::where('organization_id', $orgId)->where('status', 'new')->count(),
        ]);
    }
}
