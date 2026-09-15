/**
 * AI API Service
 * 
 * API client for AI module: Assistant, Tools, Analytics, Anomaly Detection, Recommendations.
 */

import { apiClient } from './client';
import type {
  AIAssistant,
  AssistantListResponse,
  CreateAssistantRequest,
  UpdateAssistantRequest,
  AssistantFilters,
  AIConversation,
  AIMessage,
  AITool,
  ToolListResponse,
  CreateToolRequest,
  UpdateToolRequest,
  ToolFilters,
  ToolExecution,
  AIAnalytics,
  AnalyticsListResponse,
  CreateAnalyticsRequest,
  UpdateAnalyticsRequest,
  AnalyticsFilters,
  AnalyticsResult,
  AnomalyDetector,
  AnomalyDetectorListResponse,
  CreateAnomalyDetectorRequest,
  UpdateAnomalyDetectorRequest,
  AnomalyDetectorFilters,
  Anomaly,
  AnomalyListResponse,
  AnomalyFilters,
  Recommendation,
  RecommendationListResponse,
  RecommendationFilters,
  AIStats,
} from '../types/ai';

/**
 * AI Assistants API
 */
export const assistantsApi = {
  /**
   * List assistants with filters
   */
  list: (filters?: AssistantFilters) =>
    apiClient.get<AssistantListResponse>('/ai/assistants', { params: filters as any }),

  /**
   * Get assistant by ID
   */
  get: (assistantId: string) =>
    apiClient.get<AIAssistant>(`/ai/assistants/${assistantId}`),

  /**
   * Create new assistant
   */
  create: (data: CreateAssistantRequest) =>
    apiClient.post<AIAssistant>('/ai/assistants', data),

  /**
   * Update assistant
   */
  update: (assistantId: string, data: UpdateAssistantRequest) =>
    apiClient.put<AIAssistant>(`/ai/assistants/${assistantId}`, data),

  /**
   * Delete assistant
   */
  delete: (assistantId: string) =>
    apiClient.delete<void>(`/ai/assistants/${assistantId}`),

  /**
   * Send message to assistant
   */
  sendMessage: (assistantId: string, message: string, conversationId?: string) =>
    apiClient.post<{ message: AIMessage; conversation_id: string }>(
      `/ai/assistants/${assistantId}/chat`,
      { message, conversation_id: conversationId }
    ),

  /**
   * Get conversation history
   */
  getConversation: (conversationId: string) =>
    apiClient.get<AIConversation>(`/ai/conversations/${conversationId}`),

  /**
   * List conversations
   */
  listConversations: (assistantId?: string) =>
    apiClient.get<{ conversations: AIConversation[] }>('/ai/conversations', {
      params: { assistant_id: assistantId }
    }),
};

/**
 * AI Tools API
 */
export const toolsApi = {
  /**
   * List tools with filters
   */
  list: (filters?: ToolFilters) =>
    apiClient.get<ToolListResponse>('/ai/tools', { params: filters as any }),

  /**
   * Get tool by ID
   */
  get: (toolId: string) =>
    apiClient.get<AITool>(`/ai/tools/${toolId}`),

  /**
   * Create new tool
   */
  create: (data: CreateToolRequest) =>
    apiClient.post<AITool>('/ai/tools', data),

  /**
   * Update tool
   */
  update: (toolId: string, data: UpdateToolRequest) =>
    apiClient.put<AITool>(`/ai/tools/${toolId}`, data),

  /**
   * Delete tool
   */
  delete: (toolId: string) =>
    apiClient.delete<void>(`/ai/tools/${toolId}`),

  /**
   * Execute tool
   */
  execute: (toolId: string, args: Record<string, unknown>) =>
    apiClient.post<ToolExecution>(`/ai/tools/${toolId}/execute`, { arguments: args }),

  /**
   * Get tool execution history
   */
  getExecutions: (toolId?: string, limit?: number) =>
    apiClient.get<{ executions: ToolExecution[] }>('/ai/tools/executions', {
      params: { tool_id: toolId, limit }
    }),
};

/**
 * AI Analytics API
 */
export const aiAnalyticsApi = {
  /**
   * List analytics with filters
   */
  list: (filters?: AnalyticsFilters) =>
    apiClient.get<AnalyticsListResponse>('/ai/analytics', { params: filters as any }),

  /**
   * Get analytics by ID
   */
  get: (analyticsId: string) =>
    apiClient.get<AIAnalytics>(`/ai/analytics/${analyticsId}`),

  /**
   * Create new analytics
   */
  create: (data: CreateAnalyticsRequest) =>
    apiClient.post<AIAnalytics>('/ai/analytics', data),

  /**
   * Update analytics
   */
  update: (analyticsId: string, data: UpdateAnalyticsRequest) =>
    apiClient.put<AIAnalytics>(`/ai/analytics/${analyticsId}`, data),

  /**
   * Delete analytics
   */
  delete: (analyticsId: string) =>
    apiClient.delete<void>(`/ai/analytics/${analyticsId}`),

  /**
   * Run analytics
   */
  run: (analyticsId: string) =>
    apiClient.post<AnalyticsResult>(`/ai/analytics/${analyticsId}/run`),

  /**
   * Get analytics results
   */
  getResults: (analyticsId: string, limit?: number) =>
    apiClient.get<{ results: AnalyticsResult[] }>(`/ai/analytics/${analyticsId}/results`, {
      params: { limit }
    }),

  /**
   * Toggle schedule
   */
  toggleSchedule: (analyticsId: string, enabled: boolean) =>
    apiClient.post<AIAnalytics>(`/ai/analytics/${analyticsId}/toggle-schedule`, { enabled }),
};

/**
 * Anomaly Detection API
 */
export const anomalyApi = {
  /**
   * List anomaly detectors with filters
   */
  listDetectors: (filters?: AnomalyDetectorFilters) =>
    apiClient.get<AnomalyDetectorListResponse>('/ai/anomaly/detectors', { params: filters as any }),

  /**
   * Get detector by ID
   */
  getDetector: (detectorId: string) =>
    apiClient.get<AnomalyDetector>(`/ai/anomaly/detectors/${detectorId}`),

  /**
   * Create new detector
   */
  createDetector: (data: CreateAnomalyDetectorRequest) =>
    apiClient.post<AnomalyDetector>('/ai/anomaly/detectors', data),

  /**
   * Update detector
   */
  updateDetector: (detectorId: string, data: UpdateAnomalyDetectorRequest) =>
    apiClient.put<AnomalyDetector>(`/ai/anomaly/detectors/${detectorId}`, data),

  /**
   * Delete detector
   */
  deleteDetector: (detectorId: string) =>
    apiClient.delete<void>(`/ai/anomaly/detectors/${detectorId}`),

  /**
   * Toggle detector
   */
  toggleDetector: (detectorId: string, enabled: boolean) =>
    apiClient.post<AnomalyDetector>(`/ai/anomaly/detectors/${detectorId}/toggle`, { enabled }),

  /**
   * List anomalies with filters
   */
  listAnomalies: (filters?: AnomalyFilters) =>
    apiClient.get<AnomalyListResponse>('/ai/anomaly/anomalies', { params: filters as any }),

  /**
   * Get anomaly by ID
   */
  getAnomaly: (anomalyId: string) =>
    apiClient.get<Anomaly>(`/ai/anomaly/anomalies/${anomalyId}`),

  /**
   * Update anomaly status
   */
  updateAnomalyStatus: (anomalyId: string, status: string) =>
    apiClient.post<Anomaly>(`/ai/anomaly/anomalies/${anomalyId}/status`, { status }),

  /**
   * Resolve anomaly
   */
  resolveAnomaly: (anomalyId: string, resolution?: string) =>
    apiClient.post<Anomaly>(`/ai/anomaly/anomalies/${anomalyId}/resolve`, { resolution }),
};

/**
 * Recommendations API
 */
export const recommendationsApi = {
  /**
   * List recommendations with filters
   */
  list: (filters?: RecommendationFilters) =>
    apiClient.get<RecommendationListResponse>('/ai/recommendations', { params: filters as any }),

  /**
   * Get recommendation by ID
   */
  get: (recommendationId: string) =>
    apiClient.get<Recommendation>(`/ai/recommendations/${recommendationId}`),

  /**
   * Accept recommendation
   */
  accept: (recommendationId: string) =>
    apiClient.post<Recommendation>(`/ai/recommendations/${recommendationId}/accept`),

  /**
   * Reject recommendation
   */
  reject: (recommendationId: string, reason?: string) =>
    apiClient.post<Recommendation>(`/ai/recommendations/${recommendationId}/reject`, { reason }),

  /**
   * Mark as implemented
   */
  markImplemented: (recommendationId: string) =>
    apiClient.post<Recommendation>(`/ai/recommendations/${recommendationId}/implement`),

  /**
   * Refresh recommendations
   */
  refresh: () =>
    apiClient.post<RecommendationListResponse>('/ai/recommendations/refresh'),
};

/**
 * AI Statistics API
 */
export const aiStatsApi = {
  /**
   * Get AI statistics
   */
  get: () =>
    apiClient.get<AIStats>('/ai/stats'),
};
