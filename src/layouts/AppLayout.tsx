/**
 * App Layout
 * 
 * Main application layout with sidebar and top bar.
 */

import React from 'react';
import { Outlet } from 'react-router-dom';

interface AppLayoutProps {
  children?: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-surface-0">
      {/* Sidebar */}
      <aside className="w-64 bg-surface-1 border-r border-border-subtle">
        <div className="p-4">
          <h1 className="text-xl font-bold text-text-primary">NEXORA</h1>
          <p className="text-xs text-text-muted">Enterprise Operations Platform</p>
        </div>
        <nav className="mt-6 px-2">
          <div className="space-y-1">
            <a href="/" className="flex items-center px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-lg">
              Dashboard
            </a>
            <div className="pt-4">
              <p className="px-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Security</p>
              <div className="mt-2 space-y-1">
                <a href="/security/events" className="flex items-center px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-lg">
                  Security Events
                </a>
                <a href="/security/audit" className="flex items-center px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-lg">
                  Audit Log
                </a>
                <a href="/security/sessions" className="flex items-center px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-lg">
                  Sessions
                </a>
                <a href="/security/suspicious" className="flex items-center px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-lg">
                  Suspicious Activity
                </a>
              </div>
            </div>
            <div className="pt-4">
              <p className="px-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Analytics</p>
              <div className="mt-2 space-y-1">
                <a href="/analytics/dashboards" className="flex items-center px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-lg">
                  Dashboards
                </a>
                <a href="/analytics/reports" className="flex items-center px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-lg">
                  Reports
                </a>
                <a href="/analytics/exports" className="flex items-center px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-lg">
                  Exports
                </a>
                <a href="/analytics/aggregations" className="flex items-center px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-lg">
                  Aggregations
                </a>
              </div>
            </div>
            <div className="pt-4">
              <p className="px-3 text-xs font-semibold text-text-muted uppercase tracking-wider">AI</p>
              <div className="mt-2 space-y-1">
                <a href="/ai/assistant" className="flex items-center px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-lg">
                  AI Assistant
                </a>
                <a href="/ai/tools" className="flex items-center px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-lg">
                  Tools
                </a>
                <a href="/ai/analytics" className="flex items-center px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-lg">
                  AI Analytics
                </a>
                <a href="/ai/anomaly-detection" className="flex items-center px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-lg">
                  Anomaly Detection
                </a>
                <a href="/ai/recommendations" className="flex items-center px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-lg">
                  Recommendations
                </a>
              </div>
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-surface-1 border-b border-border-subtle flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-text-primary">Security</h2>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
