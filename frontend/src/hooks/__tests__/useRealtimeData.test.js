import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useRealtimeData from '../../hooks/useRealtimeData';
import * as api from '../../services/api';

describe('useRealtimeData', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(api, 'subscribeToRealtime').mockImplementation(() => {
      return () => {}; // return unsubscribe function
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('calls refreshFn on mount', () => {
    const refreshFn = vi.fn().mockResolvedValue(undefined);

    renderHook(() => useRealtimeData(refreshFn));

    expect(refreshFn).toHaveBeenCalledTimes(1);
  });

  it('subscribes to realtime events', () => {
    renderHook(() => useRealtimeData(vi.fn().mockResolvedValue(undefined)));

    expect(api.subscribeToRealtime).toHaveBeenCalledTimes(1);
    expect(api.subscribeToRealtime).toHaveBeenCalledWith(expect.any(Function));
  });

  it('calls refreshFn on refresh event', () => {
    const refreshFn = vi.fn().mockResolvedValue(undefined);

    let eventCallback;
    vi.spyOn(api, 'subscribeToRealtime').mockImplementation((cb) => {
      eventCallback = cb;
      return () => {};
    });

    renderHook(() => useRealtimeData(refreshFn));

    expect(refreshFn).toHaveBeenCalledTimes(1);

    // Simulate a refresh event
    act(() => {
      eventCallback({ type: 'refresh' });
    });

    // Should debounce, so not immediately called
    expect(refreshFn).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(refreshFn).toHaveBeenCalledTimes(2);
  });

  it('calls refreshFn on connected event', () => {
    const refreshFn = vi.fn().mockResolvedValue(undefined);

    let eventCallback;
    vi.spyOn(api, 'subscribeToRealtime').mockImplementation((cb) => {
      eventCallback = cb;
      return () => {};
    });

    renderHook(() => useRealtimeData(refreshFn));

    act(() => {
      eventCallback({ type: 'connected' });
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(refreshFn).toHaveBeenCalledTimes(2);
  });

  it('does not call refreshFn for unknown event types', () => {
    const refreshFn = vi.fn().mockResolvedValue(undefined);

    let eventCallback;
    vi.spyOn(api, 'subscribeToRealtime').mockImplementation((cb) => {
      eventCallback = cb;
      return () => {};
    });

    renderHook(() => useRealtimeData(refreshFn));

    act(() => {
      eventCallback({ type: 'unknown' });
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(refreshFn).toHaveBeenCalledTimes(1); // Only the initial call
  });

  it('unsubscribes on unmount', () => {
    const unsubscribe = vi.fn();
    vi.spyOn(api, 'subscribeToRealtime').mockImplementation(() => unsubscribe);

    const { unmount } = renderHook(() => useRealtimeData(vi.fn().mockResolvedValue(undefined)));

    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('uses custom debounce time', () => {
    const refreshFn = vi.fn().mockResolvedValue(undefined);

    let eventCallback;
    vi.spyOn(api, 'subscribeToRealtime').mockImplementation((cb) => {
      eventCallback = cb;
      return () => {};
    });

    renderHook(() => useRealtimeData(refreshFn, [], { debounceMs: 500 }));

    act(() => {
      eventCallback({ type: 'refresh' });
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(refreshFn).toHaveBeenCalledTimes(1); // Not yet called

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(refreshFn).toHaveBeenCalledTimes(2);
  });
});
