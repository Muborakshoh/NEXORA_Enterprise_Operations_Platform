/**
 * AI Types
 * 
 * Type definitions for AI module: Assistant, Tools, Analytics, Anomaly Detection, Recommendations.
 */

// ─── AI Assistant Types ─────────────────────────────────────────────────────

export interface AIAssistant {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  model: AIModel;
  capabilities: AICapability[];
  config: AssistantConfig;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type AIModel = 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3' | 'gemini-pro' | 'custom';

export type AICapability = 
  | 'chat'
  | 'analysis'
  | 'prediction'
  | 'anomaly_detection'
  | 'recommendation'
  | 'data_query'
  | 'report_generation';

export interface AssistantConfig {
  temperature: number;
  max_tokens: number;
  system_prompt?: string;
  context_window: number;
  tools_enabled: boolean;
  allowed_tools?: string[];
}

export interface AIConversation {
  id: string;
  assistant_id: string;
  user_id: string;
  title: string;
  messages: AIMessage[];
  context?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_calls?: ToolCall[];
  tool_results?: ToolResult[];
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  tool_call_id: string;
  name: string;
  result: unknown;
  error?: string;
}

export interface AssistantListResponse {
  assistants: AIAssistant[];
  total: number;
}

export interface CreateAssistantRequest {
  name: string;
  description?: string;
  model: AIModel;
  capabilities: AICapability[];
  config?: Partial<AssistantConfig>;
}

export interface UpdateAssistantRequest {
  name?: string;
  description?: string;
  capabilities?: AICapability[];
  config?: Partial<AssistantConfig>;
  is_active?: boolean;
}

// ─── AI Tools Types ─────────────────────────────────────────────────────────

export interface AITool {
  id: string;
  organization_id: string;
  name: string;
  description: string;
  category: ToolCategory;
  parameters: ToolParameter[];
  return_type: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export type ToolCategory = 
  | 'data_query'
  | 'analysis'
  | 'visualization'
  | 'export'
  | 'notification'
  | 'automation'
  | 'custom';

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  default?: unknown;
  enum?: string[];
}

export interface ToolListResponse {
  tools: AITool[];
  total: number;
}

export interface CreateToolRequest {
  name: string;
  description: string;
  category: ToolCategory;
  parameters: ToolParameter[];
  return_type: string;
}

export interface UpdateToolRequest {
  name?: string;
  description?: string;
  parameters?: ToolParameter[];
  enabled?: boolean;
}

export interface ToolExecution {
  id: string;
  tool_id: string;
  tool_name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  error?: string;
  execution_time_ms: number;
  created_at: string;
}

// ─── AI Analytics Types ─────────────────────────────────────────────────────

export interface AIAnalytics {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  type: AnalyticsType;
  data_source: string;
  query: AnalyticsQuery;
  schedule?: AnalyticsSchedule;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_run_at?: string;
}

export type AnalyticsType = 
  | 'trend_analysis'
  | 'pattern_detection'
  | 'correlation_analysis'
  | 'forecasting'
  | 'segmentation'
  | 'clustering';

export interface AnalyticsQuery {
  metrics: string[];
  dimensions?: string[];
  filters?: Record<string, unknown>;
  time_range?: {
    type: 'relative' | 'absolute';
    relative?: { amount: number; unit: 'days' | 'weeks' | 'months' | 'years' };
    absolute?: { start: string; end: string };
  };
  parameters?: Record<string, unknown>;
}

export interface AnalyticsSchedule {
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  enabled: boolean;
  last_run_at?: string;
  next_run_at?: string;
}

export interface AnalyticsResult {
  id: string;
  analytics_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: AnalyticsData;
  error?: string;
  started_at: string;
  completed_at?: string;
}

export interface AnalyticsData {
  summary: Record<string, unknown>;
  insights: AnalyticsInsight[];
  visualizations?: VisualizationData[];
  recommendations?: string[];
}

export interface AnalyticsInsight {
  type: 'trend' | 'pattern' | 'anomaly' | 'correlation' | 'outlier';
  title: string;
  description: string;
  confidence: number;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  data?: Record<string, unknown>;
}

export interface VisualizationData {
  type: 'line_chart' | 'bar_chart' | 'scatter_plot' | 'heatmap' | 'pie_chart';
  title: string;
  data: unknown[];
  config?: Record<string, unknown>;
}

export interface AnalyticsListResponse {
  analytics: AIAnalytics[];
  total: number;
}

export interface CreateAnalyticsRequest {
  name: string;
  description?: string;
  type: AnalyticsType;
  data_source: string;
  query: AnalyticsQuery;
  schedule?: AnalyticsSchedule;
}

export interface UpdateAnalyticsRequest {
  name?: string;
  description?: string;
  query?: AnalyticsQuery;
  schedule?: AnalyticsSchedule;
}

// ─── Anomaly Detection Types ────────────────────────────────────────────────

export interface AnomalyDetector {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  data_source: string;
  metric: string;
  algorithm: AnomalyAlgorithm;
  config: AnomalyConfig;
  enabled: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type AnomalyAlgorithm = 
  | 'statistical'
  | 'machine_learning'
  | 'time_series'
  | 'isolation_forest'
  | 'autoencoder'
  | 'custom';

export interface AnomalyConfig {
  sensitivity: 'low' | 'medium' | 'high';
  window_size: number;
  threshold?: number;
  seasonality?: boolean;
  parameters?: Record<string, unknown>;
}

export interface Anomaly {
  id: string;
  detector_id: string;
  timestamp: string;
  value: number;
  expected_value: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'detected' | 'investigating' | 'confirmed' | 'resolved' | 'false_positive';
  context?: Record<string, unknown>;
  created_at: string;
  resolved_at?: string;
}

export interface AnomalyListResponse {
  anomalies: Anomaly[];
  total: number;
  summary: {
    total: number;
    detected: number;
    investigating: number;
    confirmed: number;
    resolved: number;
    false_positive: number;
  };
}

export interface AnomalyDetectorListResponse {
  detectors: AnomalyDetector[];
  total: number;
}

export interface CreateAnomalyDetectorRequest {
  name: string;
  description?: string;
  data_source: string;
  metric: string;
  algorithm: AnomalyAlgorithm;
  config?: Partial<AnomalyConfig>;
}

export interface UpdateAnomalyDetectorRequest {
  name?: string;
  description?: string;
  config?: Partial<AnomalyConfig>;
  enabled?: boolean;
}

// ─── Recommendation Types ───────────────────────────────────────────────────

export interface Recommendation {
  id: string;
  organization_id: string;
  type: RecommendationType;
  category: RecommendationCategory;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  source: string;
  action_url?: string;
  metadata?: Record<string, unknown>;
  status: 'new' | 'accepted' | 'rejected' | 'implemented';
  created_at: string;
  expires_at?: string;
}

export type RecommendationType = 
  | 'optimization'
  | 'cost_saving'
  | 'performance'
  | 'security'
  | 'compliance'
  | 'growth'
  | 'risk_mitigation';

export type RecommendationCategory = 
  | 'infrastructure'
  | 'finance'
  | 'inventory'
  | 'crm'
  | 'security'
  | 'operations';

export interface RecommendationListResponse {
  recommendations: Recommendation[];
  total: number;
  summary: {
    total: number;
    new: number;
    accepted: number;
    rejected: number;
    implemented: number;
  };
}

// ─── AI Statistics Types ────────────────────────────────────────────────────

export interface AIStats {
  total_assistants: number;
  active_assistants: number;
  total_conversations: number;
  total_tools: number;
  enabled_tools: number;
  total_analytics: number;
  active_analytics: number;
  total_anomalies: number;
  active_anomalies: number;
  total_recommendations: number;
  new_recommendations: number;
}

// ─── AI Filters ─────────────────────────────────────────────────────────────

export interface AssistantFilters {
  model?: AIModel[];
  is_active?: boolean;
  search?: string;
}

export interface ToolFilters {
  category?: ToolCategory[];
  enabled?: boolean;
  search?: string;
}

export interface AnalyticsFilters {
  type?: AnalyticsType[];
  data_source?: string;
  scheduled?: boolean;
  search?: string;
}

export interface AnomalyDetectorFilters {
  algorithm?: AnomalyAlgorithm[];
  enabled?: boolean;
  search?: string;
}

export interface AnomalyFilters {
  detector_id?: string;
  severity?: ('low' | 'medium' | 'high' | 'critical')[];
  status?: ('detected' | 'investigating' | 'confirmed' | 'resolved' | 'false_positive')[];
  date_from?: string;
  date_to?: string;
}

export interface RecommendationFilters {
  type?: RecommendationType[];
  category?: RecommendationCategory[];
  impact?: ('low' | 'medium' | 'high' | 'critical')[];
  status?: ('new' | 'accepted' | 'rejected' | 'implemented')[];
  search?: string;
}
