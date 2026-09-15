# Production Hardening Guide

## Overview

This guide covers all aspects of preparing NEXORA for production deployment, including performance optimization, security hardening, observability, backup and disaster recovery, and testing.

## Table of Contents

1. [Performance Optimization](#performance-optimization)
2. [Security Hardening](#security-hardening)
3. [Observability](#observability)
4. [Backup and Disaster Recovery](#backup-and-disaster-recovery)
5. [Testing](#testing)
6. [Deployment Checklist](#deployment-checklist)

---

## Performance Optimization

### Bundle Size Optimization

#### Code Splitting
```typescript
// Lazy load routes
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
```

#### Tree Shaking
- Use ES6 imports/exports
- Avoid default exports for utilities
- Use named imports

#### Dynamic Imports
```typescript
// Load heavy libraries on demand
const loadChartLibrary = async () => {
  const { Chart } = await import('chart.js');
  return Chart;
};
```

### Runtime Performance

#### Memoization
```typescript
import { useDebounce, useThrottle, useMemoWithDeps } from './core/utils/performance';

// Debounce expensive operations
const debouncedSearch = useDebounce(searchQuery, 300);

// Throttle scroll handlers
const throttledScroll = useThrottle(scrollPosition, 100);

// Memoize expensive calculations
const filteredData = useMemoWithDeps(
  () => expensiveFilter(data, filters),
  [data, filters],
  'filter-operation'
);
```

#### Virtual Scrolling
```typescript
import { useVirtualScroll } from './core/utils/performance';

const { visibleItems, totalHeight, offsetY, onScroll } = useVirtualScroll(
  items.length,
  50, // item height
  600 // container height
);
```

#### Image Optimization
```typescript
import { useImageOptimization } from './core/utils/performance';

const optimizedSrc = useImageOptimization(imageUrl, 800, 600);
// Automatically adds width, height, quality, and format parameters
```

### Caching Strategies

#### API Response Caching
```typescript
import { useCache } from './core/utils/performance';

const { get, set, clear } = useCache<UserData>('user-data', 5 * 60 * 1000);

// Get cached data
const cachedUser = get();
if (cachedUser) {
  return cachedUser;
}

// Fetch and cache
const user = await fetchUser();
set(user);
```

#### Service Worker Caching
```javascript
// sw.js
const CACHE_NAME = 'nexora-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/main.js',
  '/static/css/main.css',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});
```

### Performance Monitoring

```typescript
import { usePerformanceMonitor, analyzeBundleSize, useMemoryMonitor } from './core/utils/performance';

// Monitor component render time
const { start, end } = usePerformanceMonitor('DashboardRender');
start();
// ... render logic
const duration = end();

// Analyze bundle size
analyzeBundleSize();

// Monitor memory usage
useMemoryMonitor();
```

---

## Security Hardening

### Content Security Policy

```typescript
import { CSP_CONFIG, generateCSPHeader } from './core/utils/security';

// Apply CSP headers
const cspHeader = generateCSPHeader();
// Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' ...
```

### Security Headers

```typescript
import { SECURITY_HEADERS, applySecurityHeaders } from './core/utils/security';

// Apply all security headers
applySecurityHeaders(response.headers);
// X-Content-Type-Options: nosniff
// X-Frame-Options: DENY
// X-XSS-Protection: 1; mode=block
// Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Input Sanitization

```typescript
import { sanitize } from './core/utils/security';

// Sanitize user input
const safeString = sanitize.string(userInput);
const safeHtml = sanitize.html(htmlInput);
const safeUrl = sanitize.url(urlInput);
const safeEmail = sanitize.email(emailInput);
const safeFilename = sanitize.filename(filename);
```

### Rate Limiting

```typescript
import { RateLimiter } from './core/utils/security';

const limiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  message: 'Too many requests',
});

// Check if request is allowed
if (!limiter.isAllowed(userId)) {
  throw new Error('Rate limit exceeded');
}

// Get remaining requests
const remaining = limiter.getRemaining(userId);
```

### CSRF Protection

```typescript
import { CSRFProtection } from './core/utils/security';

// Generate CSRF token
const token = CSRFProtection.generateToken();

// Apply to request
CSRFProtection.applyTo真人秀Headers(headers);

// Validate token
if (!CSRFProtection.validateToken(receivedToken)) {
  throw new Error('Invalid CSRF token');
}
```

### Secure Storage

```typescript
import { SecureStorage } from './core/utils/security';

// Store sensitive data
await SecureStorage.setItem('auth_token', token);

// Retrieve sensitive data
const token = await SecureStorage.getItem<string>('auth_token');

// Remove sensitive data
SecureStorage.removeItem('auth_token');
```

### Password Validation

```typescript
import { PasswordValidator } from './core/utils/security';

const result = PasswordValidator.validate(password);
if (!result.valid) {
  console.error('Password errors:', result.errors);
}

// Check against common passwords
if (PasswordValidator.isCommonPassword(password)) {
  throw new Error('Password is too common');
}
```

### Session Security

```typescript
import { SessionSecurity } from './core/utils/security';

// Check session expiry
if (SessionSecurity.isSessionExpired(sessionData.expiry)) {
  SessionSecurity.clearSession();
  throw new Error('Session expired');
}

// Extend session
const newExpiry = SessionSecurity.extendSession(currentExpiry, 3600000);

// Validate session integrity
if (!SessionSecurity.validateSession(sessionData)) {
  throw new Error('Invalid session');
}
```

### Audit Logging

```typescript
import { AuditLogger } from './core/utils/security';

// Log security event
AuditLogger.log({
 бовать
  type: 'authentication',
  userId: user.id,
  action: 'login_success',
  ipAddress: request.ip,
  userAgent: request.userAgent,
});

// Export audit logs
const logs = AuditLogger.exportLogs();
```

---$total
### Security Checks

```typescript
import {p SecurityCheck } from './core/utils/security';

const securityStatus = SecurityCheck.checkBrowserSecurity();
// {
//   secureContext: true,
//   cookiesEnabled: true,
//   https: true,
//   serviceWorker: true
// }
```

---

## Observability

### Structured Logging

```typescript
import { logger, LogLevel } from './core/utils/observability';

// Set minimum log level
logger.setMinLevel(LogLevel.INFO);

// Log with context
logger.info('User logged in', {
  userId: user.id,
  organizationId: org.id,
  ipAddress: request.ip,
});

// Log errors
logger.error('Failed to process payment', {
  error: error.message,
  stack: error.stack,
  paymentId: payment.id,
});

// Get logs
const errorLogs = logger.getLogs(LogLevel.ERROR);
const stats = logger.getStats();
```

### Metrics Collection

```typescript간단히
import { metrics } from './core/utils/observability';

// Gauge metrics (current value)
metrics.gauge('active_users', 150, { region: 'us-east' });

// Counter metrics (incremental)
metrics.increment('api_requests_total');
metrics.increment('api_errors_total', 1);

// Histogram metrics (distribution)
metrics.histogram('request_duration_ms', 245);

// Get statistics
const requestStats = metrics.getHistogramStats('request_duration_ms');
// { count: 1000, min: 10, max: 5000, avg: 245, p50: 200, p95: 800, p99: 2000 }
```

### Distributed Tracing

```typescript
import { tracer } from './core/utils/observability';

// Start a new trace
const span = tracer.startTrace('api-request', { endpoint: '/api/users' });

// Add child span
const childSpan = tracer.continueTrace(span.traceId, span.spanId, 'database-query');

// Log within span
span.log('Processing request', { userId: 123 });

// Set tags
span.setTag('http.method', 'GET');
span.setTag('http.status_code', '200');

// Finish span
childSpan.finish();
span.finish();

// Export traces
const traces = tracer.exportTraces();
```

### Performance Observability

```typescript
import { performanceObserver } from './core/utils/observability';

// Start observing
performanceObserver.startObserving();

// Record custom metrics
performanceObserver.recordMetric('custom_metric', 123.45);

// Get Web Vitals
const vitals = performanceObserver.getWebVitals();
// { fcp: 1200, lcp: 2500, fid: 50, cls: 0.1 }
```

### Error Tracking

```typescript
import { errorTracker } from './core/utils/observability';

// Track error
errorTracker.trackError(new Error('Something went wrong'), {
  component: 'Dashboard',
  userId: user.id,
});

// Get error statistics
const stats = errorTracker.getStats();
// { total: 50, last24h: 5, byType: { TypeError: 30, Error: 20 } }
```

### Health Checks

```typescript
import { healthCheck } from './core/utils/observability';

// Register health checks
healthCheck.registerCheck('api', async () => {
  const response = await fetch('/health');
  return response.ok;
});

healthCheck.registerCheck('database', async () => {
  // Check database connection
  return true;
});

// Run all checks
const status = await healthCheck.getStatus();
// { status: 'healthy', checks: { api: { status: 'healthy', duration: 50 } } }
```

---

## Backup and Disaster Recovery

### Creating Backups

```typescript
import { backupManager } from './core/utils/backup';

// Create backup
const backup = await backupManager.createBackup();

// Export to file
await backupManager.exportToFile('my-backup.json');

// Schedule automatic backups (daily)
backupManager.scheduleAutoBackup(24 * 60 * 60 * 1000);
```

### Restoring from Backup

```typescript
// Restore from backup data
await backupManager.restoreBackup(backupData);

// Import from file
const file = document.querySelector('input[type=file]').files[0];
const backup = await backupManager.importFromFile(file);
await backupManager.restoreBackup(backup);
```

### Recovery Points

```typescript
import { disasterRecoveryManager } from './core/utils/backup';

// Create recovery point
const recoveryId = await disasterRecoveryManager.createRecoveryPoint('Before migration');

// List all recovery points
const points = disasterRecoveryManager.getRecoveryPoints();

// Restore from recovery point
await disasterRecoveryManager.restoreFromRecoveryPoint(recoveryId);
```

### Data Migration

```typescript
import { DataMigration } from './core/utils/backup';

// Check if migration is needed
const currentVersion = DataMigration.getCurrentVersion();
if (DataMigration.needsMigration(currentVersion, '2.0.0')) {
  await DataMigration.migrate(currentVersion, '2.0.0');
  DataMigration.setVersion('2.0.0');
}
```

### Data Integrity

```typescript
import { DataIntegrityChecker } from './core/utils/backup';

// Check data integrity
const result = await DataIntegrityChecker.check();
if (!result.valid) {
  console.error('Data integrity errors:', result.errors);
}

// Repair data
const repairResult = await DataIntegrityChecker.repair();
console.log('Repaired:', repairResult.repaired);
```

---

## Testing

### Unit Testing

```typescript
// Example: Testing a utility function
import { describe, it, expect } from 'vitest';
import { sanitize } from './core/utils/security';

describe('sanitize', () => {
  it('should remove HTML tags', () => {
    expect(sanitize.string('<script>alert("xss")</script>')).toBe('alert("xss")');
  });

  it('should validate email', () => {
    expect(sanitize.email('user@example.com')).toBe('user@example.com');
    expect(sanitize.email('invalid-email')).toBe('');
  });
});
```

### Integration Testing

```typescript
// Example: Testing API client
import { describe, it, expect, vi } from 'vitest';
import { apiClient } from './core/api/client';

describe('apiClient', () => {
  it('should make GET request', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: 1 } }),
    });

    const result = await apiClient.get('/users/1');
    expect(result).toEqual({ id: 1 });
  });
});
```

### Component Testing

```typescript
// Example: Testing React component
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './shared/components/ui/Button';

describe('Button', () => {
  it('should render with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should be disabled when loading', () => {
    render(<Button isLoading>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### E2E Testing

```typescript
// Example: Testing user flow
import { test, expect } from '@playwright/test';

test('user can login and view dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name=email]', 'user@example.com');
  await page.fill('input[name=password]', 'password');
  await page.click('button[type=submit]');
  
  await expect(page).toHaveURL('/');
  await expect(page.locator('h1')).toContainText('Dashboard');
});
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (unit, integration, E2E)
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Bundle size optimized
- [ ] Environment variables configured
- [ ] SSL certificates valid
- [ ] Database backups verified
- [ ] Monitoring and alerting configured
- [ ] Error tracking enabled
- [ ] Logging levels set appropriately

### Production Configuration

```bash
# Environment variables
NODE_ENV=production
VITE_API_BASE_URL=https://api.nexora.io/api/v1
VITE_WS_URL=wss://ws.nexora.io

# Security
VITE_ENABLE_CSP=true
VITE_STRICT_TRANSPORT_SECURITY=true

# Monitoring
VITE_ENABLE_METRICS=true
VITE_ENABLE_TRACING=true
VITE_LOG_LEVEL=warn
```

### Post-Deployment

- [ ] Health checks passing
- [ ] Monitoring dashboards showing normal metrics
- [ ] Error rates within acceptable thresholds
- [ ] Response times within SLA
- [ ] Backup jobs running successfully
- [ ] Security headers verified
- [ ] CORS configuration correct
- [ ] Rate limiting active

---

## Monitoring and Alerting

### Key Metrics to Monitor

1. **Application Metrics**
   - Request rate
   - Error rate
   - Response time (p50, p95, p99)
   - Active users

2. **Infrastructure Metrics**
   - CPU usage
   - Memory usage
   - Disk usage
   - Network I/O

3. **Business Metrics**
   - User signups
   - Transaction volume
   - API usage
   - Feature adoption

### Alert Thresholds

```yaml
alerts:
  - name: HighErrorRate
    condition: error_rate > 5%
    duration: 5m
    severity: critical
    
  - name: HighResponseTime
    condition: p95_response_time > 2000ms
    duration: 10m
    severity: warning
    
  - name: LowDiskSpace
    condition: disk_usage > 85%
    duration: 15m
    severity: warning
```

---

## Conclusion

This production hardening guide provides a comprehensive approach to preparing NEXORA for production deployment. By following these practices, you ensure:

- **Performance**: Optimized bundle size, efficient rendering, and caching strategies
- **Security**: Protection against common vulnerabilities, secure data handling, and audit trails
- **Observability**: Complete visibility into application behavior with logging, metrics, and tracing
- **Reliability**: Robust backup and recovery procedures with data integrity checks
- **Quality**: Comprehensive testing at all levels

Remember to regularly review and update these practices as your application evolves and new threats emerge.
