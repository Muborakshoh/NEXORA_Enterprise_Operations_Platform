/**
 * Security UI Components
 * 
 * Reusable components for Security module display.
 */

import React from 'react';
import { Shield, AlertTriangle, Activity, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import type { SecurityEvent, AuditLog, UserSession, SuspiciousActivity } from '../../../core/types/security';

interface SecurityEventCardProps {
  event: SecurityEvent;
  onAcknowledge?: () => void;
  onResolve?: () => void;
  onFalsePositive?: () => void;
}

export function SecurityEventCard({ event, onAcknowledge, onResolve, onFalsePositive }: SecurityEventCardProps) {
  const getSeverityColor = (severity: SecurityEvent['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 border-red-500/20 text-red-500';
      case 'high': return 'bg-orange-500/10 border-orange-500/20 text-orange-500';
      case 'medium': return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500';
      case 'low': return 'bg-blue-500/10 border-blue-500/20 text-blue-500';
      case 'info': return 'bg-gray-500/10 border-gray-500/20 text-gray-500';
    }
  };

  const getStatusIcon = (status: SecurityEvent['status'], acknowledged: boolean) => {
    if (status === 'resolved') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (acknowledged) return <Eye className="w-4 h-4 text-blue-500" />;
    return <AlertTriangle className="w-4 h-4 text-red-500" />;
  };

  return (
    <div className={`border rounded-lg p-4 ${getSeverityColor(event.severity)}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-3">
          {getStatusIcon(event.status, event.acknowledged)}
          <div className="flex-1">
            <h3 className="font-medium text-text-primary">{event.title}</h3>
            <p className="text-sm text-text-secondary mt-1">{event.description}</p>
          </div>
        </div>
        <span className="text-xs px-2 py-1 rounded capitalize bg-surface-2 text-text-muted">
          {event.status}
        </span>
      </div>
      
      <div className="space-y-1 text-xs text-text-muted mt-3">
        <div className="flex justify-between">
          <span>Type:</span>
          <span className="text-text-primary capitalize">{event.type.replace(/_/g, ' ')}</span>
        </div>
        <div className="flex justify-between">
          <span>Source:</span>
          <span className="text-text-primary capitalize">{event.source}</span>
        </div>
        {event.user && (
          <div className="flex justify-between">
            <span>User:</span>
            <span className="text-text-primary">{event.user.name}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>IP:</span>
          <span className="text-text-primary font-mono">{event.ip_address}</span>
        </div>
        <div className="flex justify-between">
          <span>Time:</span>
          <span className="text-text-primary">{new Date(event.created_at).toLocaleString()}</span>
        </div>
      </div>

      {(onAcknowledge || onResolve || onFalsePositive) && event.status === 'active' && (
        <div className="mt-3 pt-3 border-t border-border-subtle flex gap-2">
          {onAcknowledge && !event.acknowledged && (
            <button
              onClick={onAcknowledge}
              className="flex-1 px-3 py-1.5 text-xs bg-blue-500/10 text-blue-500 rounded hover:bg-blue-500/20 transition-colors"
            >
              Acknowledge
            </button>
          )}
          {onResolve && (
            <button
              onClick={onResolve}
              className="flex-1 px-3 py-1.5 text-xs bg-green-500/10 text-green-500 rounded hover:bg-green-500/20 transition-colors"
            >
              Resolve
            </button>
          )}
          {onFalsePositive && (
            <button
              onClick={onFalsePositive}
              className="flex-1 px-3 py-1.5 text-xs bg-gray-500/10 text-gray-500 rounded hover:bg-gray-500/20 transition-colors"
            >
              False Positive
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface AuditLogRowProps {
  log: AuditLog;
  onClick?: () => void;
}

export function AuditLogRow({ log, onClick }: AuditLogRowProps) {
  const getActionColor = (action: AuditLog['action']) => {
    switch (action) {
      case 'create': return 'text-green-500';
      case 'update': return 'text-blue-500';
      case 'delete': return 'text-red-500';
      case 'login': return 'text-purple-500';
      case 'logout': return 'text-gray-500';
      default: return 'text-text-muted';
    }
  };

  return (
    <div 
      onClick={onClick}
      className="bg-surface-1 border border-border-subtle rounded-lg p-4 hover:border-accent-500/50 transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-500/10 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-accent-500" />
          </div>
          <div>
            <h3 className="font-medium text-text-primary capitalize">{log.action}</h3>
            <p className="text-xs text-text-muted">
              {log.resource_type} {log.resource_name && `• ${log.resource_name}`}
            </p>
          </div>
        </div>
        <span className="text-xs text-text-muted">
          {new Date(log.created_at).toLocaleString()}
        </span>
      </div>
      
      <div className="space-y-1 text-xs text-text-muted">
        {log.user && (
          <div className="flex justify-between">
            <span>User:</span>
            <span className="text-text-primary">{log.user.name} ({log.user.email})</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>IP:</span>
          <span className="text-text-primary font-mono">{log.ip_address}</span>
        </div>
        {log.request_id && (
          <div className="flex justify-between">
            <span>Request ID:</span>
            <span className="text-text-primary font-mono text-[10px]">{log.request_id}</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface SessionCardProps {
  session: UserSession;
  onRevoke?: () => void;
}

export function SessionCard({ session, onRevoke }: SessionCardProps) {
  return (
    <div className="bg-surface-1 border border-border-subtle rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-medium text-text-primary capitalize">{session.device_type}</h3>
            <p className="text-xs text-text-muted">{session.browser} on {session.os}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {session.is_current && (
            <span className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-500">
              Current
            </span>
          )}
          {session.is_active ? (
            <span className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-500">
              Active
            </span>
          ) : (
            <span className="text-xs px-2 py-1 rounded bg-gray-500/10 text-gray-500">
              Inactive
            </span>
          )}
        </div>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-text-muted">IP:</span>
          <span className="text-text-primary font-mono">{session.ip_address}</span>
        </div>
        {session.location && (
          <div className="flex justify-between">
            <span className="text-text-muted">Location:</span>
            <span className="text-text-primary">
              {[session.location.city, session.location.country].filter(Boolean).join(', ')}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-text-muted">Last Active:</span>
          <span className="text-text-primary">{new Date(session.last_active_at).toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Created:</span>
          <span className="text-text-primary">{new Date(session.created_at).toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Expires:</span>
          <span className="text-text-primary">{new Date(session.expires_at).toLocaleString()}</span>
        </div>
      </div>

      {onRevoke && !session.is_current && (
        <div className="mt-3 pt-3 border-t border-border-subtle">
          <button
            onClick={onRevoke}
            className="w-full px-3 py-1.5 text-xs bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 transition-colors"
          >
            Revoke Session
          </button>
        </div>
      )}
    </div>
  );
}

interface SuspiciousActivityCardProps {
  activity: SuspiciousActivity;
  onInvestigate?: () => void;
  onConfirm?: () => void;
  onFalsePositive?: () => void;
  onResolve?: () => void;
}

export function SuspiciousActivityCard({ 
  activity, 
  onInvestigate, 
  onConfirm, 
  onFalsePositive,
  onResolve 
}: SuspiciousActivityCardProps) {
  const getStatusColor = (status: SuspiciousActivity['status']) => {
    switch (status) {
      case 'detected': return 'bg-red-500/10 text-red-500';
      case 'investigating': return 'bg-yellow-500/10 text-yellow-500';
      case 'confirmed': return 'bg-red-500/10 text-red-500';
      case 'false_positive': return 'bg-gray-500/10 text-gray-500';
      case 'resolved': return 'bg-green-500/10 text-green-500';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-red-500';
    if (confidence >= 60) return 'text-orange-500';
    if (confidence >= 40) return 'text-yellow-500';
    return 'text-blue-500';
  };

  return (
    <div className="bg-surface-1 border border-border-subtle rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="font-medium text-text-primary">{activity.title}</h3>
            <p className="text-xs text-text-muted capitalize">{activity.type.replace(/_/g, ' ')}</p>
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded capitalize ${getStatusColor(activity.status)}`}>
          {activity.status.replace(/_/g, ' ')}
        </span>
      </div>
      
      <p className="text-sm text-text-secondary mb-3">{activity.description}</p>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-text-muted">Confidence:</span>
          <span className={`font-semibold ${getConfidenceColor(activity.confidence)}`}>
            {activity.confidence}%
          </span>
        </div>
        {activity.user && (
          <div className="flex justify-between">
            <span className="text-text-muted">User:</span>
            <span className="text-text-primary">{activity.user.name}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-text-muted">IP:</span>
          <span className="text-text-primary font-mono">{activity.ip_address}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Detected:</span>
          <span className="text-text-primary">{new Date(activity.created_at).toLocaleString()}</span>
        </div>
      </div>

      {activity.indicators.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border-subtle">
          <p className="text-xs font-medium text-text-primary mb-2">Indicators:</p>
          <div className="space-y-1">
            {activity.indicators.map((indicator, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs">
                <span className="text-text-muted">•</span>
                <span className="text-text-secondary">{indicator.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(onInvestigate || onConfirm || onFalsePositive || onResolve) && (
        <div className="mt-3 pt-3 border-t border-border-subtle flex gap-2 flex-wrap">
          {onInvestigate && activity.status === 'detected' && (
            <button
              onClick={onInvestigate}
              className="px-3 py-1.5 text-xs bg-blue-500/10 text-blue-500 rounded hover:bg-blue-500/20 transition-colors"
            >
              Investigate
            </button>
          )}
          {onConfirm && (activity.status === 'detected' || activity.status === 'investigating') && (
            <button
              onClick={onConfirm}
              className="px-3 py-1.5 text-xs bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 transition-colors"
            >
              Confirm Threat
            </button>
          )}
          {onFalsePositive && (activity.status === 'detected' || activity.status === 'investigating') && (
            <button
              onClick={onFalsePositive}
              className="px-3 py-1.5 text-xs bg-gray-500/10 text-gray-500 rounded hover:bg-gray-500/20 transition-colors"
            >
              False Positive
            </button>
          )}
          {onResolve && activity.status !== 'resolved' && activity.status !== 'false_positive' && (
            <button
              onClick={onResolve}
              className="px-3 py-1.5 text-xs bg-green-500/10 text-green-500 rounded hover:bg-green-500/20 transition-colors"
            >
              Resolve
            </button>
          )}
        </div>
      )}
    </div>
  );
}
