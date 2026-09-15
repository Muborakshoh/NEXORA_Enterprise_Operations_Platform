/**
 * Security Types
 * 
 * Type definitions for Security module: Events, Audit, Sessions, Suspicious Activity.
 */

// ─── Security Event Types ───────────────────────────────────────────────────

export interface SecurityEvent {
  id: string;
  organization_id: string;
  type: SecurityEventType;
  severity: SecurityEventSeverity;
  title: string;
  description: string;
  source: SecurityEventSource;
  user_id?: string;
  user?: { id: string; name: string; email: string };
  ip_address: string;
  user_agent: string;
  resource_type?: string;
  resource_id?: string;
  metadata?: Record<string, unknown>;
  status: SecurityEventStatus;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export type SecurityEventType = 
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'password_changed'
  | 'password_reset'
  | '2fa_enabled'
  | '2fa_disabled'
  | 'api_key_created'
  | 'api_key_revoked'
  | 'permission_changed'
  | 'role_changed'
  | 'suspicious_login'
  | 'brute_force_attempt'
  | 'unauthorized_access'
  | 'data_export'
  | 'data_deletion'
  | 'custom';

export type SecurityEventSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type SecurityEventSource = 
  | 'authentication'
  | 'authorization'
  | 'api'
  | 'admin'
  | 'system'
  | 'user'
  | 'external';

export type SecurityEventStatus = 'active' | 'acknowledged' | 'resolved' | 'false_positive';

export interface SecurityEventListResponse {
  events: SecurityEvent[];
  total: number;
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    active: number;
    acknowledged: number;
    resolved: number;
  };
}

export interface SecurityEventFilters {
  type?: SecurityEventType[];
  severity?: SecurityEventSeverity[];
  source?: SecurityEventSource[];
  status?: SecurityEventStatus[];
  user_id?: string;
  ip_address?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

// ─── Audit Log Types ────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  organization_id: string;
  user_id: string;
  user?: { id: string; name: string; email: string };
  action: AuditAction;
  resource_type: string;
  resource_id?: string;
  resource_name?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address: string;
  user_agent: string;
  request_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export type AuditAction = 
  | 'create'
  | 'update'
  | 'delete'
  | 'read'
  | 'login'
  | 'logout'
  | 'export'
  | 'import'
  | 'approve'
  | 'reject'
  | 'custom';

export interface AuditLogListResponse {
  logs: AuditLog[];
  total: number;
  has_more: boolean;
}

export interface AuditLogFilters {
  user_id?: string;
  action?: AuditAction[];
  resource_type?: string[];
  resource_id?: string;
  date_from?: string;
  date_to?: string;
  ip_address?: string;
  search?: string;
}

// ─── Session Types ──────────────────────────────────────────────────────────

export interface UserSession {
  id: string;
  organization_id: string;
  user_id: string;
  user?: { id: string; name: string; email: string };
  ip_address: string;
  user_agent: string;
  device_type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string;
  os: string;
  location?: {
    city?: string;
    country?: string;
    region?: string;
  };
  is_current: boolean;
  is_active: boolean;
  last_active_at: string;
  created_at: string;
  expires_at: string;
}

export interface UserSessionListResponse {
  sessions: UserSession[];
  total: number;
  summary: {
    total: number;
    active: number;
    current: number;
  };
}

export interface UserSessionFilters {
  user_id?: string;
  is_active?: boolean;
  device_type?: string[];
  date_from?: string;
  date_to?: string;
}

// ─── Suspicious Activity Types ──────────────────────────────────────────────

export interface SuspiciousActivity {
  id: string;
  organization_id: string;
  type: SuspiciousActivityType;
  confidence: number; // 0-100
  title: string;
  description: string;
  user_id?: string;
  user?: { id: string; name: string; email: string };
  ip_address: string;
  indicators: SuspiciousIndicator[];
  status: SuspiciousActivityStatus;
  reviewed: boolean;
  reviewed_by?: string;
  reviewed_at?: string;
  resolution?: string;
  created_at: string;
  updated_at: string;
}

export type SuspiciousActivityType = 
  | 'brute_force'
  | 'unusual_location'
  | 'unusual_time'
  | 'rapid_requests'
  | 'failed_logins'
  | 'privilege_escalation'
  | 'data_exfiltration'
  | 'account_takeover'
  | 'custom';

export type SuspiciousActivityStatus = 'detected' | 'investigating' | 'confirmed' | 'false_positive' | 'resolved';

export interface SuspiciousIndicator {
  type: string;
  value: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface SuspiciousActivityListResponse {
  activities: SuspiciousActivity[];
  total: number;
  summary: {
    total: number;
    detected: number;
    investigating: number;
    confirmed: number;
    false_positive: number;
    resolved: number;
  };
}

export interface SuspiciousActivityFilters {
  type?: SuspiciousActivityType[];
  status?: SuspiciousActivityStatus[];
  user_id?: string;
  ip_address?: string;
  min_confidence?: number;
  date_from?: string;
  date_to?: string;
}

// ─── Security Statistics ────────────────────────────────────────────────────

export interface SecurityStats {
  total_events: number;
  critical_events: number;
  active_events: number;
  total_sessions: number;
  active_sessions: number;
  suspicious_activities: number;
  confirmed_threats: number;
  failed_logins_24h: number;
  successful_logins_24h: number;
  unique_ips_24h: number;
}

// ─── Security Rules Types ───────────────────────────────────────────────────

export interface SecurityRule {
  id: string;
  organization_id: string;
  name: string;
  description: string;
  type: SecurityRuleType;
  enabled: boolean;
  conditions: SecurityRuleCondition[];
  actions: SecurityRuleAction[];
  priority: number;
  created_at: string;
  updated_at: string;
}

export type SecurityRuleType = 'detection' | 'prevention' | 'notification';

export interface SecurityRuleCondition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'contains' | 'not_contains';
  value: string | number | boolean;
}

export interface SecurityRuleAction {
  type: 'alert' | 'block' | 'notify' | 'log';
  config: Record<string, unknown>;
}

export interface SecurityRuleListResponse {
  rules: SecurityRule[];
  total: number;
}
