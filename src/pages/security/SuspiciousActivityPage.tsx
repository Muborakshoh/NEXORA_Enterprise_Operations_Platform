/**
 * Suspicious Activity Page
 * 
 * Displays and manages suspicious activities.
 */

import { useEffect, useState } from 'react';
import { Search, Shield } from 'lucide-react';
import { useSecurity } from '../../app/providers/SecurityProvider';
import { SuspiciousActivityCard } from '../../shared/components/security';
import { Button, Input } from '../../shared/components/ui';
import type { SuspiciousActivityType, SuspiciousActivityStatus } from '../../core/types/security';

export function SuspiciousActivityPage() {
  const {
    suspiciousActivities,
    suspiciousActivitiesTotal,
    suspiciousActivitiesSummary,
    isLoadingSuspicious,
    loadSuspiciousActivities,
    startInvestigation,
    confirmThreat,
    markSuspiciousFalsePositive,
    resolveSuspicious,
  } = useSecurity();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<SuspiciousActivityType | ''>('');
  const [statusFilter, setStatusFilter] = useState<SuspiciousActivityStatus | ''>('');

  useEffect(() => {
    loadSuspiciousActivities();
  }, [loadSuspiciousActivities]);

  const handleInvestigate = async (activityId: string) => {
    try {
      await startInvestigation(activityId);
    } catch (error) {
      console.error('Failed to start investigation:', error);
    }
  };

  const handleConfirm = async (activityId: string) => {
    if (!confirm('Are you sure you want to confirm this as a threat?')) return;
    
    try {
      await confirmThreat(activityId);
    } catch (error) {
      console.error('Failed to confirm threat:', error);
    }
  };

  const handleFalsePositive = async (activityId: string) => {
    if (!confirm('Are you sure this is a false positive?')) return;
    
    try {
      await markSuspiciousFalsePositive(activityId);
    } catch (error) {
      console.error('Failed to mark as false positive:', error);
    }
  };

  const handleResolve = async (activityId: string) => {
    try {
      await resolveSuspicious(activityId);
    } catch (error) {
      console.error('Failed to resolve activity:', error);
    }
  };

  const filteredActivities = suspiciousActivities.filter(activity => {
    const matchesSearch = 
      activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.ip_address.includes(searchQuery) ||
      activity.user?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = !typeFilter || activity.type === typeFilter;
    const matchesStatus = !statusFilter || activity.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Suspicious Activity</h1>
          <p className="text-text-muted mt-1">
            Monitor and investigate suspicious activities ({suspiciousActivitiesTotal} total)
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-surface-1 border border-border-subtle rounded-lg p-4">
          <p className="text-sm text-text-muted">Total</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{suspiciousActivitiesSummary.total}</p>
        </div>
        <div className="bg-surface-1 border border-border-subtle rounded-lg p-4">
          <p className="text-sm text-text-muted">Detected</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{suspiciousActivitiesSummary.detected}</p>
        </div>
        <div className="bg-surface-1 border border-border-subtle rounded-lg p-4">
          <p className="text-sm text-text-muted">Investigating</p>
          <p className="text-2xl font-bold text-yellow-500 mt-1">{suspiciousActivitiesSummary.investigating}</p>
        </div>
        <div className="bg-surface-1 border border-border-subtle rounded-lg p-4">
          <p className="text-sm text-text-muted">Confirmed</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{suspiciousActivitiesSummary.confirmed}</p>
        </div>
        <div className="bg-surface-1 border border-border-subtle rounded-lg p-4">
          <p className="text-sm text-text-muted">False Positive</p>
          <p className="text-2xl font-bold text-gray-500 mt-1">{suspiciousActivitiesSummary.false_positive}</p>
        </div>
        <div className="bg-surface-1 border border-border-subtle rounded-lg p-4">
          <p className="text-sm text-text-muted">Resolved</p>
          <p className="text-2xl font-bold text-green-500 mt-1">{suspiciousActivitiesSummary.resolved}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px] max-w-md">
          <Input
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as SuspiciousActivityType | '')}
            className="px-3 py-2 bg-surface-2 border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:border-accent-500"
          >
            <option value="">All Types</option>
            <option value="brute_force">Brute Force</option>
            <option value="unusual_location">Unusual Location</option>
            <option value="unusual_time">Unusual Time</option>
            <option value="rapid_requests">Rapid Requests</option>
            <option value="failed_logins">Failed Logins</option>
            <option value="privilege_escalation">Privilege Escalation</option>
            <option value="data_exfiltration">Data Exfiltration</option>
            <option value="account_takeover">Account Takeover</option>
          </select>
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as SuspiciousActivityStatus | '')}
            className="px-3 py-2 bg-surface-2 border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:border-accent-500"
          >
            <option value="">All Statuses</option>
            <option value="detected">Detected</option>
            <option value="investigating">Investigating</option>
            <option value="confirmed">Confirmed</option>
            <option value="false_positive">False Positive</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Activities List */}
      {isLoadingSuspicious ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-text-muted">Loading suspicious activities...</div>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-surface-1 border border-border-subtle rounded-lg">
          <Shield className="w-12 h-12 text-green-500 mb-4" />
          <p className="text-text-muted">No suspicious activities detected</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredActivities.map(activity => (
            <SuspiciousActivityCard 
              key={activity.id} 
              activity={activity}
              onInvestigate={() => handleInvestigate(activity.id)}
              onConfirm={() => handleConfirm(activity.id)}
              onFalsePositive={() => handleFalsePositive(activity.id)}
              onResolve={() => handleResolve(activity.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
