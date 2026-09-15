/**
 * Observability Utilities
 * 
 * Monitoring, logging, and tracing utilities for production observability.
 */

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

/**
 * Log entry structure
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  traceId?: string;
  spanId?: string;
  userId?: string;
  organizationId?: string;
}

/**
 * Logger class for structured logging
 */
export class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs = 10000;
  private minLevel: LogLevel = LogLevel.INFO;
  private traceId?: string;
  private spanId?: string;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Set minimum log level
   */
  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  /**
   * Set trace context
   */
  setTraceContext(traceId: string, spanId?: string): void {
    this.traceId = traceId;
    this.spanId = spanId;
  }

  /**
   * Clear trace context
   */
  clearTraceContext(): void {
    this.traceId = undefined;
    this.spanId = undefined;
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log error message
   */
  error(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context);
  }

  /**
   * Log fatal message
   */
  fatal(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.FATAL, message, context);
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (level < this.minLevel) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      traceId: this.traceId,
      spanId: this.spanId,
    };

    this.logs.push(entry);

    // Keep only last N logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output in development
    if (import.meta.env.DEV) {
      const levelName = LogLevel[level];
      const consoleMethod = level >= LogLevel.ERROR ? 'error' : level >= LogLevel.WARN ? 'warn' : 'log';
      console[consoleMethod](`[${levelName}] ${message}`, context || '');
    }
  }

  /**
   * Get all logs
   */
  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter(log => log.level >= level);
    }
    return [...this.logs];
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Get log statistics
   */
  getStats(): {
    total: number;
    byLevel: Record<string, number>;
    oldest: string | null;
    newest: string | null;
  } {
    const byLevel: Record<string, number> = {};
    
    this.logs.forEach(log => {
      const levelName = LogLevel[log.level];
      byLevel[levelName] = (byLevel[levelName] || 0) + 1;
    });

    return {
      total: this.logs.length,
      byLevel,
      oldest: this.logs.length > 0 ? this.logs[0].timestamp : null,
      newest: this.logs.length > 0 ? this.logs[this.logs.length - 1].timestamp : null,
    };
  }
}

/**
 * Metrics collector
 */
export class MetricsCollector {
  private static instance: MetricsCollector;
  private metrics: Map<string, { value: number; timestamp: number; tags?: Record<string, string> }> = new Map();
  private counters: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();

  private constructor() {}

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  /**
   * Set gauge metric
   */
  gauge(name: string, value: number, tags?: Record<string, string>): void {
    this.metrics.set(name, {
      value,
      timestamp: Date.now(),
      tags,
    });
  }

  /**
   * Increment counter
   */
  increment(name: string, value: number = 1): void {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + value);
  }

  /**
   * Record histogram value
   */
  histogram(name: string, value: number): void {
    const values = this.histograms.get(name) || [];
    values.push(value);
    
    // Keep only last 1000 values
    if (values.length > 1000) {
      values.shift();
    }
    
    this.histograms.set(name, values);
  }

  /**
   * Get metric value
   */
  getMetric(name: string): number | undefined {
    return this.metrics.get(name)?.value;
  }

  /**
   * Get counter value
   */
  getCounter(name: string): number {
    return this.counters.get(name) || 0;
  }

  /**
   * Get histogram statistics
   */
  getHistogramStats(name: string): {
    count: number;
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const values = this.histograms.get(name);
    if (!values || values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      count: sorted.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / sorted.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Record<string, any> {
    const result: Record<string, any> = {
      gauges: {},
      counters: {},
      histograms: {},
    };

    this.metrics.forEach((value, key) => {
      result.gauges[key] = value;
    });

    this.counters.forEach((value, key) => {
      result.counters[key] = value;
    });

    this.histograms.forEach((values, key) => {
      result.histograms[key] = this.getHistogramStats(key);
    });

    return result;
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics.clear();
    this.counters.clear();
    this.histograms.clear();
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): string {
    return JSON.stringify(this.getAllMetrics(), null, 2);
  }
}

/**
 * Distributed tracing
 */
export class Tracer {
  private static instance: Tracer;
  private spans: Map<string, Span> = new Map();

  private constructor() {}

  static getInstance(): Tracer {
    if (!Tracer.instance) {
      Tracer.instance = new Tracer();
    }
    return Tracer.instance;
  }

  /**
   * Start new trace
   */
  startTrace(name: string, tags?: Record<string, string>): Span {
    const traceId = this.generateId();
    const spanId = this.generateId();
    
    const span = new Span(traceId, spanId, name, tags);
    this.spans.set(spanId, span);
    
    return span;
  }

  /**
   * Continue trace from parent
   */
  continueTrace(traceId: string, parentSpanId: string, name: string, tags?: Record<string, string>): Span {
    const spanId = this.generateId();
    const span = new Span(traceId, spanId, name, tags, parentSpanId);
    this.spans.set(spanId, span);
    
    return span;
  }

  /**
   * Get span by ID
   */
  getSpan(spanId: string): Span | undefined {
    return this.spans.get(spanId);
  }

  /**
   * Get all spans for trace
   */
  getTraceSpans(traceId: string): Span[] {
    return Array.from(this.spans.values()).filter(span => span.traceId === traceId);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Export trace data
   */
  exportTraces(): string {
    const spans = Array.from(this.spans.values()).map(span => span.toJSON());
    return JSON.stringify(spans, null, 2);
  }

  /**
   * Clear old spans
   */
  cleanup(maxAge: number = 3600000): void {
    const now = Date.now();
    for (const [spanId, span] of this.spans.entries()) {
      if (now - span.startTime > maxAge) {
        this.spans.delete(spanId);
      }
    }
  }
}

/**
 * Span class for distributed tracing
 */
export class Span {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  tags: Record<string, string>;
  startTime: number;
  endTime?: number;
  status: 'ok' | 'error' = 'ok';
  logs: Array<{ timestamp: number; message: string; fields?: Record<string, any> }> = [];

  constructor(
    traceId: string,
    spanId: string,
    name: string,
    tags?: Record<string, string>,
    parentSpanId?: string
  ) {
    this.traceId = traceId;
    this.spanId = spanId;
    this.parentSpanId = parentSpanId;
    this.name = name;
    this.tags = tags || {};
    this.startTime = Date.now();
  }

  /**
   * Set tag
   */
  setTag(key: string, value: string): void {
    this.tags[key] = value;
  }

  /**
   * Log message
   */
  log(message: string, fields?: Record<string, any>): void {
    this.logs.push({
      timestamp: Date.now(),
      message,
      fields,
    });
  }

  /**
   * Set error status
   */
  setError(error: Error): void {
    this.status = 'error';
    this.setTag('error', 'true');
    this.setTag('error.message', error.message);
    this.setTag('error.stack', error.stack || '');
  }

  /**
   * Finish span
   */
  finish(): void {
    this.endTime = Date.now();
  }

  /**
   * Get duration in milliseconds
   */
  getDuration(): number {
    if (!this.endTime) return Date.now() - this.startTime;
    return this.endTime - this.startTime;
  }

  /**
   * Convert to JSON
   */
  toJSON(): any {
    return {
      traceId: this.traceId,
      spanId: this.spanId,
      parentSpanId: this.parentSpanId,
      name: this.name,
      tags: this.tags,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.getDuration(),
      status: this.status,
      logs: this.logs,
    };
  }
}

/**
 * Performance metrics observer
 */
export class PerformanceMetricsObserver {
  private static instance: PerformanceMetricsObserver;
  private metrics: Map<string, number[]> = new Map();

  private constructor() {}

  static getInstance(): PerformanceMetricsObserver {
    if (!PerformanceMetricsObserver.instance) {
      PerformanceMetricsObserver.instance = new PerformanceMetricsObserver();
    }
    return PerformanceMetricsObserver.instance;
  }

  /**
   * Start observing performance
   */
  startObserving(): void {
    if (typeof window.PerformanceObserver === 'undefined') return;

    // Observe paint timings
    const paintObserver = new window.PerformanceObserver((list: any) => {
      list.getEntries().forEach((entry: any) => {
        this.recordMetric(`paint.${entry.name}`, entry.startTime);
      });
    });

    try {
      paintObserver.observe({ entryTypes: ['paint'] });
    } catch (e) {
      // Paint timing not supported
    }

    // Observe resource timings
    const resourceObserver = new window.PerformanceObserver((list: any) => {
      list.getEntries().forEach((entry: any) => {
        const resourceEntry = entry as PerformanceResourceTiming;
        this.recordMetric(`resource.${resourceEntry.name}`, resourceEntry.duration);
      });
    });

    try {
      resourceObserver.observe({ entryTypes: ['resource'] });
    } catch (e) {
      // Resource timing not supported
    }

    // Observe long tasks
    const longTaskObserver = new window.PerformanceObserver((list: any) => {
      list.getEntries().forEach((entry: any) => {
        this.recordMetric('longtask', entry.duration);
      });
    });

    try {
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // Long task timing not supported
    }
  }

  /**
   * Record custom metric
   */
  recordMetric(name: string, value: number): void {
    const values = this.metrics.get(name) || [];
    values.push(value);
    
    // Keep only last 100 values
    if (values.length > 100) {
      values.shift();
    }
    
    this.metrics.set(name, values);
  }

  /**
   * Get metric statistics
   */
  getMetricStats(name: string): {
    count: number;
    min: number;
    max: number;
    avg: number;
  } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return null;

    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: sum / values.length,
    };
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Record<string, any> {
    const result: Record<string, any> = {};
    
    this.metrics.forEach((values, name) => {
      result[name] = this.getMetricStats(name);
    });

    return result;
  }

  /**
   * Get Web Vitals
   */
  getWebVitals(): {
    fcp?: number;
    lcp?: number;
    fid?: number;
    cls?: number;
  } {
    const fcp = this.getMetricStats('paint.first-contentful-paint');
    const lcp = this.getMetricStats('largest-contentful-paint');
    const fid = this.getMetricStats('first-input-delay');
    const cls = this.getMetricStats('cumulative-layout-shift');

    return {
      fcp: fcp?.avg,
      lcp: lcp?.avg,
      fid: fid?.avg,
      cls: cls?.avg,
    };
  }

  /**
   * Export metrics
   */
  exportMetrics(): string {
    return JSON.stringify(this.getAllMetrics(), null, 2);
  }
}

/**
 * Error tracking
 */
export class ErrorTracker {
  private static instance: ErrorTracker;
  private errors: Array<{
    timestamp: number;
    error: string;
    stack?: string;
    context?: Record<string, any>;
    userId?: string;
    url?: string;
  }> = [];
  private maxErrors = 1000;

  private constructor() {
    this.setupGlobalHandlers();
  }

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalHandlers(): void {
    window.addEventListener('error', (event) => {
      this.trackError(event.error || new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)), {
        type: 'unhandledrejection',
      });
    });
  }

  /**
   * Track error
   */
  trackError(error: Error, context?: Record<string, any>): void {
    this.errors.push({
      timestamp: Date.now(),
      error: error.message,
      stack: error.stack,
      context,
      url: window.location.href,
    });

    // Keep only last N errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Log error
    Logger.getInstance().error(error.message, { stack: error.stack, context });
  }

  /**
   * Get all errors
   */
  getErrors(): typeof this.errors {
    return [...this.errors];
  }

  /**
   * Get error statistics
   */
  getStats(): {
    total: number;
    last24h: number;
    byType: Record<string, number>;
  } {
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;
    
    const byType: Record<string, number> = {};
    let last24hCount = 0;

    this.errors.forEach(error => {
      if (error.timestamp > last24h) {
        last24hCount++;
      }
      
      const type = error.error.split(':')[0] || 'Unknown';
      byType[type] = (byType[type] || 0) + 1;
    });

    return {
      total: this.errors.length,
      last24h: last24hCount,
      byType,
    };
  }

  /**
   * Clear errors
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * Export errors
   */
  exportErrors(): string {
    return JSON.stringify(this.errors, null, 2);
  }
}

/**
 * Health check
 */
export class HealthCheck {
  private static instance: HealthCheck;
  private checks: Map<string, () => Promise<boolean>> = new Map();

  private constructor() {}

  static getInstance(): HealthCheck {
    if (!HealthCheck.instance) {
      HealthCheck.instance = new HealthCheck();
    }
    return HealthCheck.instance;
  }

  /**
   * Register health check
   */
  registerCheck(name: string, check: () => Promise<boolean>): void {
    this.checks.set(name, check);
  }

  /**
   * Run all health checks
   */
  async runChecks(): Promise<{
    healthy: boolean;
    checks: Record<string, { status: 'healthy' | 'unhealthy'; duration: number }>;
  }> {
    const results: Record<string, { status: 'healthy' | 'unhealthy'; duration: number }> = {};
    let allHealthy = true;

    for (const [name, check] of this.checks.entries()) {
      const start = Date.now();
      try {
        const isHealthy = await check();
        results[name] = {
          status: isHealthy ? 'healthy' : 'unhealthy',
          duration: Date.now() - start,
        };
        if (!isHealthy) allHealthy = false;
      } catch (error) {
        results[name] = {
          status: 'unhealthy',
          duration: Date.now() - start,
        };
        allHealthy = false;
      }
    }

    return {
      healthy: allHealthy,
      checks: results,
    };
  }

  /**
   * Get health status
   */
  async getStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, any>;
    timestamp: string;
  }> {
    const { healthy, checks } = await this.runChecks();
    
    const unhealthyCount = Object.values(checks).filter(c => c.status === 'unhealthy').length;
    const status = unhealthyCount === 0 ? 'healthy' : unhealthyCount === Object.keys(checks).length ? 'unhealthy' : 'degraded';

    return {
      status,
      checks,
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instances
export const logger = Logger.getInstance();
export const metrics = MetricsCollector.getInstance();
export const tracer = Tracer.getInstance();
export const performanceObserver = PerformanceMetricsObserver.getInstance();
export const errorTracker = ErrorTracker.getInstance();
export const healthCheck = HealthCheck.getInstance();
