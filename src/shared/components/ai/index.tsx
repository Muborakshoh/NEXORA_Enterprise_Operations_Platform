/**
 * AI UI Components
 * 
 * Reusable components for AI module display.
 */

import React from 'react';
import { 
  Bot, 
  Wrench, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb,
  MessageSquare,
  Play,
  Pause,
  Trash2,
  Edit,
  Check,
  X,
  MoreVertical
} from 'lucide-react';
import type { AIAssistant, AITool, AIAnalytics, AnomalyDetector, Anomaly, Recommendation } from '../../../core/types/ai';

// ─── Assistant Card ─────────────────────────────────────────────────────────

interface AssistantCardProps {
  assistant: AIAssistant;
  onEdit?: () => void;
  onDelete?: () => void;
  onChat?: () => void;
  onClick?: () => void;
}

export function AssistantCard({ assistant, onEdit, onDelete, onChat, onClick }: AssistantCardProps) {
  return (
    <div 
      className="bg-surface-1 border border-border-subtle rounded-lg p-4 hover:border-accent-500/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-purple-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-text-primary">{assistant.name}</h3>
            <p className="text-xs text-text-muted mt-1">
              {assistant.model} • {assistant.capabilities.length} capabilities
            </p>
          </div>
        </div>
        <button 
          className="p-1 hover:bg-surface-2 rounded transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            // Show menu
          }}
        >
          <MoreVertical className="w-4 h-4 text-text-muted" />
        </button>
      </div>
      
      {assistant.description && (
        <p className="text-sm text-text-secondary mb-3 line-clamp-2">
          {assistant.description}
        </p>
      )}

      <div className="flex items-center gap-2 mb-3">
        {assistant.capabilities.slice(0, 3).map((cap, idx) => (
          <span key={idx} className="text-xs px-2 py-0.5 bg-surface-2 text-text-muted rounded capitalize">
            {cap.replace('_', ' ')}
          </span>
        ))}
        {assistant.capabilities.length > 3 && (
          <span className="text-xs text-text-muted">
            +{assistant.capabilities.length - 3} more
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-text-muted">
        <span className={assistant.is_active ? 'text-green-500' : 'text-text-muted'}>
          {assistant.is_active ? '● Active' : '○ Inactive'}
        </span>
        <div className="flex gap-1">
          {onChat && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChat();
              }}
              className="p-1 hover:bg-purple-500/10 text-purple-500 rounded transition-colors"
              title="Chat"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
          )}
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1 hover:bg-surface-2 rounded transition-colors"
              title="Edit"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 hover:bg-red-500/10 text-red-500 rounded transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tool Card ──────────────────────────────────────────────────────────────

interface ToolCardProps {
  tool: AITool;
  onEdit?: () => void;
  onDelete?: () => void;
  onExecute?: () => void;
  onClick?: () => void;
}

export function ToolCard({ tool, onEdit, onDelete, onExecute, onClick }: ToolCardProps) {
  return (
    <div 
      className="bg-surface-1 border border-border-subtle rounded-lg p-4 hover:border-accent-500/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
            <Wrench className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-text-primary">{tool.name}</h3>
            <p className="text-xs text-text-muted mt-1 capitalize">
              {tool.category.replace('_', ' ')}
            </p>
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded ${tool.enabled ? 'bg-green-500/10 text-green-500' : 'bg-surface-2 text-text-muted'}`}>
          {tool.enabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>
      
      <p className="text-sm text-text-secondary mb-3 line-clamp-2">
        {tool.description}
      </p>

      <div className="space-y-1 text-xs text-text-muted mb-3">
        <div className="flex justify-between">
          <span>Parameters:</span>
          <span>{tool.parameters.length}</span>
        </div>
        <div className="flex justify-between">
          <span>Return type:</span>
          <span className="font-mono">{tool.return_type}</span>
        </div>
      </div>

      <div className="flex gap-2">
        {onExecute && tool.enabled && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExecute();
            }}
            className="flex-1 px-3 py-1.5 text-xs bg-green-500/10 text-green-500 rounded hover:bg-green-500/20 transition-colors flex items-center justify-center gap-1"
          >
            <Play className="w-3.5 h-3.5" />
            Execute
          </button>
        )}
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="px-3 py-1.5 text-xs bg-surface-2 text-text-secondary rounded hover:bg-surface-3 transition-colors"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="px-3 py-1.5 text-xs bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Analytics Card ─────────────────────────────────────────────────────────

interface AnalyticsCardProps {
  analytics: AIAnalytics;
  onEdit?: () => void;
  onDelete?: () => void;
  onRun?: () => void;
  onToggleSchedule?: () => void;
  onClick?: () => void;
}

export function AnalyticsCard({ analytics, onEdit, onDelete, onRun, onToggleSchedule, onClick }: AnalyticsCardProps) {
  return (
    <div 
      className="bg-surface-1 border border-border-subtle rounded-lg p-4 hover:border-accent-500/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-text-primary">{analytics.name}</h3>
            <p className="text-xs text-text-muted mt-1 capitalize">
              {analytics.type.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
        <button 
          className="p-1 hover:bg-surface-2 rounded transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            // Show menu
          }}
        >
          <MoreVertical className="w-4 h-4 text-text-muted" />
        </button>
      </div>
      
      {analytics.description && (
        <p className="text-sm text-text-secondary mb-3 line-clamp-2">
          {analytics.description}
        </p>
      )}

      <div className="space-y-1 text-xs text-text-muted mb-3">
        <div className="flex justify-between">
          <span>Data source:</span>
          <span>{analytics.data_source}</span>
        </div>
        {analytics.schedule && (
          <div className="flex justify-between">
            <span>Schedule:</span>
            <span className={analytics.schedule.enabled ? 'text-green-500' : 'text-text-muted'}>
              {analytics.schedule.enabled ? '● ' : '○ '}{analytics.schedule.frequency}
            </span>
          </div>
        )}
        {analytics.last_run_at && (
          <div className="flex justify-between">
            <span>Last run:</span>
            <span>{new Date(analytics.last_run_at).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {onRun && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRun();
            }}
            className="flex-1 px-3 py-1.5 text-xs bg-green-500/10 text-green-500 rounded hover:bg-green-500/20 transition-colors flex items-center justify-center gap-1"
          >
            <Play className="w-3.5 h-3.5" />
            Run
          </button>
        )}
        {onToggleSchedule && analytics.schedule && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSchedule();
            }}
            className="px-3 py-1.5 text-xs bg-surface-2 text-text-secondary rounded hover:bg-surface-3 transition-colors"
          >
            {analytics.schedule.enabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
        )}
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="px-3 py-1.5 text-xs bg-surface-2 text-text-secondary rounded hover:bg-surface-3 transition-colors"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="px-3 py-1.5 text-xs bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Anomaly Detector Card ──────────────────────────────────────────────────

interface AnomalyDetectorCardProps {
  detector: AnomalyDetector;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggle?: () => void;
  onClick?: () => void;
}

export function AnomalyDetectorCard({ detector, onEdit, onDelete, onToggle, onClick }: AnomalyDetectorCardProps) {
  return (
    <div 
      className="bg-surface-1 border border-border-subtle rounded-lg p-4 hover:border-accent-500/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-text-primary">{detector.name}</h3>
            <p className="text-xs text-text-muted mt-1 capitalize">
              {detector.algorithm.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded ${detector.enabled ? 'bg-green-500/10 text-green-500' : 'bg-surface-2 text-text-muted'}`}>
          {detector.enabled ? 'Active' : 'Inactive'}
        </span>
      </div>
      
      {detector.description && (
        <p className="text-sm text-text-secondary mb-3 line-clamp-2">
          {detector.description}
        </p>
      )}

      <div className="space-y-1 text-xs text-text-muted mb-3">
        <div className="flex justify-between">
          <span>Data source:</span>
          <span>{detector.data_source}</span>
        </div>
        <div className="flex justify-between">
          <span>Metric:</span>
          <span className="font-mono">{detector.metric}</span>
        </div>
        <div className="flex justify-between">
          <span>Sensitivity:</span>
          <span className="capitalize">{detector.config.sensitivity}</span>
        </div>
      </div>

      <div className="flex gap-2">
        {onToggle && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="flex-1 px-3 py-1.5 text-xs bg-surface-2 text-text-secondary rounded hover:bg-surface-3 transition-colors flex items-center justify-center gap-1"
          >
            {detector.enabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {detector.enabled ? 'Disable' : 'Enable'}
          </button>
        )}
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="px-3 py-1.5 text-xs bg-surface-2 text-text-secondary rounded hover:bg-surface-3 transition-colors"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="px-3 py-1.5 text-xs bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Anomaly Card ───────────────────────────────────────────────────────────

interface AnomalyCardProps {
  anomaly: Anomaly;
  onInvestigate?: () => void;
  onResolve?: () => void;
  onMarkFalsePositive?: () => void;
  onClick?: () => void;
}

export function AnomalyCard({ anomaly, onInvestigate, onResolve, onMarkFalsePositive, onClick }: AnomalyCardProps) {
  const getSeverityColor = (severity: Anomaly['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 border-red-500/20 text-red-500';
      case 'high': return 'bg-orange-500/10 border-orange-500/20 text-orange-500';
      case 'medium': return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500';
      case 'low': return 'bg-blue-500/10 border-blue-500/20 text-blue-500';
    }
  };

  const getStatusColor = (status: Anomaly['status']) => {
    switch (status) {
      case 'detected': return 'bg-red-500/10 text-red-500';
      case 'investigating': return 'bg-yellow-500/10 text-yellow-500';
      case 'confirmed': return 'bg-orange-500/10 text-orange-500';
      case 'resolved': return 'bg-green-500/10 text-green-500';
      case 'false_positive': return 'bg-surface-2 text-text-muted';
    }
  };

  return (
    <div 
      className={`border rounded-lg p-4 ${getSeverityColor(anomaly.severity)}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-text-primary">Anomaly Detected</h3>
            <p className="text-sm text-text-secondary mt-1">
              Value: {anomaly.value.toFixed(2)} (Expected: {anomaly.expected_value.toFixed(2)})
            </p>
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded capitalize ${getStatusColor(anomaly.status)}`}>
          {anomaly.status.replace(/_/g, ' ')}
        </span>
      </div>
      
      <div className="space-y-1 text-xs text-text-muted mt-3">
        <div className="flex justify-between">
          <span>Deviation:</span>
          <span className="font-semibold">{anomaly.deviation.toFixed(2)}%</span>
        </div>
        <div className="flex justify-between">
          <span>Detected:</span>
          <span>{new Date(anomaly.timestamp).toLocaleString()}</span>
        </div>
      </div>

      {(onInvestigate || onResolve || onMarkFalsePositive) && anomaly.status === 'detected' && (
        <div className="mt-3 pt-3 border-t border-border-subtle flex gap-2">
          {onInvestigate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onInvestigate();
              }}
              className="flex-1 px-3 py-1.5 text-xs bg-blue-500/10 text-blue-500 rounded hover:bg-blue-500/20 transition-colors"
            >
              Investigate
            </button>
          )}
          {onResolve && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onResolve();
              }}
              className="flex-1 px-3 py-1.5 text-xs bg-green-500/10 text-green-500 rounded hover:bg-green-500/20 transition-colors"
            >
              Resolve
            </button>
          )}
          {onMarkFalsePositive && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkFalsePositive();
              }}
              className="flex-1 px-3 py-1.5 text-xs bg-surface-2 text-text-secondary rounded hover:bg-surface-3 transition-colors"
            >
              False Positive
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Recommendation Card ────────────────────────────────────────────────────

interface RecommendationCardProps {
  recommendation: Recommendation;
  onAccept?: () => void;
  onReject?: () => void;
  onMarkImplemented?: () => void;
  onClick?: () => void;
}

export function RecommendationCard({ recommendation, onAccept, onReject, onMarkImplemented, onClick }: RecommendationCardProps) {
  const getImpactColor = (impact: Recommendation['impact']) => {
    switch (impact) {
      case 'critical': return 'bg-red-500/10 text-red-500';
      case 'high': return 'bg-orange-500/10 text-orange-500';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500';
      case 'low': return 'bg-blue-500/10 text-blue-500';
    }
  };

  const getStatusColor = (status: Recommendation['status']) => {
    switch (status) {
      case 'new': return 'bg-blue-500/10 text-blue-500';
      case 'accepted': return 'bg-green-500/10 text-green-500';
      case 'rejected': return 'bg-red-500/10 text-red-500';
      case 'implemented': return 'bg-purple-500/10 text-purple-500';
    }
  };

  return (
    <div 
      className="bg-surface-1 border border-border-subtle rounded-lg p-4 hover:border-accent-500/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-text-primary">{recommendation.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded capitalize ${getImpactColor(recommendation.impact)}`}>
                {recommendation.impact} impact
              </span>
              <span className={`text-xs px-2 py-0.5 rounded capitalize ${getStatusColor(recommendation.status)}`}>
                {recommendation.status}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <p className="text-sm text-text-secondary mb-3">
        {recommendation.description}
      </p>

      <div className="space-y-1 text-xs text-text-muted mb-3">
        <div className="flex justify-between">
          <span>Category:</span>
          <span className="capitalize">{recommendation.category.replace(/_/g, ' ')}</span>
        </div>
        <div className="flex justify-between">
          <span>Type:</span>
          <span className="capitalize">{recommendation.type.replace(/_/g, ' ')}</span>
        </div>
        <div className="flex justify-between">
          <span>Confidence:</span>
          <span className="font-semibold">{recommendation.confidence}%</span>
        </div>
      </div>

      {(onAccept || onReject || onMarkImplemented) && recommendation.status === 'new' && (
        <div className="flex gap-2">
          {onAccept && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAccept();
              }}
              className="flex-1 px-3 py-1.5 text-xs bg-green-500/10 text-green-500 rounded hover:bg-green-500/20 transition-colors flex items-center justify-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              Accept
            </button>
          )}
          {onReject && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReject();
              }}
              className="flex-1 px-3 py-1.5 text-xs bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Reject
            </button>
          )}
        </div>
      )}

      {onMarkImplemented && recommendation.status === 'accepted' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMarkImplemented();
          }}
          className="w-full px-3 py-1.5 text-xs bg-purple-500/10 text-purple-500 rounded hover:bg-purple-500/20 transition-colors flex items-center justify-center gap-1"
        >
          <Check className="w-3.5 h-3.5" />
          Mark as Implemented
        </button>
      )}
    </div>
  );
}
