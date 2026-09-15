/**
 * Unit Tests for Performance Utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useDebounce,
  useThrottle,
  useVirtualScroll,
  useCache,
} from '../src/core/utils/performance';

describe('Performance Utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('useDebounce', () => {
    it('should debounce value changes', () => {
      const { result } = renderHook(() => useDebounce('initial', 300));

      expect(result.current).toBe('initial');

      act(() => {
        result.current = 'updated';
      });

      expect(result.current).toBe('initial');

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current).toBe('updated');
    });
  });

  describe('useThrottle', () => {
    it('should throttle value changes', () => {
      const { result } = renderHook(() => useThrottle('initial', 1000));

      expect(result.current).toBe('initial');

      act(() => {
        result.current = 'updated1';
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe('initial');

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe('updated1');
    });
  });

  describe('useVirtualScroll', () => {
    it('should calculate visible items correctly', () => {
      const { result } = renderHook(() =>
        useVirtualScroll(100, 50, 600)
      );

      expect(result.current.startIndex).toBe(0);
      expect(result.current.endIndex).toBe(12);
      expect(result.current.visibleItems.length).toBe(12);
      expect(result.current.totalHeight).toBe(5000);
    });

    it('should update on scroll', () => {
      const { result } = renderHook(() =>
        useVirtualScroll(100, 50, 600)
      );

      act(() => {
        result.current.onScroll({
          currentTarget: { scrollTop: 500 },
        } as any);
      });

      expect(result.current.startIndex).toBe(10);
      expect(result.current.endIndex).toBe(22);
    });
  });

  describe('useCache', () => {
    it('should cache and retrieve values', () => {
      const { result } = renderHook(() => useCache<string>('test-key', 5000));

      act(() => {
        result.current.set('cached-value');
      });

      expect(result.current.get()).toBe('cached-value');
    });

    it('should expire cached values', () => {
      const { result } = renderHook(() => useCache<string>('test-key', 1000));

      act(() => {
        result.current.set('cached-value');
      });

      expect(result.current.get()).toBe('cached-value');

      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(result.current.get()).toBeNull();
    });

    it('should clear cached values', () => {
      const { result } = renderHook(() => useCache<string>('test-key', 5000));

      act(() => {
        result.current.set('cached-value');
      });

      expect(result.current.get()).toBe('cached-value');

      act(() => {
        result.current.clear();
      });

      expect(result.current.get()).toBeNull();
    });
  });
});
