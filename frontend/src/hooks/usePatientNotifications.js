import { useState, useRef, useCallback, useEffect } from 'react';
import { subscribeToRealtime } from '../services/api';
import { getPatients } from '../services/api';

/**
 * Hook that listens to real-time SSE events and detects new CRITICAL patients.
 * Returns a list of toast notifications to display.
 *
 * Usage:
 *   const { notifications, dismissNotification } = usePatientNotifications();
 */
export default function usePatientNotifications() {
  const [notifications, setNotifications] = useState([]);
  const knownIdsRef = useRef(new Set());
  const isFirstLoadRef = useRef(true);

  const dismissNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const checkForNewCriticalPatients = useCallback(async () => {
    try {
      const patients = await getPatients();
      const waiting = patients.filter((p) => p.status === 'waiting');

      // On first load: seed known IDs without showing notifications
      if (isFirstLoadRef.current) {
        waiting.forEach((p) => knownIdsRef.current.add(p.id));
        isFirstLoadRef.current = false;
        return;
      }

      // Find new critical patients that haven't been seen before
      const newCritical = waiting.filter(
        (p) =>
          p.severity === 'CRITICAL' && !knownIdsRef.current.has(p.id)
      );

      if (newCritical.length === 0) return;

      // Add new IDs to known set
      newCritical.forEach((p) => knownIdsRef.current.add(p.id));

      // Push toast notifications
      setNotifications((prev) => {
        const toAdd = newCritical.map((p) => ({
          id: `${p.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          patient: p,
          timestamp: Date.now(),
        }));
        // Keep max 5 notifications to avoid UI overflow
        return [...prev, ...toAdd].slice(-5);
      });
    } catch (err) {
      console.error('[usePatientNotifications] check error:', err);
    }
  }, []);

  useEffect(() => {
    // Initial seed
    checkForNewCriticalPatients();

    // Subscribe to real-time refresh events
    const unsubscribe = subscribeToRealtime((event) => {
      if (event.type === 'refresh' || event.type === 'connected') {
        checkForNewCriticalPatients();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [checkForNewCriticalPatients]);

  return { notifications, dismissNotification };
}
