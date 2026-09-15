/**
 * Audit Log Page
 * 
 * Displays and manages audit logs.
 */

import React, { useEffect, useState } from 'react';
import { Search, Download } from 'lucide-react';
import { useSecurity } from '../../app/providers/SecurityProvider';
import { AuditLogRow } from '../../shared/components/security';
import { Button, Input } from '../../shared/components/ui';
import type { AuditAction } from '../../core/types/security';

export function AuditPage() {
  const {
    auditLogs,
    auditLogsTotal,
    auditLogsHasMore,
    isLoadingLogs,
    loadAuditLogs,
    exportAuditLogs,
  } = useSecurity();

  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<AuditAction | ''>('');

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const blob = await exportAuditLogs(undefined, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export audit logs:', error);
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ip_address.includes(searchQuery);
    
    const matchesAction = !actionFilter || log.action === actionFilter;
    
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Audit Log</h1>
          <p className="text-text-muted mt-1">
            Track all system activities and changes ({auditLogsTotal} total)
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            onClick={() => handleExport('csv')}
            icon={<Download className="w-4 h-4" />}
          >
            Export CSV
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => handleExport('json')}
            icon={<Download className="w-4 h-4" />}
          >
            Export JSON
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px] max-w-md">
          <Input
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
        <div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value as AuditAction | '')}
            className="px-3 py-2 bg-surface-2 border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:border-accent-500"
          >
            <option value="">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="read">Read</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="export">Export</option>
            <option value="import">Import</option>
            <option value="approve">Approve</option>
            <option value="reject">Reject</option>
          </select>
        </div>
      </div>

      {/* Logs List */}
      {isLoadingLogs ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-text-muted">Loading audit logs...</div>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-surface-1 border border-border-subtle rounded-lg">
          <p className="text-text-muted">No audit logs found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredLogs.map(log => (
            <AuditLogRow key={log.id} log={log} />
          ))}
          {auditLogsHasMore && (
            <div className="flex justify-center pt-4">
              <Button variant="secondary" onClick={() => loadAuditLogs()}>
                Load More
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
