/**
 * Security Events Page
 * 
 * Displays and manages security events.
 */

import React, { useEffect, useState } from 'react';
import { Search, Filter, Download, CheckCircle } from 'lucide-react';
import { useSecurity } from '../../app/providers/SecurityProvider';
import { SecurityEventCard } from '../../shared/components/security';
import { Button, Input } from '../../shared/components/ui';
import type { SecurityEventSeverity, SecurityEventStatus } from '../../core/types/security';

export function SecurityEventsPage() {
  const {
    securityEvents,
    securityEventsTotal,
    securityEventsSummary,
    isLoadingEvents,
    loadSecurityEvents,
    acknowledgeEvent,
    resolveEvent,
    markEventFalsePositive,
  } = useSecurity();

  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<SecurityEventSeverity | ''>('');
  const [statusFilter, setStatusFilter] = useState<SecurityEventStatus | ''>('');

  useEffect(() => {
    loadSecurityEvents();
  }, [loadSecurityEvents]);

  const handleAcknowledge = async (eventId: string) => {
    try {
      await acknowledgeEvent(eventId);
    } catch (error) {
      console.error('Failed to acknowledge event:', error);
    }
  };

  const handleResolve = async (eventId: string) => {
    try {
      await resolveEvent(eventId);
    } catch (error) {
      console.error('Failed to resolve event:', error);
    }
  };

  const handleFalsePositive = async (eventId: string) => {
    try {
      await markEventFalsePositive(eventId);
    } catch (error) {
      console.error('Failed to mark as false positive:', error);
    }
  };

  const filteredEvents = securityEvents.filter(event => {
    const matchesSearch = 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.ip_address.includes(searchQuery);
    
    const matchesSeverity = !severityFilter || event.severity === severityFilter;
    const matchesStatus = !statusFilter || event.status === statusFilter;
    
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Security Events</h1>
          <p className="text-text-muted mt-1">
            Monitor and manage security events ({securityEventsTotal} total)
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-9 gap-4">
        <div className="bg-surface-1 border border-border-subtle rounded-lg p-4">
          <p className="text-sm text-text-muted">Total</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{securityEventsSummary.total}</p>
        </div>
        <div className="bg-surface-1 border border-border-subtle rounded-lg p-4">
          <p className="text-sm text-text-muted">Critical</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{securityEventsSummary.critical}</p>
        </div>
        <div className="bg-surface-1 border border-border-subtle rounded-lg p-4">
          <p className="text-sm text-text-muted">High</p>
          <p className="text-2xl font-bold text-orange-500 mt-1">{securityEventsSummary.high}</p>
        </div>
        <div className="bg-surface-1 border border-border-subtle rounded-lg p-4">
          <p className="text-sm text-text-muted">Medium</p>
          <p className="text-2xl font-bold text-yellow-500 mt-1">{securityEventsSummary.medium}</p>
        </div>
        <div className="bg-surface-1 border border-border-subtle rounded-lg p-4">
          <p className="text-sm text-text-muted">Low</p>
          <p className="text-2xl font-bold text-blue-500 mt-1">{securityEventsSummary.low}</p>
        </div>
        <div className="bg-surface-1 border border-border-subtle rounded-lg p-4">
          <p className="text-sm text-text-muted">Info</p>
          <p className="text-2xl font-bold text-gray-500 mt-1">{securityEventsSummary.info}</p>
        </div>
        <div className="bg-surface-1 border border-border-subtle rounded-lg p-4">
          <p className="text-sm text-text-muted">Active</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{securityEventsSummary.active}</p>
        </div>
        <div className="bg-surface-1 border border-border-subtle rounded-lg p-4">
          <p className="text-sm text-text-muted">Acknowledged</p>
          <p className="text-2xl font-bold text-blue-500 mt-1">{securityEventsSummary.acknowledged}</p>
        </div>
        <div className="bg-surface-1 border border-border-subtle rounded-lg p-4">
          <p className="text-sm text-text-muted">Resolved</p>
          <p className="text-2xl font-bold text-green-500 mt-1">{securityEventsSummary.resolved}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px] max-w-md">
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
        <div>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as SecurityEventSeverity | '')}
            className="px-3 py-2 bg-surface-2 border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:border-accent-500"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="info">Info</option>
          </select>
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as SecurityEventStatus | '')}
            className="px-3 py-2 bg-surface-2 border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:border-accent-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
            <option value="false_positive">False Positive</option>
          </select>
        </div>
      </div>

      {/* Events List */}
      {isLoadingEvents ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-text-muted">Loading security events...</div>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-surface-1 border border-border-subtle rounded-lg">
          <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
          <p className="text-text-muted">No security events found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map(event => (
            <SecurityEventCard 
              key={event.id} 
              event={event}
              onAcknowledge={() => handleAcknowledge(event.id)}
              onResolve={() => handleResolve(event.id)}
              onFalsePositive={() => handleFalsePositive(event.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
