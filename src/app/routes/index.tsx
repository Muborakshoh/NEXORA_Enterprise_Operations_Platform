/**
 * Application Routes
 * 
 * Defines all routes for the NEXORA platform.
 * Uses ProtectedRoute for authentication and authorization.
 */

import { createBrowserRouter, Outlet, Navigate } from 'react-router-dom';
import { AppLayout } from '../../layouts/AppLayout';
import { DashboardPage } from '../../pages/DashboardPage';
import { LoginPage } from '../../pages/LoginPage';
import { SecurityEventsPage } from '../../pages/security/SecurityEventsPage';
import { AuditPage } from '../../pages/security/AuditPage';
import { SessionsPage } from '../../pages/security/SessionsPage';
import { SuspiciousActivityPage } from '../../pages/security/SuspiciousActivityPage';
import { DashboardsPage } from '../../pages/analytics/DashboardsPage';
import { ReportsPage } from '../../pages/analytics/ReportsPage';
import { ExportsPage } from '../../pages/analytics/ExportsPage';
import { AggregationsPage } from '../../pages/analytics/AggregationsPage';
import { PlaceholderPage } from '../../pages/PlaceholderPage';
import { ProtectedRoute } from '../../shared/components/ProtectedRoute';

export const router = createBrowserRouter([
  {
    element: <AppLayout><Outlet /></AppLayout>,
    children: [
      // Auth (public)
      { path: '/login', element: <LoginPage /> },

      // Overview (protected)
      {
        path: '/',
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },

      // Security (protected)
      {
        path: '/security/events',
        element: (
          <ProtectedRoute>
            <SecurityEventsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/security/audit',
        element: (
          <ProtectedRoute>
            <AuditPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/security/sessions',
        element: (
          <ProtectedRoute>
            <SessionsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/security/suspicious',
        element: (
          <ProtectedRoute>
            <SuspiciousActivityPage />
          </ProtectedRoute>
        ),
      },

      // Placeholder pages for other modules
      {
        path: '/crm/*',
        element: (
          <ProtectedRoute>
            <PlaceholderPage title="CRM" module="Business" />
          </ProtectedRoute>
        ),
      },
      {
        path: '/finance/*',
        element: (
          <ProtectedRoute>
            <PlaceholderPage title="Finance" module="Business" />
          </ProtectedRoute>
        ),
      },
      {
        path: '/inventory/*',
        element: (
          <ProtectedRoute>
            <PlaceholderPage title="Inventory" module="Business" />
          </ProtectedRoute>
        ),
      },
      {
        path: '/infrastructure/*',
        element: (
          <ProtectedRoute>
            <PlaceholderPage title="Infrastructure" module="Infrastructure" />
          </ProtectedRoute>
        ),
      },
      // Analytics (protected)
      {
        path: '/analytics/dashboards',
        element: (
          <ProtectedRoute>
            <DashboardsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/analytics/reports',
        element: (
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/analytics/exports',
        element: (
          <ProtectedRoute>
            <ExportsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/analytics/aggregations',
        element: (
          <ProtectedRoute>
            <AggregationsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/analytics',
        element: (
          <ProtectedRoute>
            <DashboardsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/ai/*',
        element: (
          <ProtectedRoute>
            <PlaceholderPage title="AI Intelligence" module="AI" />
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/*',
        element: (
          <ProtectedRoute>
            <PlaceholderPage title="Administration" module="Administration" />
          </ProtectedRoute>
        ),
      },

      // Catch-all
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
