import { useEffect, useRef } from 'react';
import { subscribeToRealtime } from '../services/api';

/**
 * React hook for auto-refreshing data from the Java backend via SSE or polling.
 *
 * @param {() => Promise<void>} refreshFn - async function that fetches and sets state
 * @param {Array} deps - optional dependency array for re-subscription
 * @param {object} options - { debounceMs?: number }
 *
 * Usage:
 *   useRealtimeData(async () => {
 *     const data = await getPatients();
 *     setPatients(data);
 *   });
 */
export default function useRealtimeData(refreshFn, deps = [], options = {}) {
  const { debounceMs = 300 } = options;
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Immediate refresh on mount / deps change
    refreshFn().catch((err) => console.error('[useRealtimeData] initial refresh error:', err));

    const unsubscribe = subscribeToRealtime((event) => {
      if (event.type === 'refresh' || event.type === 'connected') {
        // Debounce rapid successive events
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          refreshFn().catch((err) => console.error('[useRealtimeData] refresh error:', err));
        }, debounceMs);
      }
    });

    return () => {
      unsubscribe();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
