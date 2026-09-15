/**
 * Security Provider
 * 
 * Context provider for Security module state management.
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { 
  securityEventsApi, 
  auditLogApi, 
  sessionsApi, 
  suspiciousActivityApi,
  securityStatsApi,
  securityRulesApi
} from '../../core/api/security';
import type {
  SecurityEvent,
  SecurityEventListResponse,
  SecurityEventFilters,
  AuditLog,
  AuditLogListResponse,
  AuditLogFilters,
  UserSession,
  UserSessionListResponse,
  UserSessionFilters,
  SuspiciousActivity,
  SuspiciousActivityListResponse,
  SuspiciousActivityFilters,
  SecurityStats,
  SecurityRule,
  SecurityRuleListResponse,
} from '../../core/types/security';

interface SecurityContextType {
  // Security Events
  securityEvents: SecurityEvent[];
  securityEventsTotal: number;
  securityEventsSummary: SecurityEventListResponse['summary'];
  isLoadingEvents: boolean;
  eventFilters: SecurityEventFilters;
  setEventFilters: (filters: SecurityEventFilters) => void;
  loadSecurityEvents: (filters?: SecurityEventFilters) => Promise<void>;
  acknowledgeEvent: (eventId: string) => Promise<void>;
  resolveEvent: (eventId: string, resolution?: string) => Promise<void>;
  markEventFalsePositive: (eventId: string, reason?: string) => Promise<void>;

  // Audit Logs
  auditLogs: AuditLog[];
  auditLogsTotal: number;
  auditLogsHasMore: boolean;
  isLoadingLogs: boolean;
  logFilters: AuditLogFilters;
  setLogFilters: (filters: AuditLogFilters) => void;
  loadAuditLogs: (filters?: AuditLogFilters) => Promise<void>;
  exportAuditLogs: (filters?: AuditLogFilters, format?: 'csv' | 'json') => Promise<Blob>;

  // Sessions
  sessions: UserSession[];
  sessionsTotal: number;
  sessionsSummary: UserSessionListResponse['summary'];
  isLoadingSessions: boolean;
  sessionFilters: UserSessionFilters;
  setSessionFilters: (filters: UserSessionFilters) => void;
  loadSessions: (filters?: UserSessionFilters) => Promise<void>;
  revokeSession: (sessionId: string) => Promise<void>;
  revokeAllOtherSessions: () => Promise<void>;

  // Suspicious Activity
  suspiciousActivities: SuspiciousActivity[];
  suspiciousActivitiesTotal: number;
  suspiciousActivitiesSummary: SuspiciousActivityListResponse['summary'];
  isLoadingSuspicious: boolean;
  suspiciousFilters: SuspiciousActivityFilters;
  setSuspiciousFilters: (filters: SuspiciousActivityFilters) => void;
  loadSuspiciousActivities: (filters?: SuspiciousActivityFilters) => Promise<void>;
  startInvestigation: (activityId: string) => Promise<void>;
  confirmThreat: (activityId: string, notes?: string) => Promise<void>;
  markSuspiciousFalsePositive: (activityId: string, reason?: string) => Promise<void>;
  resolveSuspicious: (activityId: string, resolution?: string) => Promise<void>;

  // Statistics
  securityStats: SecurityStats | null;
  isLoadingStats: boolean;
  loadSecurityStats: () => Promise<void>;

  // Security Rules
  securityRules: SecurityRule[];
  securityRulesTotal: number;
  isLoadingRules: boolean;
  loadSecurityRules: () => Promise<void>;
  createSecurityRule: (rule: Omit<SecurityRule, 'id' | 'organization_id' | 'created_at' | 'updated_at'>) => Promise<SecurityRule>;
  updateSecurityRule: (ruleId: string, rule: Partial<SecurityRule>) => Promise<SecurityRule>;
  deleteSecurityRule: (ruleId: string) => Promise<void>;
  toggleSecurityRule: (ruleId: string, enabled: boolean) => Promise<SecurityRule>;
}

const SecurityContext = createContext<SecurityContextType | null>(null);

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within SecurityProvider');
  }
  return context;
}

interface SecurityProviderProps {
  children: ReactNode;
}

export function SecurityProvider({ children }: SecurityProviderProps) {
  // Security Events state
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [securityEventsTotal, setSecurityEventsTotal] = useState(0);
  const [securityEventsSummary, setSecurityEventsSummary] = useState<SecurityEventListResponse['summary']>({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
    active: 0,
    acknowledged: 0,
    resolved: 0,
  });
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [eventFilters, setEventFilters] = useState<SecurityEventFilters>({});

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLogsTotal, setAuditLogsTotal] = useState(0);
  const [auditLogsHasMore, setAuditLogsHasMore] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logFilters, setLogFilters] = useState<AuditLogFilters>({});

  // Sessions state
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [sessionsTotal, setSessionsTotal] = useState(0);
  const [sessionsSummary, setSessionsSummary] = useState<UserSessionListResponse['summary']>({
    total: 0,
    active: 0,
    current: 0,
  });
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [sessionFilters, setSessionFilters] = useState<UserSessionFilters>({});

  // Suspicious Activity state
  const [suspiciousActivities, setSuspiciousActivities] = useState<SuspiciousActivity[]>([]);
  const [suspiciousActivitiesTotal, setSuspiciousActivitiesTotal] = useState(0);
  const [suspiciousActivitiesSummary, setSuspiciousActivitiesSummary] = useState<SuspiciousActivityListResponse['summary']>({
    total: 0,
    detected: 0,
    investigating: 0,
    confirmed: 0,
    false_positive: 0,
    resolved: 0,
  });
  const [isLoadingSuspicious, setIsLoadingSuspicious] = useState(false);
  const [suspiciousFilters, setSuspiciousFilters] = useState<SuspiciousActivityFilters>({});

  // Statistics state
  const [securityStats, setSecurityStats] = useState<SecurityStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Security Rules state
  const [securityRules, setSecurityRules] = useState<SecurityRule[]>([]);
  const [securityRulesTotal, setSecurityRulesTotal] = useState(0);
  const [isLoadingRules, setIsLoadingRules] = useState(false);

  // Security Events methods
  const loadSecurityEvents = async (filters?: SecurityEventFilters) => {
    setIsLoadingEvents(true);
    try {
      const response = await securityEventsApi.list(filters);
      setSecurityEvents(response.events);
      setSecurityEventsTotal(response.total);
      setSecurityEventsSummary(response.summary);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const acknowledgeEvent = async (eventId: string) => {
    const event = await securityEventsApi.acknowledge(eventId);
    setSecurityEvents(prev => prev.map(e => e.id === eventId ? event : e));
  };

  const resolveEvent = async (eventId: string, resolution?: string) => {
    const event = await securityEventsApi.resolve(eventId, resolution);
    setSecurityEvents(prev => prev.map(e => e.id === eventId ? event : e));
  };

  const markEventFalsePositive = async (eventId: string, reason?: string) => {
    const event = await securityEventsApi.markFalsePositive(eventId, reason);
    setSecurityEvents(prev => prev.map(e => e.id === eventId ? event : e));
  };

  // Audit Logs methods
  const loadAuditLogs = async (filters?: AuditLogFilters) => {
    setIsLoadingLogs(true);
    try {
      const response = await auditLogApi.list(filters);
      setAuditLogs(response.logs);
      setAuditLogsTotal(response.total);
      setAuditLogsHasMore(response.has_more);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const exportAuditLogs = async (filters?: AuditLogFilters, format: 'csv' | 'json' = 'csv') => {
    return await auditLogApi.export(filters, format);
  };

  // Sessions methods
  const loadSessions = async (filters?: UserSessionFilters) => {
    setIsLoadingSessions(true);
    try {
      const response = await sessionsApi.list(filters);
      setSessions(response.sessions);
      setSessionsTotal(response.total);
      setSessionsSummary(response.summary);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    await sessionsApi.revoke(sessionId);
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    setSessionsTotal(prev => prev - 1);
  };

  const revokeAllOtherSessions = async () => {
    await sessionsApi.revokeAllOthers();
    // Reload sessions to get updated list
    await loadSessions(sessionFilters);
  };

  // Suspicious Activity methods
  const loadSuspiciousActivities = async (filters?: SuspiciousActivityFilters) => {
    setIsLoadingSuspicious(true);
    try {
      const response = await suspiciousActivityApi.list(filters);
      setSuspiciousActivities(response.activities);
      setSuspiciousActivitiesTotal(response.total);
      setSuspiciousActivitiesSummary(response.summary);
    } finally {
      setIsLoadingSuspicious(false);
    }
  };

  const startInvestigation = async (activityId: string) => {
    const activity = await suspiciousActivityApi.startInvestigation(activityId);
    setSuspiciousActivities(prev => prev.map(a => a.id === activityId ? activity : a));
  };

  const confirmThreat = async (activityId: string, notes?: string) => {
    const activity = await suspiciousActivityApi.confirmThreat(activityId, notes);
    setSuspiciousActivities(prev => prev.map(a => a.id === activityId ? activity : a));
  };

  const markSuspiciousFalsePositive = async (activityId: string, reason?: string) => {
    const activity = await suspiciousActivityApi.markFalsePositive(activityId, reason);
    setSuspiciousActivities(prev => prev.map(a => a.id === activityId ? activity : a));
  };

  const resolveSuspicious = async (activityId: string, resolution?: string) => {
    const activity = await suspiciousActivityApi.resolve(activityId, resolution);
    setSuspiciousActivities(prev => prev.map(a => a.id === activityId ? activity : a));
  };

  // Statistics methods
  const loadSecurityStats = async () => {
    setIsLoadingStats(true);
    try {
      const stats = await securityStatsApi.get();
      setSecurityStats(stats);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Security Rules methods
  const loadSecurityRules = async () => {
    setIsLoadingRules(true);
    try {
      const response = await securityRulesApi.list();
      setSecurityRules(response.rules);
      setSecurityRulesTotal(response.total);
    } finally {
      setIsLoadingRules(false);
    }
  };

  const createSecurityRule = async (rule: Omit<SecurityRule, 'id' | 'organization_id' | 'created_at' | 'updated_at'>) => {
    const newRule = await securityRulesApi.create(rule);
    setSecurityRules(prev => [...prev, newRule]);
    setSecurityRulesTotal(prev => prev + 1);
    return newRule;
  };

  const updateSecurityRule = async (ruleId: string, rule: Partial<SecurityRule>) => {
    const updatedRule = await securityRulesApi.update(ruleId, rule);
    setSecurityRules(prev => prev.map(r => r.id === ruleId ? updatedRule : r));
    return updatedRule;
  };

  const deleteSecurityRule = async (ruleId: string) => {
    await securityRulesApi.delete(ruleId);
    setSecurityRules(prev => prev.filter(r => r.id !== ruleId));
    setSecurityRulesTotal(prev => prev - 1);
  };

  const toggleSecurityRule = async (ruleId: string, enabled: boolean) => {
    const updatedRule = await securityRulesApi.toggle(ruleId, enabled);
    setSecurityRules(prev => prev.map(r => r.id === ruleId ? updatedRule : r));
    return updatedRule;
  };

  const value: SecurityContextType = {
    // Security Events
    securityEvents,
    securityEventsTotal,
    securityEventsSummary,
    isLoadingEvents,
    eventFilters,
    setEventFilters,
    loadSecurityEvents,
    acknowledgeEvent,
    resolveEvent,
    markEventFalsePositive,

    // Audit Logs
    auditLogs,
    auditLogsTotal,
    auditLogsHasMore,
    isLoadingLogs,
    logFilters,
    setLogFilters,
    loadAuditLogs,
    exportAuditLogs,

    // Sessions
    sessions,
    sessionsTotal,
    sessionsSummary,
    isLoadingSessions,
    sessionFilters,
    setSessionFilters,
    loadSessions,
    revokeSession,
    revokeAllOtherSessions,

    // Suspicious Activity
    suspiciousActivities,
    suspiciousActivitiesTotal,
    suspiciousActivitiesSummary,
    isLoadingSuspicious,
    suspiciousFilters,
    setSuspiciousFilters,
    loadSuspiciousActivities,
    startInvestigation,
    confirmThreat,
    markSuspiciousFalsePositive,
    resolveSuspicious,

    // Statistics
    securityStats,
    isLoadingStats,
    loadSecurityStats,

    // Security Rules
    securityRules,
    securityRulesTotal,
    isLoadingRules,
    loadSecurityRules,
    createSecurityRule,
    updateSecurityRule,
    deleteSecurityRule,
    toggleSecurityRule,
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
}
