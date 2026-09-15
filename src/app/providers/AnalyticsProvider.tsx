/**
 * Analytics Provider
 * 
 * Context provider for Analytics module state management.
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { 
  dashboardsApi, 
  reportsApi, 
  exportsApi, 
  aggregationsApi,
  dataSourcesApi,
  analyticsStatsApi
} from '../../core/api/analytics';
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
} from '../../core/types/analytics';

interface AnalyticsContextType {
  // Dashboards
  dashboards: AnalyticsDashboard[];
  dashboardsTotal: number;
  isLoadingDashboards: boolean;
  dashboardFilters: DashboardFilters;
  setDashboardFilters: (filters: DashboardFilters) => void;
  loadDashboards: (filters?: DashboardFilters) => Promise<void>;
  createDashboard: (data: CreateDashboardRequest) => Promise<AnalyticsDashboard>;
  updateDashboard: (id: string, data: UpdateDashboardRequest) => Promise<AnalyticsDashboard>;
  deleteDashboard: (id: string) => Promise<void>;
  setDefaultDashboard: (id: string) => Promise<AnalyticsDashboard>;

  // Reports
  reports: Report[];
  reportsTotal: number;
  isLoadingReports: boolean;
  reportFilters: ReportFilters;
  setReportFilters: (filters: ReportFilters) => void;
  loadReports: (filters?: ReportFilters) => Promise<void>;
  createReport: (data: CreateReportRequest) => Promise<Report>;
  updateReport: (id: string, data: UpdateReportRequest) => Promise<Report>;
  deleteReport: (id: string) => Promise<void>;
  executeReport: (id: string, format?: string) => Promise<ReportExecution>;
  toggleReportSchedule: (id: string, enabled: boolean) => Promise<Report>;

  // Exports
  exports: Export[];
  exportsTotal: number;
  isLoadingExports: boolean;
  exportFilters: ExportFilters;
  setExportFilters: (filters: ExportFilters) => void;
  loadExports: (filters?: ExportFilters) => Promise<void>;
  createExport: (data: CreateExportRequest) => Promise<Export>;
  deleteExport: (id: string) => Promise<void>;
  downloadExport: (id: string) => Promise<Blob>;

  // Aggregations
  aggregations: Aggregation[];
  aggregationsTotal: number;
  isLoadingAggregations: boolean;
  aggregationFilters: AggregationFilters;
  setAggregationFilters: (filters: AggregationFilters) => void;
  loadAggregations: (filters?: AggregationFilters) => Promise<void>;
  createAggregation: (data: CreateAggregationRequest) => Promise<Aggregation>;
  updateAggregation: (id: string, data: UpdateAggregationRequest) => Promise<Aggregation>;
  deleteAggregation: (id: string) => Promise<void>;
  executeAggregation: (id: string, timeRange?: any) => Promise<AggregationResult>;

  // Data Sources
  dataSources: DataSource[];
  isLoadingDataSources: boolean;
  loadDataSources: () => Promise<void>;

  // Statistics
  analyticsStats: AnalyticsStats | null;
  isLoadingStats: boolean;
  loadAnalyticsStats: () => Promise<void>;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider');
  }
  return context;
}

interface AnalyticsProviderProps {
  children: ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  // Dashboards state
  const [dashboards, setDashboards] = useState<AnalyticsDashboard[]>([]);
  const [dashboardsTotal, setDashboardsTotal] = useState(0);
  const [isLoadingDashboards, setIsLoadingDashboards] = useState(false);
  const [dashboardFilters, setDashboardFilters] = useState<DashboardFilters>({});

  // Reports state
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsTotal, setReportsTotal] = useState(0);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [reportFilters, setReportFilters] = useState<ReportFilters>({});

  // Exports state
  const [exports, setExports] = useState<Export[]>([]);
  const [exportsTotal, setExportsTotal] = useState(0);
  const [isLoadingExports, setIsLoadingExports] = useState(false);
  const [exportFilters, setExportFilters] = useState<ExportFilters>({});

  // Aggregations state
  const [aggregations, setAggregations] = useState<Aggregation[]>([]);
  const [aggregationsTotal, setAggregationsTotal] = useState(0);
  const [isLoadingAggregations, setIsLoadingAggregations] = useState(false);
  const [aggregationFilters, setAggregationFilters] = useState<AggregationFilters>({});

  // Data Sources state
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [isLoadingDataSources, setIsLoadingDataSources] = useState(false);

  // Statistics state
  const [analyticsStats, setAnalyticsStats] = useState<AnalyticsStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Dashboards methods
  const loadDashboards = async (filters?: DashboardFilters) => {
    setIsLoadingDashboards(true);
    try {
      const response = await dashboardsApi.list(filters);
      setDashboards(response.dashboards);
      setDashboardsTotal(response.total);
    } finally {
      setIsLoadingDashboards(false);
    }
  };

  const createDashboard = async (data: CreateDashboardRequest) => {
    const dashboard = await dashboardsApi.create(data);
    setDashboards(prev => [...prev, dashboard]);
    setDashboardsTotal(prev => prev + 1);
    return dashboard;
  };

  const updateDashboard = async (id: string, data: UpdateDashboardRequest) => {
    const dashboard = await dashboardsApi.update(id, data);
    setDashboards(prev => prev.map(d => d.id === id ? dashboard : d));
    return dashboard;
  };

  const deleteDashboard = async (id: string) => {
    await dashboardsApi.delete(id);
    setDashboards(prev => prev.filter(d => d.id !== id));
    setDashboardsTotal(prev => prev - 1);
  };

  const setDefaultDashboard = async (id: string) => {
    const dashboard = await dashboardsApi.setDefault(id);
    setDashboards(prev => prev.map(d => ({
      ...d,
      is_default: d.id === id
    })));
    return dashboard;
  };

  // Reports methods
  const loadReports = async (filters?: ReportFilters) => {
    setIsLoadingReports(true);
    try {
      const response = await reportsApi.list(filters);
      setReports(response.reports);
      setReportsTotal(response.total);
    } finally {
      setIsLoadingReports(false);
    }
  };

  const createReport = async (data: CreateReportRequest) => {
    const report = await reportsApi.create(data);
    setReports(prev => [...prev, report]);
    setReportsTotal(prev => prev + 1);
    return report;
  };

  const updateReport = async (id: string, data: UpdateReportRequest) => {
    const report = await reportsApi.update(id, data);
    setReports(prev => prev.map(r => r.id === id ? report : r));
    return report;
  };

  const deleteReport = async (id: string) => {
    await reportsApi.delete(id);
    setReports(prev => prev.filter(r => r.id !== id));
    setReportsTotal(prev => prev - 1);
  };

  const executeReport = async (id: string, format?: string) => {
    return await reportsApi.execute(id, format);
  };

  const toggleReportSchedule = async (id: string, enabled: boolean) => {
    const report = await reportsApi.toggleSchedule(id, enabled);
    setReports(prev => prev.map(r => r.id === id ? report : r));
    return report;
  };

  // Exports methods
  const loadExports = async (filters?: ExportFilters) => {
    setIsLoadingExports(true);
    try {
      const response = await exportsApi.list(filters);
      setExports(response.exports);
      setExportsTotal(response.total);
    } finally {
      setIsLoadingExports(false);
    }
  };

  const createExport = async (data: CreateExportRequest) => {
    const exportData = await exportsApi.create(data);
    setExports(prev => [...prev, exportData]);
    setExportsTotal(prev => prev + 1);
    return exportData;
  };

  const deleteExport = async (id: string) => {
    await exportsApi.delete(id);
    setExports(prev => prev.filter(e => e.id !== id));
    setExportsTotal(prev => prev - 1);
  };

  const downloadExport = async (id: string) => {
    return await exportsApi.download(id);
  };

  // Aggregations methods
  const loadAggregations = async (filters?: AggregationFilters) => {
    setIsLoadingAggregations(true);
    try {
      const response = await aggregationsApi.list(filters);
      setAggregations(response.aggregations);
      setAggregationsTotal(response.total);
    } finally {
      setIsLoadingAggregations(false);
    }
  };

  const createAggregation = async (data: CreateAggregationRequest) => {
    const aggregation = await aggregationsApi.create(data);
    setAggregations(prev => [...prev, aggregation]);
    setAggregationsTotal(prev => prev + 1);
    return aggregation;
  };

  const updateAggregation = async (id: string, data: UpdateAggregationRequest) => {
    const aggregation = await aggregationsApi.update(id, data);
    setAggregations(prev => prev.map(a => a.id === id ? aggregation : a));
    return aggregation;
  };

  const deleteAggregation = async (id: string) => {
    await aggregationsApi.delete(id);
    setAggregations(prev => prev.filter(a => a.id !== id));
    setAggregationsTotal(prev => prev - 1);
  };

  const executeAggregation = async (id: string, timeRange?: any) => {
    return await aggregationsApi.execute(id, timeRange);
  };

  // Data Sources methods
  const loadDataSources = async () => {
    setIsLoadingDataSources(true);
    try {
      const response = await dataSourcesApi.list();
      setDataSources(response.data_sources);
    } finally {
      setIsLoadingDataSources(false);
    }
  };

  // Statistics methods
  const loadAnalyticsStats = async () => {
    setIsLoadingStats(true);
    try {
      const stats = await analyticsStatsApi.get();
      setAnalyticsStats(stats);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const value: AnalyticsContextType = {
    // Dashboards
    dashboards,
    dashboardsTotal,
    isLoadingDashboards,
    dashboardFilters,
    setDashboardFilters,
    loadDashboards,
    createDashboard,
    updateDashboard,
    deleteDashboard,
    setDefaultDashboard,

    // Reports
    reports,
    reportsTotal,
    isLoadingReports,
    reportFilters,
    setReportFilters,
    loadReports,
    createReport,
    updateReport,
    deleteReport,
    executeReport,
    toggleReportSchedule,

    // Exports
    exports,
    exportsTotal,
    isLoadingExports,
    exportFilters,
    setExportFilters,
    loadExports,
    createExport,
    deleteExport,
    downloadExport,

    // Aggregations
    aggregations,
    aggregationsTotal,
    isLoadingAggregations,
    aggregationFilters,
    setAggregationFilters,
    loadAggregations,
    createAggregation,
    updateAggregation,
    deleteAggregation,
    executeAggregation,

    // Data Sources
    dataSources,
    isLoadingDataSources,
    loadDataSources,

    // Statistics
    analyticsStats,
    isLoadingStats,
    loadAnalyticsStats,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}
