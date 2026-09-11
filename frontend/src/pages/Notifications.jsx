import { useState, useEffect } from 'react';
import usePatientNotifications from '../hooks/usePatientNotifications';
import { getNotifications } from '../services/api';
import useRealtimeData from '../hooks/useRealtimeData';
import {
  Bell, AlertTriangle, CheckCircle, Clock, X,
  UserPlus, Truck, Activity, HeartPulse, Trash2, Loader2,
  MessageSquare, Smartphone
} from 'lucide-react';

const typeIconMap = {
  SMS: Smartphone,
  WHATSAPP: MessageSquare,
  EMAIL: Bell,
  IN_APP: Bell,
};

const typeColorMap = {
  SMS: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  WHATSAPP: 'bg-green-50 text-green-600 border-green-200',
  EMAIL: 'bg-blue-50 text-blue-600 border-blue-200',
  IN_APP: 'bg-slate-50 text-slate-600 border-slate-200',
};

const recipientTypeMap = {
  PATIENT: 'Patient',
  DOCTOR: 'Doctor',
  STAFF: 'Staff',
  ADMIN: 'Admin',
};

export default function Notifications() {
  const { notifications: liveNotifications, dismissNotification } = usePatientNotifications();
  const [filter, setFilter] = useState('ALL');
  const [backendNotifications, setBackendNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    try {
      const data = await getNotifications();
      setBackendNotifications(data.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useRealtimeData(load, []);

  const allItems = [
    ...liveNotifications.map(n => ({
      id: n.id,
      type: 'LIVE',
      message: `Critical patient ${n.patient.name} registered — ${n.patient.symptoms}`,
      time: 'Just now',
      read: false,
      icon: HeartPulse,
      color: 'red',
      live: true,
    })),
    ...backendNotifications.map(n => {
      const Icon = typeIconMap[n.type] || Bell;
      const color = typeColorMap[n.type] || typeColorMap.IN_APP;
      return {
        id: n.id,
        type: n.type,
        message: `[${recipientTypeMap[n.recipientType] || n.recipientType}] ${n.message}`,
        time: n.timestamp ? new Date(n.timestamp).toLocaleTimeString() : 'Just now',
        read: n.status === 'DELIVERED',
        icon: Icon,
        color: color,
        live: false,
      };
    }),
  ];

  const filtered = filter === 'ALL'
    ? allItems
    : filter === 'UNREAD'
      ? allItems.filter(i => !i.read)
      : allItems.filter(i => i.type === filter);

  const unreadCount = allItems.filter(i => !i.read).length;

  const markAllRead = () => {
    setBackendNotifications(prev => prev.map(n => ({ ...n, status: 'DELIVERED' })));
  };

  const clearHistory = () => {
    setBackendNotifications([]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading notifications...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Bell className="w-6 h-6 text-cyan-600" />
            Notifications Center
          </h1>
          <p className="text-sm text-slate-500 mt-1">Alert history, real-time notifications, and system events</p>
        </div>
        {unreadCount > 0 && (
          <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold border border-red-200">
            {unreadCount} unread
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setFilter('ALL')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer border ${filter === 'ALL' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
          All
        </button>
        <button onClick={() => setFilter('UNREAD')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer border ${filter === 'UNREAD' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
          Unread
        </button>
        <button onClick={() => setFilter('CRITICAL')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer border ${filter === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
          Critical
        </button>
        <button onClick={() => setFilter('DISPATCH')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer border ${filter === 'DISPATCH' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
          Dispatch
        </button>
        <button onClick={() => setFilter('QUEUE')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer border ${filter === 'QUEUE' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
          Queue
        </button>
        <button onClick={() => setFilter('BED')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer border ${filter === 'BED' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
          Beds
        </button>
        <div className="ml-auto flex gap-2">
          <button onClick={markAllRead} className="px-3 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer border border-slate-200 bg-white text-slate-600 hover:bg-slate-50">
            Mark All Read
          </button>
          <button onClick={clearHistory} className="px-3 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 flex items-center gap-1">
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
        </div>
      </div>

      {/* Notification list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="card text-center py-12 text-slate-400">
            <Bell className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-sm">No notifications matching your filter.</p>
          </div>
        ) : (
          filtered.map((item) => {
            const Icon = item.icon;
            const colorMap = {
              red: 'bg-red-50 text-red-600 border-red-200',
              cyan: 'bg-cyan-50 text-cyan-600 border-cyan-200',
              amber: 'bg-amber-50 text-amber-600 border-amber-200',
              emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
              blue: 'bg-blue-50 text-blue-600 border-blue-200',
              slate: 'bg-slate-50 text-slate-600 border-slate-200',
            };
            return (
              <div
                key={item.id}
                className={`card p-3 flex items-start gap-3 transition-all ${!item.read ? 'bg-cyan-50/50 border-cyan-200' : ''}`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${colorMap[item.color] || colorMap.slate}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm ${!item.read ? 'font-semibold text-slate-800' : 'text-slate-700'}`}>
                      {item.message}
                    </p>
                    {item.live && (
                      <span className="shrink-0 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold border border-red-200 animate-pulse-soft">
                        LIVE
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {item.time}
                    </span>
                    <span className={`text-xs font-medium ${
                      item.type === 'CRITICAL' ? 'text-red-600' :
                      item.type === 'LIVE' ? 'text-red-600' :
                      item.type === 'DISPATCH' ? 'text-cyan-600' :
                      item.type === 'QUEUE' ? 'text-amber-600' :
                      item.type === 'BED' ? 'text-blue-600' :
                      'text-slate-500'
                    }`}>
                      {item.type}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => item.live ? dismissNotification(item.id) : setBackendNotifications(prev => prev.filter(h => h.id !== item.id))}
                  className="shrink-0 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Dismiss"
                >
                  <X className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
