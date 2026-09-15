/**
 * NEXORA Application Entry Point
 * 
 * Composes all providers and renders the application.
 * Provider order matters — outer providers wrap inner ones.
 * 
 * Architecture:
 *   ErrorBoundary → ThemeProvider → AuthProvider → SecurityProvider → RouterProvider
 */

import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { SecurityProvider } from './app/providers/SecurityProvider';
import { AnalyticsProvider } from './app/providers/AnalyticsProvider';
import { router } from './app/routes';

export default function App() {
  return (
    <SecurityProvider>
      <AnalyticsProvider>
        <RouterProvider router={router} />
      </AnalyticsProvider>
    </SecurityProvider>
  );
}
