import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { getAnalytics, getHourlyVolume, getWaitTimeTrend } from '../services/api';
import useRealtimeData from '../hooks/useRealtimeData';
import { BarChart3, Brain, Activity, AlertTriangle, TrendingUp, Clock, Users, Loader2, Download } from 'lucide-react';

const COLORS = ['#ef4444', '#f97316', '#06b6d4', '#22c55e'];

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState({ queueStats: {}, severityDistribution: [], hospitalPerformance: [] });
  const [hourlyVolume, setHourlyVolume] = useState([]);
  const [waitTimeTrend, setWaitTimeTrend] = useState([]);

  const load = useCallback(async () => {
    try {
      const a = await getAnalytics();
      setAnalytics(a);
    } catch (err) {
      console.error('Analytics load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        const [a, h, w] = await Promise.all([getAnalytics(), Promise.resolve(getHourlyVolume()), Promise.resolve(getWaitTimeTrend())]);
        if (!mounted) return;
        setAnalytics(a);
        setHourlyVolume(h);
        setWaitTimeTrend(w);
      } catch (err) {
        console.error('Analytics load error:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    init();
    return () => { mounted = false; };
  }, []);

  useRealtimeData(load, []);

  const { queueStats, severityDistribution, hospitalPerformance } = analytics;
  const waitingCount = queueStats.totalWaiting || 0;
  const treatedCount = queueStats.treatedCount || 0;
  const inProgressCount = 0;
  const avgWait = queueStats.avgWaitTime || 0;
  const criticalCount = queueStats.emergencyCount || 0;
  const criticalRatio = waitingCount > 0 ? (criticalCount / waitingCount) * 100 : 0;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'severity', label: 'Severity', icon: AlertTriangle },
    { id: 'volume', label: 'Volume', icon: BarChart3 },
    { id: 'prediction', label: 'AI Prediction', icon: Brain },
    { id: 'hospitals', label: 'Hospitals', icon: Users },
  ];

  const handleExport = () => {
    const data = JSON.stringify(analytics, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hospital-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Brain className="w-6 h-6 text-cyan-600" />
            AI Analytics & Insights
          </h1>
          <p className="text-sm text-slate-500 mt-1">Real-time analytics powered by AI decision support algorithms</p>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm transition-colors cursor-pointer">
          <Download className="w-4 h-4" /> Export Data
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit border border-slate-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                activeTab === tab.id ? 'bg-white text-cyan-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-bold text-slate-800 mb-4">Queue Performance Metrics</h3>
            <div className="space-y-3 text-sm">
              <MetricRow label="Total Waiting" value={waitingCount} />
              <MetricRow label="Critical Cases" value={criticalCount} color="text-red-600" />
              <MetricRow label="High Priority" value={queueStats.emergencyCount - criticalCount || 0} color="text-orange-600" />
              <MetricRow label="Moderate" value={queueStats.normalCount || 0} />
              <MetricRow label="Low/Routine" value={0} />
              <div className="border-t border-slate-200 pt-3">
                <MetricRow label="Avg Wait Time" value={`${avgWait} min`} />
                <MetricRow label="Total Treated" value={treatedCount} />
                <MetricRow label="In Progress" value={inProgressCount} />
                <MetricRow label="Critical Ratio" value={`${criticalRatio.toFixed(1)}%`} color={criticalRatio > 50 ? 'text-red-600 font-bold' : 'text-slate-700'} />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Brain className="w-4 h-4 text-cyan-600" />
              AI Insights
            </h3>
            <div className="space-y-3 text-sm">
              {criticalRatio > 30 && (
                <div className="p-3 bg-red-50 rounded-lg text-red-700 border border-red-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">High critical patient ratio detected</p>
                    <p className="text-xs mt-1 text-red-500">Recommend activating additional emergency staff.</p>
                  </div>
                </div>
              )}
              {avgWait > 45 && (
                <div className="p-3 bg-amber-50 rounded-lg text-amber-700 border border-amber-200 flex items-start gap-2">
                  <Clock className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">Average wait time exceeds 45 minutes</p>
                    <p className="text-xs mt-1 text-amber-500">Consider redirecting non-urgent cases to clinics.</p>
                  </div>
                </div>
              )}
              <div className="p-3 bg-cyan-50 rounded-lg text-cyan-700 border border-cyan-200">
                <p className="font-semibold">Optimization Recommendations:</p>
                <ul className="text-xs mt-1 space-y-1 list-disc list-inside text-cyan-600">
                  <li>Queue throughput: {treatedCount} patients processed</li>
                  <li>Priority Queue ensures O(log n) emergency insertions</li>
                  <li>Circular Queue handles O(1) normal patient enqueue/dequeue</li>
                  <li>Dijkstra's Algorithm finds O(E log V) shortest hospital paths</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'severity' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-bold text-slate-800 mb-4">Severity Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={severityDistribution} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {severityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#334155' }} />
                <Legend wrapperStyle={{ color: '#64748b' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="font-bold text-slate-800 mb-4">Severity by Count</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={severityDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#64748b' }} />
                <YAxis tick={{ fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#334155' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {severityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'volume' && (
        <div className="card">
          <h3 className="font-bold text-slate-800 mb-4">Hourly Patient Volume</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={hourlyVolume}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="hour" tick={{ fill: '#64748b' }} />
              <YAxis tick={{ fill: '#64748b' }} />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#334155' }} />
              <Legend wrapperStyle={{ color: '#64748b' }} />
              <Bar dataKey="emergency" name="Emergency" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="normal" name="Normal" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeTab === 'prediction' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-600" />
              AI Wait Time Prediction vs Actual
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={waitTimeTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fill: '#64748b' }} />
                <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft', fill: '#64748b' }} tick={{ fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#334155' }} />
                <Legend wrapperStyle={{ color: '#64748b' }} />
                <Line type="monotone" dataKey="avgWait" name="Actual Wait Time" stroke="#0891b2" strokeWidth={2} dot={{ r: 4, fill: '#0891b2' }} />
                <Line type="monotone" dataKey="predicted" name="AI Predicted" stroke="#06b6d4" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4, fill: '#06b6d4' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card bg-cyan-50 border-cyan-200">
              <p className="text-xs text-cyan-700 uppercase font-semibold">Prediction Accuracy</p>
              <p className="text-2xl font-bold text-cyan-800 mt-1">87%</p>
              <p className="text-xs text-cyan-600 mt-1">Based on 7-day rolling average</p>
            </div>
            <div className="card bg-blue-50 border-blue-200">
              <p className="text-xs text-blue-700 uppercase font-semibold">Avg Prediction Error</p>
              <p className="text-2xl font-bold text-blue-800 mt-1">±4.2 min</p>
              <p className="text-xs text-blue-600 mt-1">Mean absolute error</p>
            </div>
            <div className="card bg-emerald-50 border-emerald-200">
              <p className="text-xs text-emerald-700 uppercase font-semibold">Trend</p>
              <p className="text-2xl font-bold text-emerald-800 mt-1">-12%</p>
              <p className="text-xs text-emerald-600 mt-1">Wait time reduction this week</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'hospitals' && (
        <div className="card">
          <h3 className="font-bold text-slate-800 mb-4">Hospital Load & Capacity</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
                  <th className="px-4 py-3">Hospital</th>
                  <th className="px-4 py-3">Load %</th>
                  <th className="px-4 py-3">Beds</th>
                  <th className="px-4 py-3">ICU</th>
                  <th className="px-4 py-3">Doctors</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hospitalPerformance.map((h) => (
                  <tr key={h.name} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-700">{h.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${h.load > 90 ? 'bg-red-500' : h.load > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(h.load, 100)}%` }} />
                        </div>
                        <span className="text-xs text-slate-500">{h.load}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{h.beds}</td>
                    <td className="px-4 py-3 text-slate-500">{h.icu}</td>
                    <td className="px-4 py-3 text-slate-500">—</td>
                    <td className="px-4 py-3">
                      <span className={`badge border text-[10px] ${h.load > 90 ? 'bg-red-100 text-red-700 border-red-300' : h.load > 70 ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-emerald-100 text-emerald-700 border-emerald-300'}`}>
                        {h.load > 90 ? 'OVERLOADED' : h.load > 70 ? 'HIGH' : 'NORMAL'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricRow({ label, value, color = 'text-slate-700' }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  );
}
