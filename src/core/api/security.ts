/**
 * Security API Service
 * 
 * API client for Security module: Events, Audit, Sessions, Suspicious Activity.
 */

import { apiClient } from './client';
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
} from '../types/security';

/**
 * Security Events API
 */
export const securityEventsApi = {
  /**
   * List security events with filters
   */
  list: (filters?: SecurityEventFilters & { limit?: number; offset?: number }) =>
    apiClient.get<SecurityEventListResponse>('/security/events', { params: filters as any }),

  /**
   * Get security event by ID
   */
  get: (eventId: string) =>
    apiClient.get<SecurityEvent>(`/security/events/${eventId}`),

  /**
   * Acknowledge security event
   */
  acknowledge: (eventId: string) =>
    apiClient.post<SecurityEvent>(`/security/events/${eventId}/acknowledge`),

  /**
   * Resolve security event
   */
  resolve: (eventId: string, resolution?: string) =>
    apiClient.post<SecurityEvent>(`/security/events/${eventId}/resolve`, { resolution }),

  /**
   * Mark as false positive
   */
  markFalsePositive: (eventId: string, reason?: string) =>
    apiClient.post<SecurityEvent>(`/security/events/${eventId}/false-positive`, { reason }),
};

/**
 * Audit Log API
 */
export const auditLogApi = {
  /**
   * List audit logs with filters
   */
  list: (filters?: AuditLogFilters & { limit?: number; offset?: number }) =>
    apiClient.get<AuditLogListResponse>('/security/audit', { params: filters as any }),

  /**
   * Get audit log by ID
   */
  get: (logId: string) =>
    apiClient.get<AuditLog>(`/security/audit/${logId}`),

  /**
   * Export audit logs
   */
  export: (filters?: AuditLogFilters, format: 'csv' | 'json' = 'csv') =>
    apiClient.get<Blob>('/security/audit/export', { 
      params: { ...filters, format } as any,
      responseType: 'blob',
    }),
};

/**
 * Sessions API
 */
export const sessionsApi = {
  /**
   * List user sessions with filters
   */
  list: (filters?: UserSessionFilters & { limit?: number; offset?: number }) =>
    apiClient.get<UserSessionListResponse>('/security/sessions', { params: filters as any }),

  /**
   * Get session by ID
   */
  get: (sessionId: string) =>
    apiClient.get<UserSession>(`/security/sessions/${sessionId}`),

  /**
   * Revoke session
   */
  revoke: (sessionId: string) =>
    apiClient.post<void>(`/security/sessions/${sessionId}/revoke`),

  /**
   * Revoke all other sessions
   */
  revokeAllOthers: () =>
    apiClient.post<void>('/security/sessions/revoke-others'),

  /**
   * Get current session
   */
  getCurrent: () =>
    apiClient.get<UserSession>('/security/sessions/current'),
};

/**
 * Suspicious Activity API
 */
export const suspiciousActivityApi = {
  /**
   * List suspicious activities with filters
   */
  list: (filters?: SuspiciousActivityFilters & { limit?: number; offset?: number }) =>
    apiClient.get<SuspiciousActivityListResponse>('/security/suspicious', { params: filters as any }),

  /**
   * Get suspicious activity by ID
   */
  get: (activityId: string) =>
    apiClient.get<SuspiciousActivity>(`/security/suspicious/${activityId}`),

  /**
   * Start investigation
   */
  startInvestigation: (activityId: string) =>
    apiClient.post<SuspiciousActivity>(`/security/suspicious/${activityId}/investigate`),

  /**
   * Confirm threat
   */
  confirmThreat: (activityId: string, notes?: string) =>
    apiClient.post<SuspiciousActivity>(`/security/suspicious/${activityId}/confirm`, { notes }),

  /**
   * Mark as false positive
   */
  markFalsePositive: (activityId: string, reason?: string) =>
    apiClient.post<SuspiciousActivity>(`/security/suspicious/${activityId}/false-positive`, { reason }),

  /**
   * Resolve suspicious activity
   */
  resolve: (activityId: string, resolution?: string) =>
    apiClient.post<SuspiciousActivity>(`/security/suspicious/${activityId}/resolve`, { resolution }),
};

/**
 * Security Statistics API
 */
export const securityStatsApi = {
  /**
   * Get security statistics
   */
  get: () =>
    apiClient.get<SecurityStats>('/security/stats'),
};

/**
 * Security Rules API
 */
export const securityRulesApi = {
  /**
   * List security rules
   */
  list: () =>
    apiClient.get<SecurityRuleListResponse>('/security/rules'),

  /**
   * Get security rule by ID
   */
  get: (ruleId: string) =>
    apiClient.get<SecurityRule>(`/security/rules/${ruleId}`),

  /**
   * Create security rule
   */
  create: (rule: Omit<SecurityRule, 'id' | 'organization_id' | 'created_at' | 'updated_at'>) =>
    apiClient.post<SecurityRule>('/security/rules', rule),

  /**
   * Update security rule
   */
  update: (ruleId: string, rule: Partial<SecurityRule>) =>
    apiClient.put<SecurityRule>(`/security/rules/${ruleId}`, rule),

  /**
   * Delete security rule
   */
  delete: (ruleId: string) =>
    apiClient.delete<void>(`/security/rules/${ruleId}`),

  /**
   * Enable/disable security rule
   */
  toggle: (ruleId: string, enabled: boolean) =>
    apiClient.post<SecurityRule>(`/security/rules/${ruleId}/toggle`, { enabled }),
};
