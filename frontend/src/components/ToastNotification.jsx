import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, X, HeartPulse, Clock } from 'lucide-react';

/**
 * Toast notification component for real-time critical patient alerts.
 * Stacks multiple notifications, auto-dismisses after 6s, and respects
 * prefers-reduced-motion.
 */
export default function ToastNotification({ notifications, onDismiss }) {
  const containerRef = useRef(null);

  return (
    <div
      ref={containerRef}
      className="fixed top-4 right-4 z-[100] flex flex-col gap-3 w-[380px] max-w-[calc(100vw-2rem)]"
      aria-live="polite"
      aria-atomic="true"
    >
      {notifications.map((n) => (
        <ToastItem key={n.id} notification={n} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ notification, onDismiss }) {
  const timerRef = useRef(null);
  const [exiting, setExiting] = useState(false);
  const { id, patient } = notification;

  const doDismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onDismiss(id), 300);
  }, [id, onDismiss]);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      doDismiss();
    }, 6000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [doDismiss]);

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleMouseLeave = () => {
    timerRef.current = setTimeout(() => doDismiss(), 6000);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-red-200 bg-white shadow-lg shadow-red-100 ${exiting ? 'toast-exit' : 'toast-enter'}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="alert"
    >
      {/* Accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l-xl" />

      <div className="pl-4 pr-3 py-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex-shrink-0 w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center border border-red-200">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-800 leading-tight">
                Critical Patient Registered
              </p>
              <button
                onClick={() => doDismiss()}
                className="flex-shrink-0 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Dismiss notification"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>

            <div className="mt-1.5 space-y-1">
              <div className="flex items-center gap-1.5 text-sm text-slate-700">
                <HeartPulse className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                <span className="font-medium truncate">{patient.name}</span>
                <span className="text-xs text-slate-400">· Age {patient.age}</span>
              </div>

              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                {patient.symptoms}
              </p>

              <div className="flex items-center gap-3 pt-1">
                <div className="flex items-center gap-1 text-xs text-red-700 font-medium bg-red-100 px-2 py-0.5 rounded-md border border-red-200">
                  <AlertTriangle className="w-3 h-3" />
                  CRITICAL
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="w-3 h-3" />
                  Est. wait {patient.estimatedWait}m
                </div>
              </div>
            </div>

            <Link
              to="/emergency"
              onClick={() => onDismiss(id)}
              className="inline-block mt-2 text-xs font-medium text-cyan-600 hover:text-cyan-700 transition-colors cursor-pointer"
            >
              View in Emergency Queue →
            </Link>
          </div>
        </div>
      </div>

      {/* Auto-dismiss progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100" aria-hidden="true">
        <div
          className="h-full bg-red-500 toast-progress"
          style={{ animationDuration: '6000ms' }}
        />
      </div>
    </div>
  );
}
