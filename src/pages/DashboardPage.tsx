/**
 * Dashboard Page
 * 
 * Main dashboard overview.
 */

import React from 'react';

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-muted mt-1">Welcome to NEXORA Enterprise Operations Platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface-1 border border-border-subtle rounded-lg p-6">
          <h3 className="text-sm font-medium text-text-muted">Security Events</h3>
          <p className="text-3xl font-bold text-text-primary mt-2">0</p>
          <p className="text-sm text-text-muted mt-1">Active events</p>
        </div>
        <div className="bg-surface-1 border border-border-subtle rounded-lg p-6">
          <h3 className="text-sm font-medium text-text-muted">Active Sessions</h3>
          <p className="text-3xl font-bold text-text-primary mt-2">1</p>
          <p className="text-sm text-text-muted mt-1">Current session</p>
        </div>
        <div className="bg-surface-1 border border-border-subtle rounded-lg p-6">
          <h3 className="text-sm font-medium text-text-muted">Suspicious Activity</h3>
          <p className="text-3xl font-bold text-text-primary mt-2">0</p>
          <p className="text-sm text-text-muted mt-1">Detected threats</p>
        </div>
        <div className="bg-surface-1 border border-border-subtle rounded-lg p-6">
          <h3 className="text-sm font-medium text-text-muted">System Health</h3>
          <p className="text-3xl font-bold text-green-500 mt-2">100%</p>
          <p className="text-sm text-text-muted mt-1">All systems operational</p>
        </div>
      </div>

      <div className="bg-surface-1 border border-border-subtle rounded-lg p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Recent Activity</h2>
        <p className="text-text-muted">No recent activity</p>
      </div>
    </div>
  );
}
