/**
 * Analytics Types
 * 
 * Type definitions for Analytics module: Dashboards, Reports, Exports, Aggregations.
 */

// ─── Dashboard Types ────────────────────────────────────────────────────────

export interface AnalyticsDashboard {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  layout: DashboardLayout;
  is_default: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  config: WidgetConfig;
  position: { x: number; y: number; w: number; h: number };
  filters?: WidgetFilter[];
}

export type WidgetType = 
  | 'kpi_card'
  | 'line_chart'
  | 'bar_chart'
  | 'pie_chart'
  | 'area_chart'
  | 'table'
  | 'metric'
  | 'gauge'
  | 'heatmap'
  | 'funnel';

export interface WidgetConfig {
  data_source: string;
  metric?: string;
  dimensions?: string[];
  time_range?: TimeRange;
  aggregation?: AggregationType;
  filters?: Record<string, unknown>;
  display_options?: Record<string, unknown>;
}

export type AggregationType = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'group_by';

export interface TimeRange {
  type: 'relative' | 'absolute';
  relative?: { amount: number; unit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years' };
  absolute?: { start: string; end: string };
}

export interface WidgetFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'in' | 'between';
  value: string | number | boolean | string[];
}

export interface DashboardLayout {
  columns: number;
  row_height: number;
  margin: number;
}

export interface DashboardListResponse {
  dashboards: AnalyticsDashboard[];
  total: number;
}

export interface CreateDashboardRequest {
  name: string;
  description?: string;
  widgets?: DashboardWidget[];
  layout?: DashboardLayout;
  is_default?: boolean;
}

export interface UpdateDashboardRequest {
  name?: string;
  description?: string;
  widgets?: DashboardWidget[];
  layout?: DashboardLayout;
  is_default?: boolean;
}

// ─── Report Types ───────────────────────────────────────────────────────────

export interface Report {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  type: ReportType;
  data_source: string;
  query: ReportQuery;
  schedule?: ReportSchedule;
  format: ReportFormat[];
  recipients?: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  last_generated_at?: string;
}

export type ReportType = 'custom' | 'scheduled' | 'on_demand' | 'template';

export interface ReportQuery {
  metrics: string[];
  dimensions?: string[];
  filters?: ReportFilter[];
  time_range?: TimeRange;
  aggregation?: AggregationType;
  group_by?: string[];
  order_by?: { field: string; direction: 'asc' | 'desc' }[];
  limit?: number;
}

export interface ReportFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'not_in' | 'between' | 'contains';
  value: string | number | boolean | string[] | number[];
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  day_of_week?: number; // 0-6 (Sunday-Saturday)
  day_of_month?: number; // 1-31
  time?: string; // HH:MM format
  timezone: string;
  enabled: boolean;
}

export type ReportFormat = 'pdf' | 'csv' | 'excel' | 'json';

export interface ReportListResponse {
  reports: Report[];
  total: number;
}

export interface CreateReportRequest {
  name: string;
  description?: string;
  type: ReportType;
  data_source: string;
  query: ReportQuery;
  schedule?: ReportSchedule;
  format?: ReportFormat[];
  recipients?: string[];
}

export interface UpdateReportRequest {
  name?: string;
  description?: string;
  query?: ReportQuery;
  schedule?: ReportSchedule;
  format?: ReportFormat[];
  recipients?: string[];
}

export interface ReportExecution {
  id: string;
  report_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  error?: string;
  result_url?: string;
  format: ReportFormat;
  file_size?: number;
}

// ─── Export Types ───────────────────────────────────────────────────────────

export interface Export {
  id: string;
  organization_id: string;
  name: string;
  type: ExportType;
  format: ExportFormat;
  status: ExportStatus;
  data_source: string;
  filters?: Record<string, unknown>;
  columns?: string[];
  created_by: string;
  created_at: string;
  completed_at?: string;
  download_url?: string;
  file_size?: number;
  expires_at?: string;
}

export type ExportType = 'data' | 'report' | 'dashboard' | 'custom';

export type ExportFormat = 'csv' | 'excel' | 'pdf' | 'json' | 'xml';

export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'expired';

export interface ExportListResponse {
  exports: Export[];
  total: number;
}

export interface CreateExportRequest {
  name: string;
  type: ExportType;
  format: ExportFormat;
  data_source: string;
  filters?: Record<string, unknown>;
  columns?: string[];
}

// ─── Aggregation Types ──────────────────────────────────────────────────────

export interface Aggregation {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  data_source: string;
  metric: string;
  aggregation_type: AggregationType;
  dimensions?: string[];
  filters?: Record<string, unknown>;
  time_granularity?: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AggregationResult {
  aggregation_id: string;
  data: AggregationDataPoint[];
  metadata: {
    total_records: number;
    time_range: TimeRange;
    generated_at: string;
  };
}

export interface AggregationDataPoint {
  timestamp?: string;
  dimensions?: Record<string, string | number>;
  value: number;
  count?: number;
}

export interface AggregationListResponse {
  aggregations: Aggregation[];
  total: number;
}

export interface CreateAggregationRequest {
  name: string;
  description?: string;
  data_source: string;
  metric: string;
  aggregation_type: AggregationType;
  dimensions?: string[];
  filters?: Record<string, unknown>;
  time_granularity?: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export interface UpdateAggregationRequest {
  name?: string;
  description?: string;
  metric?: string;
  aggregation_type?: AggregationType;
  dimensions?: string[];
  filters?: Record<string, unknown>;
  time_granularity?: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
}

// ─── Data Source Types ──────────────────────────────────────────────────────

export interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  description?: string;
  schema: DataSourceSchema;
  created_at: string;
}

export type DataSourceType = 'database' | 'api' | 'file' | 'custom';

export interface DataSourceSchema {
  fields: DataSourceField[];
  primary_key?: string;
}

export interface DataSourceField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'json';
  description?: string;
  nullable: boolean;
}

export interface DataSourceListResponse {
  data_sources: DataSource[];
  total: number;
}

// ─── Analytics Statistics ───────────────────────────────────────────────────

export interface AnalyticsStats {
  total_dashboards: number;
  total_reports: number;
  total_exports: number;
  total_aggregations: number;
  active_dashboards: number;
  scheduled_reports: number;
  pending_exports: number;
  data_sources_count: number;
}

// ─── Analytics Filters ──────────────────────────────────────────────────────

export interface DashboardFilters {
  is_default?: boolean;
  search?: string;
}

export interface ReportFilters {
  type?: ReportType[];
  data_source?: string;
  scheduled?: boolean;
  search?: string;
}

export interface ExportFilters {
  type?: ExportType[];
  format?: ExportFormat[];
  status?: ExportStatus[];
  date_from?: string;
  date_to?: string;
}

export interface AggregationFilters {
  data_source?: string;
  aggregation_type?: AggregationType[];
  search?: string;
}
