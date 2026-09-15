/**
 * Performance Optimization Utilities
 * 
 * Utilities for optimizing application performance.
 */

import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';

/**
 * Debounce hook for expensive operations
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttle hook for rate-limited operations
 */
export function useThrottle<T>(value: T, interval: number): T {
  const [throttledValue, setThrottledValue] = React.useState(value);
  const lastExecuted = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();
    if (now - lastExecuted.current >= interval) {
      lastExecuted.current = now;
      setThrottledValue(value);
    }
  }, [value, interval]);

  return throttledValue;
}

/**
 * Memoization helper for expensive calculations
 */
export function useMemoWithDeps<T>(factory: () => T, deps: any[], key: string): T {
  return useMemo(() => {
    if (import.meta.env.DEV) {
      console.time(`memo-${key}`);
    }
    const result = factory();
    if (import.meta.env.DEV) {
      console.timeEnd(`memo-${key}`);
    }
    return result;
  }, deps);
}

/**
 * Virtual scrolling helper for large lists
 */
export function useVirtualScroll(itemCount: number, itemHeight: number, containerHeight: number) {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight),
    itemCount
  );
  
  const visibleItems = React.useMemo(
    () => Array.from({ length: endIndex - startIndex }, (_, i) => startIndex + i),
    [startIndex, endIndex]
  );

  return {
    startIndex,
    endIndex,
    visibleItems,
    totalHeight: itemCount * itemHeight,
    offsetY: startIndex * itemHeight,
    onScroll: (e: React.UIEvent<HTMLElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    },
  };
}

/**
 * Lazy loading hook for components
 */
export function useLazyLoad<T>(
  loader: () => Promise<T>,
  deps: any[] = []
): { data: T | null; loading: boolean; error: Error | null } {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    loader()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, deps);

  return { data, loading, error };
}

/**
 * Intersection Observer hook for lazy loading
 */
export function useIntersectionObserver(
  callback: (entry: IntersectionObserverEntry) => void,
  options: IntersectionObserverInit = {}
) {
  const observer = useRef<IntersectionObserver | null>(null);

  const observe = useCallback(
    (element: HTMLElement | null) => {
      if (observer.current) {
        observer.current.disconnect();
      }

      if (element) {
        observer.current = new IntersectionObserver(([entry]) => {
          if (entry.isIntersecting) {
            callback(entry);
          }
        }, options);

        observer.current.observe(element);
      }
    },
    [callback, options]
  );

  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  return observe;
}

/**
 * Performance monitoring hook
 */
export function usePerformanceMonitor(label: string) {
  const startTime = useRef<number>(0);

  const start = useCallback(() => {
    startTime.current = performance.now();
  }, []);

  const end = useCallback(() => {
    const duration = performance.now() - startTime.current;
    if (import.meta.env.DEV) {
      console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
    }
    return duration;
  }, [label]);

  return { start, end };
}

/**
 * Cache hook for API responses
 */
export function useCache<T>(key: string, ttl: number = 5 * 60 * 1000) {
  const cache = useRef<Map<string, { data: T; timestamp: number }>>(new Map());

  const get = useCallback((): T | null => {
    const cached = cache.current.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > ttl) {
      cache.current.delete(key);
      return null;
    }

    return cached.data;
  }, [key, ttl]);

  const set = useCallback((data: T) => {
    cache.current.set(key, {
      data,
      timestamp: Date.now(),
    });
  }, [key]);

  const clear = useCallback(() => {
    cache.current.delete(key);
  }, [key]);

  return { get, set, clear };
}

/**
 * Web Worker hook for background processing
 */
export function useWorker<T>(workerScript: string) {
  const worker = useRef<Worker | null>(null);

  const init = useCallback(() => {
    if (!worker.current) {
      worker.current = new Worker(workerScript);
    }
  }, [workerScript]);

  const postMessage = useCallback((message: any) => {
    if (worker.current) {
      worker.current.postMessage(message);
    }
  }, []);

  const onMessage = useCallback((callback: (data: T) => void) => {
    if (worker.current) {
      worker.current.onmessage = (e) => callback(e.data);
    }
  }, []);

  const terminate = useCallback(() => {
    if (worker.current) {
      worker.current.terminate();
      worker.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      terminate();
    };
  }, [terminate]);

  return { init, postMessage, onMessage, terminate };
}

/**
 * Request idle callback hook
 */
export function useIdleCallback(callback: () => void, options?: { timeout: number }) {
  useEffect(() => {
    const id = requestIdleCallback(callback, options);
    return () => cancelIdleCallback(id);
  }, [callback, options]);
}

/**
 * Image optimization hook
 */
export function useImageOptimization(src: string, width: number, height: number) {
  const optimizedSrc = useMemo(() => {
    if (!src) return '';
    
    // Add query parameters for image optimization
    const url = new URL(src, window.location.origin);
    url.searchParams.set('w', width.toString());
    url.searchParams.set('h', height.toString());
    url.searchParams.set('q', '80'); // Quality
    url.searchParams.set('format', 'webp'); // Modern format
    
    return url.toString();
  }, [src, width, height]);

  return optimizedSrc;
}

/**
 * Bundle size analyzer
 */
export function analyzeBundleSize() {
  if (import.meta.env.DEV) {
    const performance = window.performance;
    const resources = performance.getEntriesByType('resource');
    
    const totalSize = resources.reduce((acc, resource) => {
      return acc + (resource as any).transferSize || 0;
    }, 0);

    console.log('[Bundle Analysis] Total transfer size:', (totalSize / 1024).toFixed(2), 'KB');
    
    const jsResources = resources.filter(r => r.name.endsWith('.js'));
    const jsSize = jsResources.reduce((acc, r) => acc + (r as any).transferSize || 0, 0);
    console.log('[Bundle Analysis] JavaScript size:', (jsSize / 1024).toFixed(2), 'KB');
    
    const cssResources = resources.filter(r => r.name.endsWith('.css'));
    const cssSize = cssResources.reduce((acc, r) => acc + (r as any).transferSize || 0, 0);
    console.log('[Bundle Analysis] CSS size:', (cssSize / 1024).toFixed(2), 'KB');
  }
}

/**
 * Memory usage monitor
 */
export function useMemoryMonitor() {
  useEffect(() => {
    if (import.meta.env.DEV && 'memory' in performance) {
      const interval = setInterval(() => {
        const memory = (performance as any).memory;
        console.log('[Memory] Used:', (memory.usedJSHeapSize / 1048576).toFixed(2), 'MB');
        console.log('[Memory] Total:', (memory.totalJSHeapSize / 1048576).toFixed(2), 'MB');
        console.log('[Memory] Limit:', (memory.jsHeapSizeLimit / 1048576).toFixed(2), 'MB');
      }, 10000);

      return () => clearInterval(interval);
    }
  }, []);
}
