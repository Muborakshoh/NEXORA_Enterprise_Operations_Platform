/**
 * Analytics UI Components
 * 
 * Reusable components for Analytics module display.
 */

import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Download, 
  BarChart3, 
  Calendar, 
  Clock,
  Play,
  Pause,
  Trash2,
  Edit,
  Star,
  MoreVertical
} from 'lucide-react';
import type { AnalyticsDashboard, Report, Export, Aggregation } from '../../../core/types/analytics';
import { formatDistanceToNow } from 'date-fns';

// ─── Dashboard Card ─────────────────────────────────────────────────────────

interface DashboardCardProps {
  dashboard: AnalyticsDashboard;
  onEdit?: () => void;
  onDelete?: () => void;
  onSetDefault?: () => void;
  onClick?: () => void;
}

export function DashboardCard({ dashboard, onEdit, onDelete, onSetDefault, onClick }: DashboardCardProps) {
  return (
    <div 
      className="bg-surface-1 border border-border-subtle rounded-lg p-4 hover:border-accent-500/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-500/10 rounded-lg flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-accent-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-text-primary">{dashboard.name}</h3>
              {dashboard.is_default && (
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              )}
            </div>
            <p className="text-xs text-text-muted mt-1">
              {dashboard.widgets.length} widgets
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
      
      {dashboard.description && (
        <p className="text-sm text-text-secondary mb-3 line-clamp-2">
          {dashboard.description}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>
          Updated {formatDistanceToNow(new Date(dashboard.updated_at), { addSuffix: true })}
        </span>
        <div className="flex gap-1">
          {onSetDefault && !dashboard.is_default && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSetDefault();
              }}
              className="p-1 hover:bg-surface-2 rounded transition-colors"
              title="Set as default"
            >
              <Star className="w-3.5 h-3.5" />
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

// ─── Report Card ────────────────────────────────────────────────────────────

interface ReportCardProps {
  report: Report;
  onEdit?: () => void;
  onDelete?: () => void;
  onExecute?: () => void;
  onToggleSchedule?: () => void;
  onClick?: () => void;
}

export function ReportCard({ report, onEdit, onDelete, onExecute, onToggleSchedule, onClick }: ReportCardProps) {
  const getTypeColor = (type: Report['type']) => {
    switch (type) {
      case 'scheduled': return 'bg-blue-500/10 text-blue-500';
      case 'on_demand': return 'bg-green-500/10 text-green-500';
      case 'template': return 'bg-purple-500/10 text-purple-500';
      default: return 'bg-surface-2 text-text-muted';
    }
  };

  return (
    <div 
      className="bg-surface-1 border border-border-subtle rounded-lg p-4 hover:border-accent-500/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-text-primary">{report.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded capitalize ${getTypeColor(report.type)}`}>
                {report.type}
              </span>
              {report.schedule?.enabled && (
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {report.schedule.frequency}
                </span>
              )}
            </div>
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
      
      {report.description && (
        <p className="text-sm text-text-secondary mb-3 line-clamp-2">
          {report.description}
        </p>
      )}

      <div className="flex items-center gap-2 mb-3">
        {report.format.map((format, idx) => (
          <span key={idx} className="text-xs px-2 py-0.5 bg-surface-2 text-text-muted rounded uppercase">
            {format}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>
          {report.last_generated_at 
            ? `Last run ${formatDistanceToNow(new Date(report.last_generated_at), { addSuffix: true })}`
            : 'Never run'
          }
        </span>
        <div className="flex gap-1">
          {onExecute && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExecute();
              }}
              className="p-1 hover:bg-green-500/10 text-green-500 rounded transition-colors"
              title="Execute"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          )}
          {onToggleSchedule && report.schedule && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSchedule();
              }}
              className="p-1 hover:bg-surface-2 rounded transition-colors"
              title={report.schedule.enabled ? 'Disable schedule' : 'Enable schedule'}
            >
              {report.schedule.enabled ? (
                <Pause className="w-3.5 h-3.5" />
              ) : (
                <Calendar className="w-3.5 h-3.5" />
              )}
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

// ─── Export Card ────────────────────────────────────────────────────────────

interface ExportCardProps {
  exportData: Export;
  onDownload?: () => void;
  onDelete?: () => void;
  onClick?: () => void;
}

export function ExportCard({ exportData, onDownload, onDelete, onClick }: ExportCardProps) {
  const getStatusColor = (status: Export['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-500';
      case 'processing': return 'bg-blue-500/10 text-blue-500';
      case 'pending': return 'bg-yellow-500/10 text-yellow-500';
      case 'failed': return 'bg-red-500/10 text-red-500';
      case 'expired': return 'bg-surface-2 text-text-muted';
    }
  };

  const getFormatIcon = (format: Export['format']) => {
    switch (format) {
      case 'csv':
      case 'excel':
        return <BarChart3 className="w-5 h-5" />;
      case 'pdf':
        return <FileText className="w-5 h-5" />;
      default:
        return <Download className="w-5 h-5" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div 
      className="bg-surface-1 border border-border-subtle rounded-lg p-4 hover:border-accent-500/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-500">
            {getFormatIcon(exportData.format)}
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-text-primary">{exportData.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 bg-surface-2 text-text-muted rounded uppercase">
                {exportData.format}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded capitalize ${getStatusColor(exportData.status)}`}>
                {exportData.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2 text-sm text-text-secondary mb-3">
        <div className="flex justify-between">
          <span className="text-text-muted">Size:</span>
          <span>{formatFileSize(exportData.file_size)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Created:</span>
          <span>{formatDistanceToNow(new Date(exportData.created_at), { addSuffix: true })}</span>
        </div>
        {exportData.expires_at && (
          <div className="flex justify-between">
            <span className="text-text-muted">Expires:</span>
            <span>{formatDistanceToNow(new Date(exportData.expires_at), { addSuffix: true })}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {onDownload && exportData.status === 'completed' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            className="flex-1 px-3 py-1.5 text-xs bg-green-500/10 text-green-500 rounded hover:bg-green-500/20 transition-colors flex items-center justify-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="px-3 py-1.5 text-xs bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Aggregation Card ───────────────────────────────────────────────────────

interface AggregationCardProps {
  aggregation: Aggregation;
  onEdit?: () => void;
  onDelete?: () => void;
  onExecute?: () => void;
  onClick?: () => void;
}

export function AggregationCard({ aggregation, onEdit, onDelete, onExecute, onClick }: AggregationCardProps) {
  return (
    <div 
      className="bg-surface-1 border border-border-subtle rounded-lg p-4 hover:border-accent-500/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-orange-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-text-primary">{aggregation.name}</h3>
            <p className="text-xs text-text-muted mt-1">
              {aggregation.aggregation_type} • {aggregation.metric}
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
      
      {aggregation.description && (
        <p className="text-sm text-text-secondary mb-3 line-clamp-2">
          {aggregation.description}
        </p>
      )}

      <div className="space-y-2 text-sm text-text-secondary mb-3">
        <div className="flex justify-between">
          <span className="text-text-muted">Source:</span>
          <span>{aggregation.data_source}</span>
        </div>
        {aggregation.dimensions && aggregation.dimensions.length > 0 && (
          <div className="flex justify-between">
            <span className="text-text-muted">Dimensions:</span>
            <span>{aggregation.dimensions.join(', ')}</span>
          </div>
        )}
        {aggregation.time_granularity && (
          <div className="flex justify-between">
            <span className="text-text-muted">Granularity:</span>
            <span className="capitalize">{aggregation.time_granularity}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>
          Updated {formatDistanceToNow(new Date(aggregation.updated_at), { addSuffix: true })}
        </span>
        <div className="flex gap-1">
          {onExecute && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExecute();
              }}
              className="p-1 hover:bg-green-500/10 text-green-500 rounded transition-colors"
              title="Execute"
            >
              <Play className="w-3.5 h-3.5" />
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
