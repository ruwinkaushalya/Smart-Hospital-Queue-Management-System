import { useState, useEffect, useCallback } from 'react';
import StatCard from '../components/StatCard';
import SeverityBadge from '../components/SeverityBadge';
import { getPatients, getQueueStatus } from '../services/api';
import useRealtimeData from '../hooks/useRealtimeData';
import {
  Users, UserPlus, AlertTriangle, CheckCircle, Clock, QrCode,
  Loader2, ArrowRight, FileText, CreditCard, Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ReceptionistDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [queueStats, setQueueStats] = useState({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [p, q] = await Promise.all([getPatients(), getQueueStatus()]);
        if (!mounted) return;
        setPatients(p);
        setQueueStats(q);
      } catch (err) {
        console.error('ReceptionistDashboard load error:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const load = useCallback(async () => {
    try {
      const [p, q] = await Promise.all([getPatients(), getQueueStatus()]);
      setPatients(p);
      setQueueStats(q);
    } catch (err) {
      console.error('ReceptionistDashboard load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useRealtimeData(load, []);

  const waitingPatients = patients.filter(p => p.status === 'waiting');
  const completedPatients = patients.filter(p => p.status === 'completed');
  const todayPatients = patients.filter(p => {
    const today = new Date().toISOString().split('T')[0];
    return p.registrationTime?.startsWith(today);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading reception dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-600" />
          Reception Dashboard
        </h1>
        <p className="text-sm text-slate-500 mt-1">Patient intake, queue overview, registration, and kiosk check-in status</p>
      </div>

      {/* Quick actions bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
        <span className="text-sm font-medium text-slate-600">Quick Actions:</span>
        <Link to="/register" className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-600 to-teal-500 text-white hover:from-teal-700 hover:to-teal-600 text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-teal-200">
          <UserPlus className="w-4 h-4" />
          Register New Patient
        </Link>
        <Link to="/kiosk" className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 text-white hover:from-cyan-700 hover:to-cyan-600 text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-cyan-200">
          <QrCode className="w-4 h-4" />
          Self Check-in Kiosk
        </Link>
        <Link to="/billing" className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 text-white hover:from-amber-700 hover:to-amber-600 text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-amber-200">
          <CreditCard className="w-4 h-4" />
          Billing Desk
        </Link>
        <Link to="/history" className="px-4 py-2 rounded-lg bg-gradient-to-r from-sky-600 to-sky-500 text-white hover:from-sky-700 hover:to-sky-600 text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-sky-200">
          <FileText className="w-4 h-4" />
          Patient Records
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total in Queue" value={waitingPatients.length} subtitle="Across all queues" icon={Users} color="blue" />
        <StatCard title="Emergency" value={queueStats.emergencyCount} subtitle="High priority" icon={AlertTriangle} color="red" trend={12} />
        <StatCard title="Normal Queue" value={queueStats.normalCount} subtitle="Standard patients" icon={Clock} color="amber" />
        <StatCard title="Treated Today" value={completedPatients.length} subtitle="Discharged patients" icon={CheckCircle} color="green" />
        <StatCard title="New Today" value={todayPatients.length} subtitle="Registered today" icon={UserPlus} color="teal" />
        <StatCard title="Avg Wait Time" value={`${queueStats.avgWaitTime} min`} subtitle="Current average" icon={Clock} color="purple" />
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registrations */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-teal-500" />
              Recent Registrations
              <span className="text-xs font-normal text-slate-400">— Latest patients checked in</span>
            </h3>
            <Link to="/register" className="text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1">
              Register <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {patients.slice(0, 8).map((p) => (
              <div key={p.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                    p.severity === 'CRITICAL' ? 'bg-red-500' :
                    p.severity === 'HIGH' ? 'bg-orange-500' :
                    p.severity === 'MODERATE' ? 'bg-blue-500' : 'bg-emerald-500'
                  }`}>
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{p.name}</p>
                    <p className="text-xs text-slate-400">Age {p.age} · {p.contact}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{p.estimatedWait}m wait</span>
                  <SeverityBadge severity={p.severity} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Queue Overview */}
          <div className="card">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-500" />
              Queue Overview
              <span className="text-xs font-normal text-slate-400">— Current distribution</span>
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {['CRITICAL', 'HIGH', 'MODERATE', 'LOW'].map((severity) => {
                const count = waitingPatients.filter(p => p.severity === severity).length;
                const colors = {
                  CRITICAL: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', border: 'border-red-200' },
                  HIGH: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500', border: 'border-orange-200' },
                  MODERATE: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', border: 'border-blue-200' },
                  LOW: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' },
                }[severity];
                return (
                  <div key={severity} className={`p-3 rounded-lg ${colors.bg} border ${colors.border}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                      <span className={`text-xs font-bold ${colors.text}`}>{severity}</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{count}</p>
                    <p className="text-xs text-slate-400">patients waiting</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div className="card">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-slate-400" />
              Quick Navigation
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Normal Queue', path: '/normal', icon: Users, color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' },
                { label: 'Emergency Queue', path: '/emergency', icon: AlertTriangle, color: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' },
                { label: 'Patient History', path: '/history', icon: FileText, color: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100' },
                { label: 'Notifications', path: '/notifications', icon: Clock, color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' },
              ].map((item) => (
                <Link key={item.path} to={item.path}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm font-medium transition ${item.color}`}>
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
