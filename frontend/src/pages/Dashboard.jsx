import { useState, useEffect, useCallback, useRef } from 'react';
import StatCard from '../components/StatCard';
import SeverityBadge from '../components/SeverityBadge';
import { getPatients, getQueueStatus, getAmbulances, processNextPatient, simulateEmergency, clearQueue } from '../services/api';
import useRealtimeData from '../hooks/useRealtimeData';
import {
  AlertTriangle, Users, CheckCircle, Clock, Shield, Activity,
  HeartPulse, TrendingUp, Zap, Loader2, ArrowRight, RefreshCw, Trash2
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [queueStats, setQueueStats] = useState({});
  const [ambulances, setAmbulances] = useState([]);
  const [actionLoading, setActionLoading] = useState({});
  const [actionFeedback, setActionFeedback] = useState(null);
  const feedbackTimeoutRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [p, q, a] = await Promise.all([getPatients(), getQueueStatus(), getAmbulances()]);
        if (!mounted) return;
        setPatients(p);
        setQueueStats(q);
        setAmbulances(a);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const load = useCallback(async () => {
    try {
      const [p, q, a] = await Promise.all([getPatients(), getQueueStatus(), getAmbulances()]);
      setPatients(p);
      setQueueStats(q);
      setAmbulances(a);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useRealtimeData(load, []);

  const showFeedback = (feedback) => {
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    setActionFeedback(feedback);
    feedbackTimeoutRef.current = setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleProcessNext = async () => {
    setActionLoading((prev) => ({ ...prev, process: true }));
    try {
      const result = await processNextPatient();
      if (result.success && result.patient) {
        showFeedback({ type: 'success', message: `Processed: ${result.patient.name} (${result.patient.severity})` });
      } else {
        showFeedback({ type: 'info', message: result.message || 'No patients in queue' });
      }
      await load();
    } catch {
      showFeedback({ type: 'error', message: 'Failed to process patient' });
    } finally {
      setActionLoading((prev) => ({ ...prev, process: false }));
    }
  };

  const handleSimulateEmergency = async () => {
    setActionLoading((prev) => ({ ...prev, simulate: true }));
    try {
      const result = await simulateEmergency();
      showFeedback({ type: 'success', message: `Emergency added: ${result.name || result.patient?.name || 'Simulated'}` });
      await load();
    } catch {
      showFeedback({ type: 'error', message: 'Failed to simulate emergency' });
    } finally {
      setActionLoading((prev) => ({ ...prev, simulate: false }));
    }
  };

  const handleRefresh = async () => {
    setActionLoading((prev) => ({ ...prev, refresh: true }));
    try {
      await load();
      showFeedback({ type: 'success', message: 'Queue refreshed' });
    } catch {
      showFeedback({ type: 'error', message: 'Failed to refresh queue' });
    } finally {
      setActionLoading((prev) => ({ ...prev, refresh: false }));
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Are you sure you want to clear all patient data? This cannot be undone.')) return;
    setActionLoading((prev) => ({ ...prev, clear: true }));
    try {
      await clearQueue();
      showFeedback({ type: 'success', message: 'All queues cleared' });
      await load();
    } catch {
      showFeedback({ type: 'error', message: 'Failed to clear queues' });
    } finally {
      setActionLoading((prev) => ({ ...prev, clear: false }));
    }
  };

  const waitingPatients = patients.filter((p) => p.status === 'waiting');
  const availableAmbulances = ambulances.filter((a) => a.status === 'AVAILABLE');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">System Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time overview of hospital queue and dispatch operations</p>
        </div>
        <Link to="/register" className="btn-primary flex items-center gap-2 text-sm">
          <Users className="w-4 h-4" /> New Patient
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Emergency Patients" value={queueStats.emergencyCount} subtitle="High priority cases" icon={AlertTriangle} color="red" trend={12} />
        <StatCard title="Normal Patients" value={queueStats.normalCount} subtitle="Standard queue" icon={Users} color="blue" trend={-5} />
        <StatCard title="Patients Treated" value={queueStats.treatedCount} subtitle="Completed today" icon={CheckCircle} color="green" trend={8} />
        <StatCard title="Avg Wait Time" value={`${queueStats.avgWaitTime} min`} subtitle="Queue performance" icon={Clock} color="amber" />
        <StatCard title="Queue Status" value={queueStats.status || 'Loading...'} subtitle="System load indicator" icon={Shield} color="purple" />
        <StatCard title="Available Ambulances" value={availableAmbulances.length} subtitle="Ready for dispatch" icon={HeartPulse} color="pink" />
        <StatCard title="Pending Beds" value={queueStats.pendingBeds || 0} subtitle="Waiting for bed" icon={Activity} color="orange" />
        <StatCard title="Available Doctors" value={queueStats.availableDoctors || 0} subtitle={`${queueStats.totalDoctors || 0} total on staff`} icon={Users} color="teal" />
        <StatCard title="Active Hospitals" value={5} subtitle="In network" icon={Activity} color="teal" />
        <StatCard title="Throughput" value={`${queueStats.throughput}/hr`} subtitle="Patient processing rate" icon={TrendingUp} color="slate" trend={3} />
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Top Priority Patients
            </h3>
            <Link to="/emergency" className="text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                  <th className="pb-2 font-medium">ID</th>
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Severity</th>
                  <th className="pb-2 font-medium">Wait</th>
                  <th className="pb-2 font-medium">AI Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {waitingPatients.slice(0, 8).map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 font-mono text-xs text-slate-400">{p.id}</td>
                    <td className="py-2.5 font-medium text-slate-700">{p.name}</td>
                    <td className="py-2.5">
                      <SeverityBadge severity={p.severity} />
                    </td>
                    <td className="py-2.5 text-slate-500">{p.estimatedWait} min</td>
                    <td className="py-2.5">
                      <span className={`text-xs font-bold ${p.aiScore > 0.8 ? 'text-red-600' : p.aiScore > 0.5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {(p.aiScore * 100).toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
                {waitingPatients.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">
                      No waiting patients at this time.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions + Recently Treated */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="font-bold text-slate-800 mb-4">Quick Actions</h3>
            {actionFeedback && (
              <div className={`mb-3 p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
                actionFeedback.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                actionFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                'bg-cyan-50 text-cyan-700 border border-cyan-200'
              }`}>
                {actionFeedback.type === 'error' ? <AlertTriangle className="w-3.5 h-3.5" /> :
                 actionFeedback.type === 'success' ? <CheckCircle className="w-3.5 h-3.5" /> :
                 <RefreshCw className="w-3.5 h-3.5" />}
                {actionFeedback.message}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleProcessNext} disabled={actionLoading.process} className="p-3 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition text-sm font-medium flex items-center justify-center gap-2 cursor-pointer min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed">
                {actionLoading.process ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Process Next
              </button>
              <button onClick={handleSimulateEmergency} disabled={actionLoading.simulate} className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition text-sm font-medium flex items-center justify-center gap-2 cursor-pointer min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed">
                {actionLoading.simulate ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                Simulate Emergency
              </button>
              <button onClick={handleRefresh} disabled={actionLoading.refresh} className="p-3 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100 transition text-sm font-medium flex items-center justify-center gap-2 cursor-pointer min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed">
                {actionLoading.refresh ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Refresh Queue
              </button>
              <button onClick={handleClear} disabled={actionLoading.clear} className="p-3 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 transition text-sm font-medium flex items-center justify-center gap-2 cursor-pointer min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed">
                {actionLoading.clear ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Clear Data
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="font-bold text-slate-800 mb-4">Recently Treated</h3>
            <div className="space-y-3">
              {patients.filter((p) => p.status === 'completed').slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.severity} · {typeof p.assignedHospital === 'object' ? p.assignedHospital?.name || '-' : p.assignedHospital || '-'}</p>
                  </div>
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                </div>
              ))}
              {patients.filter((p) => p.status === 'completed').length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">No patients treated yet today.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
