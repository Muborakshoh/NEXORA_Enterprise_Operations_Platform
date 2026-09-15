/**
 * NEXORA Configuration
 * 
 * Centralized configuration for the frontend application.
 * Environment-specific values are resolved from Vite env variables.
 */

export const config = {
  /** Application name */
  appName: 'NEXORA',

  /** Application version */
  appVersion: '0.10.0',

  /** API base URL */
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api/v1',

  /** WebSocket URL */
  wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:6001',

  /** Auth token storage key */
  tokenStorageKey: 'nexora_auth_token',

  /** Refresh token storage key */
  refreshTokenStorageKey: 'nexora_refresh_token',

  /** Theme storage key */
  themeStorageKey: 'nexora_theme',

  /** Request timeout in milliseconds */
  requestTimeout: 30_000,

  /** Default pagination */
  defaultPageSize: 20,

  /** Feature flags */
  features: {
    realtime: true,
    ai: false,
    infrastructure: true,
    security: true,
  },
} as const;

export type Config = typeof config;
