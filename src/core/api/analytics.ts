/**
 * Analytics API Service
 * 
 * API client for Analytics module: Dashboards, Reports, Exports, Aggregations.
 */

import { apiClient } from './client';
import type {
  AnalyticsDashboard,
  DashboardListResponse,
  CreateDashboardRequest,
  UpdateDashboardRequest,
  DashboardFilters,
  Report,
  ReportListResponse,
  CreateReportRequest,
  UpdateReportRequest,
  ReportFilters,
  ReportExecution,
  Export,
  ExportListResponse,
  CreateExportRequest,
  ExportFilters,
  Aggregation,
  AggregationListResponse,
  CreateAggregationRequest,
  UpdateAggregationRequest,
  AggregationFilters,
  AggregationResult,
  DataSource,
  DataSourceListResponse,
  AnalyticsStats,
} from '../types/analytics';

/**
 * Dashboards API
 */
export const dashboardsApi = {
  /**
   * List dashboards with filters
   */
  list: (filters?: DashboardFilters) =>
    apiClient.get<DashboardListResponse>('/analytics/dashboards', { params: filters as any }),

  /**
   * Get dashboard by ID
   */
  get: (dashboardId: string) =>
    apiClient.get<AnalyticsDashboard>(`/analytics/dashboards/${dashboardId}`),

  /**
   * Create new dashboard
   */
  create: (data: CreateDashboardRequest) =>
    apiClient.post<AnalyticsDashboard>('/analytics/dashboards', data),

  /**
   * Update dashboard
   */
  update: (dashboardId: string, data: UpdateDashboardRequest) =>
    apiClient.put<AnalyticsDashboard>(`/analytics/dashboards/${dashboardId}`, data),

  /**
   * Delete dashboard
   */
  delete: (dashboardId: string) =>
    apiClient.delete<void>(`/analytics/dashboards/${dashboardId}`),

  /**
   * Set dashboard as default
   */
  setDefault: (dashboardId: string) =>
    apiClient.post<AnalyticsDashboard>(`/analytics/dashboards/${dashboardId}/set-default`),
};

/**
 * Reports API
 */
export const reportsApi = {
  /**
   * List reports with filters
   */
  list: (filters?: ReportFilters) =>
    apiClient.get<ReportListResponse>('/analytics/reports', { params: filters as any }),

  /**
   * Get report by ID
   */
  get: (reportId: string) =>
    apiClient.get<Report>(`/analytics/reports/${reportId}`),

  /**
   * Create new report
   */
  create: (data: CreateReportRequest) =>
    apiClient.post<Report>('/analytics/reports', data),

  /**
   * Update report
   */
  update: (reportId: string, data: UpdateReportRequest) =>
    apiClient.put<Report>(`/analytics/reports/${reportId}`, data),

  /**
   * Delete report
   */
  delete: (reportId: string) =>
    apiClient.delete<void>(`/analytics/reports/${reportId}`),

  /**
   * Execute report
   */
  execute: (reportId: string, format: string = 'json') =>
    apiClient.post<ReportExecution>(`/analytics/reports/${reportId}/execute`, { format }),

  /**
   * Get report execution status
   */
  getExecution: (executionId: string) =>
    apiClient.get<ReportExecution>(`/analytics/report-executions/${executionId}`),

  /**
   * Enable/disable report schedule
   */
  toggleSchedule: (reportId: string, enabled: boolean) =>
    apiClient.post<Report>(`/analytics/reports/${reportId}/toggle-schedule`, { enabled }),
};

/**
 * Exports API
 */
export const exportsApi = {
  /**
   * List exports with filters
   */
  list: (filters?: ExportFilters) =>
    apiClient.get<ExportListResponse>('/analytics/exports', { params: filters as any }),

  /**
   * Get export by ID
   */
  get: (exportId: string) =>
    apiClient.get<Export>(`/analytics/exports/${exportId}`),

  /**
   * Create new export
   */
  create: (data: CreateExportRequest) =>
    apiClient.post<Export>('/analytics/exports', data),

  /**
   * Delete export
   */
  delete: (exportId: string) =>
    apiClient.delete<void>(`/analytics/exports/${exportId}`),

  /**
   * Download export file
   */
  download: (exportId: string) =>
    apiClient.get<Blob>(`/analytics/exports/${exportId}/download`),

  /**
   * Get export status
   */
  getStatus: (exportId: string) =>
    apiClient.get<Export>(`/analytics/exports/${exportId}/status`),
};

/**
 * Aggregations API
 */
export const aggregationsApi = {
  /**
   * List aggregations with filters
   */
  list: (filters?: AggregationFilters) =>
    apiClient.get<AggregationListResponse>('/analytics/aggregations', { params: filters as any }),

  /**
   * Get aggregation by ID
   */
  get: (aggregationId: string) =>
    apiClient.get<Aggregation>(`/analytics/aggregations/${aggregationId}`),

  /**
   * Create new aggregation
   */
  create: (data: CreateAggregationRequest) =>
    apiClient.post<Aggregation>('/analytics/aggregations', data),

  /**
   * Update aggregation
   */
  update: (aggregationId: string, data: UpdateAggregationRequest) =>
    apiClient.put<Aggregation>(`/analytics/aggregations/${aggregationId}`, data),

  /**
   * Delete aggregation
   */
  delete: (aggregationId: string) =>
    apiClient.delete<void>(`/analytics/aggregations/${aggregationId}`),

  /**
   * Execute aggregation query
   */
  execute: (aggregationId: string, timeRange?: any) =>
    apiClient.post<AggregationResult>(`/analytics/aggregations/${aggregationId}/execute`, { timeRange }),

  /**
   * Get aggregation results
   */
  getResults: (aggregationId: string, timeRange?: any) =>
    apiClient.get<AggregationResult>(`/analytics/aggregations/${aggregationId}/results`, { params: timeRange }),
};

/**
 * Data Sources API
 */
export const dataSourcesApi = {
  /**
   * List available data sources
   */
  list: () =>
    apiClient.get<DataSourceListResponse>('/analytics/data-sources'),

  /**
   * Get data source by ID
   */
  get: (dataSourceId: string) =>
    apiClient.get<DataSource>(`/analytics/data-sources/${dataSourceId}`),

  /**
   * Get data source schema
   */
  getSchema: (dataSourceId: string) =>
    apiClient.get<any>(`/analytics/data-sources/${dataSourceId}/schema`),
};

/**
 * Analytics Statistics API
 */
export const analyticsStatsApi = {
  /**
   * Get analytics statistics
   */
  get: () =>
    apiClient.get<AnalyticsStats>('/analytics/stats'),
};
