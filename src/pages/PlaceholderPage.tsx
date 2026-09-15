/**
 * Placeholder Page
 * 
 * Placeholder for modules not yet implemented.
 */

import React from 'react';

interface PlaceholderPageProps {
  title: string;
  module: string;
}

export function PlaceholderPage({ title, module }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="w-16 h-16 bg-surface-2 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">{title}</h2>
        <p className="text-text-muted mb-4">
          This module is part of the {module} section and will be implemented in a future phase.
        </p>
        <div className="inline-flex items-center px-4 py-2 bg-surface-2 rounded-lg">
          <span className="text-sm text-text-muted">Coming Soon</span>
        </div>
      </div>
    </div>
  );
}
