/**
 * Unit Tests for Observability Utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  Logger,
  LogLevel,
  MetricsCollector,
  Tracer,
  Span,
  ErrorTracker,
  HealthCheck,
} from '../src/core/utils/observability';

describe('Observability Utilities', () => {
  beforeEach(() => {
    // Reset singletons
    Logger.getInstance().clearLogs();
    MetricsCollector.getInstance().reset();
  });

  describe('Logger', () => {
    it('should log messages at different levels', () => {
      const logger = Logger.getInstance();

      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');
      logger.fatal('Fatal message');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(5);
      expect(logs[0].level).toBe(LogLevel.DEBUG);
      expect(logs[1].level).toBe(LogLevel.INFO);
      expect(logs[2].level).toBe(LogLevel.WARN);
      expect(logs[3].level).toBe(LogLevel.ERROR);
      expect(logs[4].level).toBe(LogLevel.FATAL);
    });

    it('should filter logs by minimum level', () => {
      const logger = Logger.getInstance();
      logger.setMinLevel(LogLevel.WARN);

      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(2);
      expect(logs[0].level).toBe(LogLevel.WARN);
      expect(logs[1].level).toBe(LogLevel.ERROR);
    });

    it('should include context in logs', () => {
      const logger = Logger.getInstance();
      logger.info('User logged in', { userId: 'user1', orgId: 'org1' });

      const logs = logger.getLogs();
      expect(logs[0].context).toEqual({ userId: 'user1', orgId: 'org1' });
    });

    it('should include trace context', () => {
      const logger = Logger.getInstance();
      logger.setTraceContext('trace-123', 'span-456');

      logger.info('Request processed');

      const logs = logger.getLogs();
      expect(logs[0].traceId).toBe('trace-123');
      expect(logs[0].spanId).toBe('span-456');

      logger.clearTraceContext();
      logger.info('Another request');

      const allLogs = logger.getLogs();
      expect(allLogs[1].traceId).toBeUndefined();
    });

    it('should keep only last 10000 logs', () => {
      const logger = Logger.getInstance();

      for (let i = 0; i < 11000; i++) {
        logger.info(`Log ${i}`);
      }

      const logs = logger.getLogs();
      expect(logs.length).toBeLessThanOrEqual(10000);
    });

    it('should get log statistics', () => {
      const logger = Logger.getInstance();

      logger.info('Info 1');
      logger.info('Info 2');
      logger.error('Error 1');
      logger.warn('Warning 1');

      const stats = logger.getStats();
      expect(stats.total).toBe(4);
      expect(stats.byLevel.INFO).toBe(2);
      expect(stats.byLevel.ERROR).toBe(1);
      expect(stats.byLevel.WARN).toBe(1);
      expect(stats.oldest).toBeTruthy();
      expect(stats.newest).toBeTruthy();
    });

    it('should export logs as JSON', () => {
      const logger = Logger.getInstance();
      logger.info('Test message');

      const exported = logger.exportLogs();
      const parsed = JSON.parse(exported);

      expect(parsed).toHaveLength(1);
      expect(parsed[0].message).toBe('Test message');
    });
  });

  describe('MetricsCollector', () => {
    it('should set gauge metrics', () => {
      const metrics = MetricsCollector.getInstance();
      metrics.gauge('cpu_usage', 75.5, { host: 'server1' });

      expect(metrics.getMetric('cpu_usage')).toBe(75.5);
    });

    it('should increment counters', () => {
      const metrics = MetricsCollector.getInstance();
      
      metrics.increment('api_requests');
      metrics.increment('api_requests');
      metrics.increment('api_requests', 5);

      expect(metrics.getCounter('api_requests')).toBe(7);
    });

    it('should record histogram values', () => {
      const metrics = MetricsCollector.getInstance();

      for (let i = 0; i < 100; i++) {
        metrics.histogram('request_duration', i * 10);
      }

      const stats = metrics.getHistogramStats('request_duration');
      expect(stats).toBeTruthy();
      expect(stats!.count).toBe(100);
      expect(stats!.min).toBe(0);
      expect(stats!.max).toBe(990);
      expect(stats!.avg).toBe(495);
    });

    it('should calculate percentiles', () => {
      const metrics = MetricsCollector.getInstance();

      for (let i = 1; i <= 100; i++) {
        metrics.histogram('latency', i);
      }

      const stats = metrics.getHistogramStats('latency');
      expect(stats!.p50).toBe(50);
      expect(stats!.p95).toBe(95);
      expect(stats!.p99).toBe(99);
    });

    it('should keep only last 1000 histogram values', () => {
      const metrics = MetricsCollector.getInstance();

      for (let i = 0; i < 1100; i++) {
        metrics.histogram('metric', i);
      }

      const stats = metrics.getHistogramStats('metric');
      expect(stats!.count).toBe(1000);
    });

    it('should get all metrics', () => {
      const metrics = MetricsCollector.getInstance();

      metrics.gauge('gauge1', 100);
      metrics.increment('counter1');
      metrics.histogram('histogram1', 50);

      const all = metrics.getAllMetrics();
      expect(all.gauges.gauge1.value).toBe(100);
      expect(all.counters.counter1).toBe(1);
      expect(all.histograms.histogram1).toBeTruthy();
    });

    it('should reset all metrics', () => {
      const metrics = MetricsCollector.getInstance();

      metrics.gauge('gauge1', 100);
      metrics.increment('counter1');
      metrics.histogram('histogram1', 50);

      metrics.reset();

      expect(metrics.getMetric('gauge1')).toBeUndefined();
      expect(metrics.getCounter('counter1')).toBe(0);
      expect(metrics.getHistogramStats('histogram1')).toBeNull();
    });

    it('should export metrics as JSON', () => {
      const metrics = MetricsCollector.getInstance();
      metrics.gauge('test', 123);

      const exported = metrics.exportMetrics();
      const parsed = JSON.parse(exported);

      expect(parsed.gauges.test.value).toBe(123);
    });
  });

  describe('Tracer', () => {
    it('should start new trace', () => {
      const tracer = Tracer.getInstance();
      const span = tracer.startTrace('test-operation');

      expect(span.traceId).toBeTruthy();
      expect(span.spanId).toBeTruthy();
      expect(span.name).toBe('test-operation');
    });

    it('should continue trace from parent', () => {
      const tracer = Tracer.getInstance();
      const parentSpan = tracer.startTrace('parent');
      const childSpan = tracer.continueTrace(
        parentSpan.traceId,
        parentSpan.spanId,
        'child'
      );

      expect(childSpan.traceId).toBe(parentSpan.traceId);
      expect(childSpan.parentSpanId).toBe(parentSpan.spanId);
    });

    it('should get span by ID', () => {
      const tracer = Tracer.getInstance();
      const span = tracer.startTrace('test');

      const retrieved = tracer.getSpan(span.spanId);
      expect(retrieved).toBe(span);
    });

    it('should get all spans for trace', () => {
      const tracer = Tracer.getInstance();
      const traceId = 'trace-123';
      
      const span1 = tracer.continueTrace(traceId, 'parent', 'span1');
      const span2 = tracer.continueTrace(traceId, 'parent', 'span2');

      const spans = tracer.getTraceSpans(traceId);
      expect(spans).toHaveLength(2);
    });

    it('should export traces as JSON', () => {
      const tracer = Tracer.getInstance();
      const span = tracer.startTrace('test');
      span.finish();

      const exported = tracer.exportTraces();
      const parsed = JSON.parse(exported);

      expect(parsed).toHaveLength(1);
      expect(parsed[0].name).toBe('test');
    });

    it('should cleanup old spans', () => {
      vi.useFakeTimers();
      const tracer = Tracer.getInstance();

      const oldSpan = tracer.startTrace('old');
      vi.advanceTimersByTime(7200000); // 2 hours
      const newSpan = tracer.startTrace('new');

      tracer.cleanup(3600000); // 1 hour

      expect(tracer.getSpan(oldSpan.spanId)).toBeUndefined();
      expect(tracer.getSpan(newSpan.spanId)).toBeTruthy();

      vi.useRealTimers();
    });
  });

  describe('Span', () => {
    it('should set tags', () => {
      const span = new Span('trace-1', 'span-1', 'test');
      span.setTag('http.method', 'GET');
      span.setTag('http.status_code', '200');

      expect(span.tags['http.method']).toBe('GET');
      expect(span.tags['http.status_code']).toBe('200');
    });

    it('should log messages', () => {
      const span = new Span('trace-1', 'span-1', 'test');
      span.log('Processing request', { userId: 123 });

      expect(span.logs).toHaveLength(1);
      expect(span.logs[0].message).toBe('Processing request');
      expect(span.logs[0].fields).toEqual({ userId: 123 });
    });

    it('should set error status', () => {
      const span = new Span('trace-1', 'span-1', 'test');
      const error = new Error('Test error');
      span.setError(error);

      expect(span.status).toBe('error');
      expect(span.tags.error).toBe('true');
      expect(span.tags['error.message']).toBe('Test error');
    });

    it('should calculate duration', () => {
      vi.useFakeTimers();
      const span = new Span('trace-1', 'span-1', 'test');

      vi.advanceTimersByTime(1000);
      span.finish();

      expect(span.getDuration()).toBe(1000);

      vi.useRealTimers();
    });

    it('should convert to JSON', () => {
      const span = new Span('trace-1', 'span-1', 'test', { key: 'value' });
      span.setTag('tag1', 'value1');
      span.log('Test log');
      span.finish();

      const json = span.toJSON();
      expect(json.traceId).toBe('trace-1');
      expect(json.spanId).toBe('span-1');
      expect(json.name).toBe('test');
      expect(json.tags).toEqual({ key: 'value', tag1: 'value1' });
      expect(json.logs).toHaveLength(1);
      expect(json.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('ErrorTracker', () => {
    it('should track errors', () => {
      const tracker = ErrorTracker.getInstance();
      const error = new Error('Test error');
      
      tracker.trackError(error, { component: 'TestComponent' });

      const errors = tracker.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].error).toBe('Test error');
      expect(errors[0].context).toEqual({ component: 'TestComponent' });
    });

    it('should keep only last 1000 errors', () => {
      const tracker = ErrorTracker.getInstance();

      for (let i = 0; i < 1100; i++) {
        tracker.trackError(new Error(`Error ${i}`));
      }

      const errors = tracker.getErrors();
      expect(errors.length).toBeLessThanOrEqual(1000);
    });

    it('should get error statistics', () => {
      const tracker = ErrorTracker.getInstance();

      tracker.trackError(new TypeError('Type error'));
      tracker.trackError(new Error('Regular error'));
      tracker.trackError(new TypeError('Another type error'));

      const stats = tracker.getStats();
      expect(stats.total).toBe(3);
      expect(stats.byType.TypeError).toBe(2);
      expect(stats.byType.Error).toBe(1);
    });

    it('should clear errors', () => {
      const tracker = ErrorTracker.getInstance();
      tracker.trackError(new Error('Test'));

      tracker.clearErrors();

      expect(tracker.getErrors()).toHaveLength(0);
    });

    it('should export errors as JSON', () => {
      const tracker = ErrorTracker.getInstance();
      tracker.trackError(new Error('Test error'));

      const exported = tracker.exportErrors();
      const parsed = JSON.parse(exported);

      expect(parsed).toHaveLength(1);
      expect(parsed[0].error).toBe('Test error');
    });
  });

  describe('HealthCheck', () => {
    it('should register health checks', () => {
      const health = HealthCheck.getInstance();
      
      health.registerCheck('test', async () => true);

      const status = await health.getStatus();
      expect(status.checks.test).toBeTruthy();
    });

    it('should run all health checks', () => {
      const health = HealthCheck.getInstance();

      health.registerCheck('check1', async () => true);
      health.registerCheck('check2', async () => false);

      return health.runChecks().then(result => {
        expect(result.checks.check1.status).toBe('healthy');
        expect(result.checks.check2.status).toBe('unhealthy');
        expect(result.healthy).toBe(false);
      });
    });

    it('should determine overall health status', async () => {
      const health = HealthCheck.getInstance();

      health.registerCheck('check1', async () => true);
      health.registerCheck('check2', async () => true);

      const status = await health.getStatus();
      expect(status.status).toBe('healthy');
    });

    it('should handle failed checks', async () => {
      const health = HealthCheck.getInstance();

      health.registerCheck('failing', async () => {
        throw new Error('Check failed');
      });

      const status = await health.getStatus();
      expect(status.checks.failing.status).toBe('unhealthy');
    });
  });
});
