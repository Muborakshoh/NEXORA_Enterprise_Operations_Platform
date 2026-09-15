/**
 * AI Provider
 * 
 * Context provider for AI module state management.
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { 
  assistantsApi, 
  toolsApi, 
  aiAnalyticsApi, 
  anomalyApi,
  recommendationsApi,
  aiStatsApi
} from '../../core/api/ai';
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
} from '../../core/types/ai';

interface AIContextType {
  // Assistants
  assistants: AIAssistant[];
  assistantsTotal: number;
  isLoadingAssistants: boolean;
  assistantFilters: AssistantFilters;
  setAssistantFilters: (filters: AssistantFilters) => void;
  loadAssistants: (filters?: AssistantFilters) => Promise<void>;
  createAssistant: (data: CreateAssistantRequest) => Promise<AIAssistant>;
  updateAssistant: (id: string, data: UpdateAssistantRequest) => Promise<AIAssistant>;
  deleteAssistant: (id: string) => Promise<void>;
  sendMessage: (assistantId: string, message: string, conversationId?: string) => Promise<{ message: AIMessage; conversation_id: string }>;

  // Tools
  tools: AITool[];
  toolsTotal: number;
  isLoadingTools: boolean;
  toolFilters: ToolFilters;
  setToolFilters: (filters: ToolFilters) => void;
  loadTools: (filters?: ToolFilters) => Promise<void>;
  createTool: (data: CreateToolRequest) => Promise<AITool>;
  updateTool: (id: string, data: UpdateToolRequest) => Promise<AITool>;
  deleteTool: (id: string) => Promise<void>;
  executeTool: (id: string, args: Record<string, unknown>) => Promise<ToolExecution>;

  // Analytics
  analytics: AIAnalytics[];
  analyticsTotal: number;
  isLoadingAnalytics: boolean;
  analyticsFilters: AnalyticsFilters;
  setAnalyticsFilters: (filters: AnalyticsFilters) => void;
  loadAnalytics: (filters?: AnalyticsFilters) => Promise<void>;
  createAnalytics: (data: CreateAnalyticsRequest) => Promise<AIAnalytics>;
  updateAnalytics: (id: string, data: UpdateAnalyticsRequest) => Promise<AIAnalytics>;
  deleteAnalytics: (id: string) => Promise<void>;
  runAnalytics: (id: string) => Promise<AnalyticsResult>;

  // Anomaly Detection
  detectors: AnomalyDetector[];
  detectorsTotal: number;
  isLoadingDetectors: boolean;
  detectorFilters: AnomalyDetectorFilters;
  setDetectorFilters: (filters: AnomalyDetectorFilters) => void;
  loadDetectors: (filters?: AnomalyDetectorFilters) => Promise<void>;
  createDetector: (data: CreateAnomalyDetectorRequest) => Promise<AnomalyDetector>;
  updateDetector: (id: string, data: UpdateAnomalyDetectorRequest) => Promise<AnomalyDetector>;
  deleteDetector: (id: string) => Promise<void>;
  toggleDetector: (id: string, enabled: boolean) => Promise<AnomalyDetector>;

  // Anomalies
  anomalies: Anomaly[];
  anomaliesTotal: number;
  anomaliesSummary: AnomalyListResponse['summary'];
  isLoadingAnomalies: boolean;
  anomalyFilters: AnomalyFilters;
  setAnomalyFilters: (filters: AnomalyFilters) => void;
  loadAnomalies: (filters?: AnomalyFilters) => Promise<void>;
  updateAnomalyStatus: (id: string, status: string) => Promise<Anomaly>;
  resolveAnomaly: (id: string, resolution?: string) => Promise<Anomaly>;

  // Recommendations
  recommendations: Recommendation[];
  recommendationsTotal: number;
  recommendationsSummary: RecommendationListResponse['summary'];
  isLoadingRecommendations: boolean;
  recommendationFilters: RecommendationFilters;
  setRecommendationFilters: (filters: RecommendationFilters) => void;
  loadRecommendations: (filters?: RecommendationFilters) => Promise<void>;
  acceptRecommendation: (id: string) => Promise<Recommendation>;
  rejectRecommendation: (id: string, reason?: string) => Promise<Recommendation>;
  markImplemented: (id: string) => Promise<Recommendation>;
  refreshRecommendations: () => Promise<RecommendationListResponse>;

  // Statistics
  aiStats: AIStats | null;
  isLoadingStats: boolean;
  loadAIStats: () => Promise<void>;
}

const AIContext = createContext<AIContextType | null>(null);

export function useAI() {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within AIProvider');
  }
  return context;
}

interface AIProviderProps {
  children: ReactNode;
}

export function AIProvider({ children }: AIProviderProps) {
  // Assistants state
  const [assistants, setAssistants] = useState<AIAssistant[]>([]);
  const [assistantsTotal, setAssistantsTotal] = useState(0);
  const [isLoadingAssistants, setIsLoadingAssistants] = useState(false);
  const [assistantFilters, setAssistantFilters] = useState<AssistantFilters>({});

  // Tools state
  const [tools, setTools] = useState<AITool[]>([]);
  const [toolsTotal, setToolsTotal] = useState(0);
  const [isLoadingTools, setIsLoadingTools] = useState(false);
  const [toolFilters, setToolFilters] = useState<ToolFilters>({});

  // Analytics state
  const [analytics, setAnalytics] = useState<AIAnalytics[]>([]);
  const [analyticsTotal, setAnalyticsTotal] = useState(0);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [analyticsFilters, setAnalyticsFilters] = useState<AnalyticsFilters>({});

  // Detectors state
  const [detectors, setDetectors] = useState<AnomalyDetector[]>([]);
  const [detectorsTotal, setDetectorsTotal] = useState(0);
  const [isLoadingDetectors, setIsLoadingDetectors] = useState(false);
  const [detectorFilters, setDetectorFilters] = useState<AnomalyDetectorFilters>({});

  // Anomalies state
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [anomaliesTotal, setAnomaliesTotal] = useState(0);
  const [anomaliesSummary, setAnomaliesSummary] = useState<AnomalyListResponse['summary']>({
    total: 0,
    detected: 0,
    investigating: 0,
    confirmed: 0,
    resolved: 0,
    false_positive: 0,
  });
  const [isLoadingAnomalies, setIsLoadingAnomalies] = useState(false);
  const [anomalyFilters, setAnomalyFilters] = useState<AnomalyFilters>({});

  // Recommendations state
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recommendationsTotal, setRecommendationsTotal] = useState(0);
  const [recommendationsSummary, setRecommendationsSummary] = useState<RecommendationListResponse['summary']>({
    total: 0,
    new: 0,
    accepted: 0,
    rejected: 0,
    implemented: 0,
  });
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [recommendationFilters, setRecommendationFilters] = useState<RecommendationFilters>({});

  // Statistics state
  const [aiStats, setAIStats] = useState<AIStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Assistants methods
  const loadAssistants = async (filters?: AssistantFilters) => {
    setIsLoadingAssistants(true);
    try {
      const response = await assistantsApi.list(filters);
      setAssistants(response.assistants);
      setAssistantsTotal(response.total);
    } finally {
      setIsLoadingAssistants(false);
    }
  };

  const createAssistant = async (data: CreateAssistantRequest) => {
    const assistant = await assistantsApi.create(data);
    setAssistants(prev => [...prev, assistant]);
    setAssistantsTotal(prev => prev + 1);
    return assistant;
  };

  const updateAssistant = async (id: string, data: UpdateAssistantRequest) => {
    const assistant = await assistantsApi.update(id, data);
    setAssistants(prev => prev.map(a => a.id === id ? assistant : a));
    return assistant;
  };

  const deleteAssistant = async (id: string) => {
    await assistantsApi.delete(id);
    setAssistants(prev => prev.filter(a => a.id !== id));
    setAssistantsTotal(prev => prev - 1);
  };

  const sendMessage = async (assistantId: string, message: string, conversationId?: string) => {
    return await assistantsApi.sendMessage(assistantId, message, conversationId);
  };

  // Tools methods
  const loadTools = async (filters?: ToolFilters) => {
    setIsLoadingTools(true);
    try {
      const response = await toolsApi.list(filters);
      setTools(response.tools);
      setToolsTotal(response.total);
    } finally {
      setIsLoadingTools(false);
    }
  };

  const createTool = async (data: CreateToolRequest) => {
    const tool = await toolsApi.create(data);
    setTools(prev => [...prev, tool]);
    setToolsTotal(prev => prev + 1);
    return tool;
  };

  const updateTool = async (id: string, data: UpdateToolRequest) => {
    const tool = await toolsApi.update(id, data);
    setTools(prev => prev.map(t => t.id === id ? tool : t));
    return tool;
  };

  const deleteTool = async (id: string) => {
    await toolsApi.delete(id);
    setTools(prev => prev.filter(t => t.id !== id));
    setToolsTotal(prev => prev - 1);
  };

  const executeTool = async (id: string, args: Record<string, unknown>) => {
    return await toolsApi.execute(id, args);
  };

  // Analytics methods
  const loadAnalytics = async (filters?: AnalyticsFilters) => {
    setIsLoadingAnalytics(true);
    try {
      const response = await aiAnalyticsApi.list(filters);
      setAnalytics(response.analytics);
      setAnalyticsTotal(response.total);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const createAnalytics = async (data: CreateAnalyticsRequest) => {
    const analytics = await aiAnalyticsApi.create(data);
    setAnalytics(prev => [...prev, analytics]);
    setAnalyticsTotal(prev => prev + 1);
    return analytics;
  };

  const updateAnalytics = async (id: string, data: UpdateAnalyticsRequest) => {
    const analytics = await aiAnalyticsApi.update(id, data);
    setAnalytics(prev => prev.map(a => a.id === id ? analytics : a));
    return analytics;
  };

  const deleteAnalytics = async (id: string) => {
    await aiAnalyticsApi.delete(id);
    setAnalytics(prev => prev.filter(a => a.id !== id));
    setAnalyticsTotal(prev => prev - 1);
  };

  const runAnalytics = async (id: string) => {
    return await aiAnalyticsApi.run(id);
  };

  // Detectors methods
  const loadDetectors = async (filters?: AnomalyDetectorFilters) => {
    setIsLoadingDetectors(true);
    try {
      const response = await anomalyApi.listDetectors(filters);
      setDetectors(response.detectors);
      setDetectorsTotal(response.total);
    } finally {
      setIsLoadingDetectors(false);
    }
  };

  const createDetector = async (data: CreateAnomalyDetectorRequest) => {
    const detector = await anomalyApi.createDetector(data);
    setDetectors(prev => [...prev, detector]);
    setDetectorsTotal(prev => prev + 1);
    return detector;
  };

  const updateDetector = async (id: string, data: UpdateAnomalyDetectorRequest) => {
    const detector = await anomalyApi.updateDetector(id, data);
    setDetectors(prev => prev.map(d => d.id === id ? detector : d));
    return detector;
  };

  const deleteDetector = async (id: string) => {
    await anomalyApi.deleteDetector(id);
    setDetectors(prev => prev.filter(d => d.id !== id));
    setDetectorsTotal(prev => prev - 1);
  };

  const toggleDetector = async (id: string, enabled: boolean) => {
    const detector = await anomalyApi.toggleDetector(id, enabled);
    setDetectors(prev => prev.map(d => d.id === id ? detector : d));
    return detector;
  };

  // Anomalies methods
  const loadAnomalies = async (filters?: AnomalyFilters) => {
    setIsLoadingAnomalies(true);
    try {
      const response = await anomalyApi.listAnomalies(filters);
      setAnomalies(response.anomalies);
      setAnomaliesTotal(response.total);
      setAnomaliesSummary(response.summary);
    } finally {
      setIsLoadingAnomalies(false);
    }
  };

  const updateAnomalyStatus = async (id: string, status: string) => {
    const anomaly = await anomalyApi.updateAnomalyStatus(id, status);
    setAnomalies(prev => prev.map(a => a.id === id ? anomaly : a));
    return anomaly;
  };

  const resolveAnomaly = async (id: string, resolution?: string) => {
    const anomaly = await anomalyApi.resolveAnomaly(id, resolution);
    setAnomalies(prev => prev.map(a => a.id === id ? anomaly : a));
    return anomaly;
  };

  // Recommendations methods
  const loadRecommendations = async (filters?: RecommendationFilters) => {
    setIsLoadingRecommendations(true);
    try {
      const response = await recommendationsApi.list(filters);
      setRecommendations(response.recommendations);
      setRecommendationsTotal(response.total);
      setRecommendationsSummary(response.summary);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const acceptRecommendation = async (id: string) => {
    const recommendation = await recommendationsApi.accept(id);
    setRecommendations(prev => prev.map(r => r.id === id ? recommendation : r));
    return recommendation;
  };

  const rejectRecommendation = async (id: string, reason?: string) => {
    const recommendation = await recommendationsApi.reject(id, reason);
    setRecommendations(prev => prev.map(r => r.id === id ? recommendation : r));
    return recommendation;
  };

  const markImplemented = async (id: string) => {
    const recommendation = await recommendationsApi.markImplemented(id);
    setRecommendations(prev => prev.map(r => r.id === id ? recommendation : r));
    return recommendation;
  };

  const refreshRecommendations = async () => {
    return await recommendationsApi.refresh();
  };

  // Statistics methods
  const loadAIStats = async () => {
    setIsLoadingStats(true);
    try {
      const stats = await aiStatsApi.get();
      setAIStats(stats);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const value: AIContextType = {
    // Assistants
    assistants,
    assistantsTotal,
    isLoadingAssistants,
    assistantFilters,
    setAssistantFilters,
    loadAssistants,
    createAssistant,
    updateAssistant,
    deleteAssistant,
    sendMessage,

    // Tools
    tools,
    toolsTotal,
    isLoadingTools,
    toolFilters,
    setToolFilters,
    loadTools,
    createTool,
    updateTool,
    deleteTool,
    executeTool,

    // Analytics
    analytics,
    analyticsTotal,
    isLoadingAnalytics,
    analyticsFilters,
    setAnalyticsFilters,
    loadAnalytics,
    createAnalytics,
    updateAnalytics,
    deleteAnalytics,
    runAnalytics,

    // Anomaly Detection
    detectors,
    detectorsTotal,
    isLoadingDetectors,
    detectorFilters,
    setDetectorFilters,
    loadDetectors,
    createDetector,
    updateDetector,
    deleteDetector,
    toggleDetector,

    // Anomalies
    anomalies,
    anomaliesTotal,
    anomaliesSummary,
    isLoadingAnomalies,
    anomalyFilters,
    setAnomalyFilters,
    loadAnomalies,
    updateAnomalyStatus,
    resolveAnomaly,

    // Recommendations
    recommendations,
    recommendationsTotal,
    recommendationsSummary,
    isLoadingRecommendations,
    recommendationFilters,
    setRecommendationFilters,
    loadRecommendations,
    acceptRecommendation,
    rejectRecommendation,
    markImplemented,
    refreshRecommendations,

    // Statistics
    aiStats,
    isLoadingStats,
    loadAIStats,
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
}
