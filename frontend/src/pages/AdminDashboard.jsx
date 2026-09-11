import { useState, useEffect, useCallback, useRef } from 'react';
import StatCard from '../components/StatCard';
import SeverityBadge from '../components/SeverityBadge';
import { getPatients, getQueueStatus, getAmbulances, processNextPatient, simulateEmergency, clearQueue, getWaitTimeTrend } from '../services/api';
import useRealtimeData from '../hooks/useRealtimeData';
import {
  AlertTriangle, Users, CheckCircle, Clock, Shield, Activity,
  HeartPulse, TrendingUp, Zap, Loader2, ArrowRight, RefreshCw, Trash2,
  BarChart3, Brain, AlertCircle, ChevronUp
} from 'lucide-react';
import { Link } from 'react-router-dom';

function SeverityBar({ patients }) {
  const severities = ['CRITICAL', 'HIGH', 'MODERATE', 'LOW'];
  const counts = severities.map(s => ({
    label: s,
    count: patients.filter(p => p.severity === s && p.status === 'waiting').length,
    color: s === 'CRITICAL' ? 'bg-red-500' : s === 'HIGH' ? 'bg-orange-500' : s === 'MODERATE' ? 'bg-blue-500' : 'bg-emerald-500',
    textColor: s === 'CRITICAL' ? 'text-red-700' : s === 'HIGH' ? 'text-orange-700' : s === 'MODERATE' ? 'text-blue-700' : 'text-emerald-700',
    bgColor: s === 'CRITICAL' ? 'bg-red-50' : s === 'HIGH' ? 'bg-orange-50' : s === 'MODERATE' ? 'bg-blue-50' : 'bg-emerald-50',
  }));
  const total = counts.reduce((acc, c) => acc + c.count, 0);

  return (
    <div className="space-y-3">
      <div className="flex h-4 rounded-full overflow-hidden bg-slate-100">
        {counts.map((c) =>
          c.count > 0 ? (
            <div
              key={c.label}
              className={`${c.color} transition-all duration-500`}
              style={{ width: `${total > 0 ? (c.count / total) * 100 : 0}%` }}
              title={`${c.label}: ${c.count} patients`}
            />
          ) : null
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {counts.map((c) => (
          <div key={c.label} className={`p-2.5 rounded-lg ${c.bgColor} border border-transparent`}>
            <p className={`text-lg font-bold ${c.textColor}`}>{c.count}</p>
            <p className="text-xs text-slate-500 font-medium">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function WaitTimeChart({ trendData }) {
  if (!trendData || trendData.length === 0) return null;
  const maxVal = Math.max(...trendData.map(d => Math.max(d.avgWait, d.predicted)));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
        <span className="font-medium">Last 7 days</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 rounded bg-cyan-500" /> Actual</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 rounded bg-amber-400 border-dashed" /> Predicted</span>
        </div>
      </div>
      <div className="flex items-end gap-1.5 h-28">
        {trendData.map((d, i) => (
          <div key={d.day} className="flex-1 flex flex-col items-center gap-0.5 h-full justify-end">
            <div className="w-full flex flex-col items-center gap-0.5">
              <div
                className="w-3/4 rounded-t bg-amber-400/70 transition-all"
                style={{ height: `${(d.predicted / maxVal) * 100}%`, minHeight: d.predicted > 0 ? '4px' : '0' }}
                title={`Predicted: ${d.predicted} min`}
              />
              <div
                className="w-3/4 rounded-t bg-cyan-500 transition-all"
                style={{ height: `${(d.avgWait / maxVal) * 100}%`, minHeight: d.avgWait > 0 ? '4px' : '0' }}
                title={`Actual: ${d.avgWait} min`}
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1">{d.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [queueStats, setQueueStats] = useState({});
  const [ambulances, setAmbulances] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [actionLoading, setActionLoading] = useState({});
  const [actionFeedback, setActionFeedback] = useState(null);
  const feedbackTimeoutRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [p, q, a, t] = await Promise.all([getPatients(), getQueueStatus(), getAmbulances(), getWaitTimeTrend()]);
        if (!mounted) return;
        setPatients(p);
        setQueueStats(q);
        setAmbulances(a);
        setTrendData(t);
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
      const [p, q, a, t] = await Promise.all([getPatients(), getQueueStatus(), getAmbulances(), getWaitTimeTrend()]);
      setPatients(p);
      setQueueStats(q);
      setAmbulances(a);
      setTrendData(t);
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
  const criticalCount = waitingPatients.filter(p => p.severity === 'CRITICAL').length;

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
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Shield className="w-6 h-6 text-cyan-600" />
            Admin Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">Full system overview — queue, dispatch, bed, and staff status at a glance</p>
        </div>
        <div className="flex items-center gap-2">
          {actionFeedback && (
            <div className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 ${
              actionFeedback.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
              actionFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
              'bg-cyan-50 text-cyan-700 border border-cyan-200'
            }`}>
              {actionFeedback.type === 'error' ? <AlertCircle className="w-3.5 h-3.5" /> :
               actionFeedback.type === 'success' ? <CheckCircle className="w-3.5 h-3.5" /> :
               <RefreshCw className="w-3.5 h-3.5" />}
              {actionFeedback.message}
            </div>
          )}
          <Link to="/register" className="btn-primary flex items-center gap-2 text-sm">
            <Users className="w-4 h-4" /> New Patient
          </Link>
        </div>
      </div>

      {/* Section: Manage Queue Operations — moved to top */}
      <div className="card">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          Manage Queue Operations
          <span className="text-xs font-normal text-slate-400">— Process, simulate, refresh, and clear queue</span>
        </h3>
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

      {/* Section: Patient Overview */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-blue-500" />
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Patient Overview</h2>
          <span className="text-xs text-slate-400">— Current waitlist and severity breakdown</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Emergency Patients" value={queueStats.emergencyCount} subtitle="High priority cases" icon={AlertTriangle} color="red" trend={12} />
          <StatCard title="Normal Patients" value={queueStats.normalCount} subtitle="Standard queue" icon={Users} color="blue" trend={-5} />
          <StatCard title="Patients Treated" value={queueStats.treatedCount} subtitle="Completed today" icon={CheckCircle} color="green" trend={8} />
          <StatCard title="Avg Wait Time" value={`${queueStats.avgWaitTime} min`} subtitle="Queue performance" icon={Clock} color="amber" />
        </div>
      </div>

      {/* Severity Distribution */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            Severity Distribution
            <span className="text-xs font-normal text-slate-400">— {waitingPatients.length} total waiting patients</span>
          </h3>
          {criticalCount > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-xs font-bold text-red-600">
              <AlertTriangle className="w-3 h-3" />
              {criticalCount} Critical
            </span>
          )}
        </div>
        <SeverityBar patients={patients} />
      </div>

      {/* Section: Queue Status */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-cyan-500" />
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Queue &amp; System Status</h2>
          <span className="text-xs text-slate-400">— Real-time load and performance metrics</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard title="Queue Status" value={queueStats.status || 'Loading...'} subtitle="System load indicator" icon={Shield} color="purple" />
          <StatCard title="Available Ambulances" value={availableAmbulances.length} subtitle="Ready for dispatch" icon={HeartPulse} color="pink" />
          <StatCard title="Available Doctors" value={queueStats.availableDoctors || 0} subtitle={`${queueStats.totalDoctors || 0} total on staff`} icon={Users} color="teal" />
          <StatCard title="Active Hospitals" value={5} subtitle="In network" icon={Activity} color="teal" />
          <StatCard title="Throughput" value={`${queueStats.throughput}/hr`} subtitle="Patient processing rate" icon={TrendingUp} color="slate" trend={3} />
          <StatCard title="Pending Beds" value={queueStats.pendingBeds || 0} subtitle="Waiting for bed" icon={Activity} color="orange" />
        </div>
      </div>

      {/* Wait Time Trend */}
      <div className="card">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-500" />
          Wait Time Trend
          <span className="text-xs font-normal text-slate-400">— Average vs predicted wait times by day</span>
        </h3>
        <WaitTimeChart trendData={trendData} />
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Priority Patients */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Top Priority Patients
              {waitingPatients.length > 0 && (
                <span className="text-xs font-normal text-slate-400">— Next {Math.min(8, waitingPatients.length)} to treat</span>
              )}
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

        {/* Recently Treated */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              Recently Treated
              <span className="text-xs font-normal text-slate-400">— Last 5 discharged patients</span>
            </h3>
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
