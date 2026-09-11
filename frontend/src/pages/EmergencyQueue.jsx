import SeverityBadge from '../components/SeverityBadge';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { getEmergencyPatients } from '../services/api';
import useRealtimeData from '../hooks/useRealtimeData';
import { Search, Filter, ArrowUpDown, AlertTriangle, Activity, Loader2 } from 'lucide-react';

export default function EmergencyQueue() {
  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [sortBy, setSortBy] = useState('priority');
  const [isLoading, setIsLoading] = useState(true);
  const [patients, setPatients] = useState([]);

  const load = useCallback(async () => {
    try {
      const data = await getEmergencyPatients();
      setPatients(data);
    } catch (err) {
      console.error('EmergencyQueue load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getEmergencyPatients();
        if (mounted) setPatients(data);
      } catch (err) {
        console.error('EmergencyQueue load error:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useRealtimeData(load, []);

  const emergencyPatients = useMemo(() => {
    let filtered = patients.filter((p) => p.status === 'waiting' && (p.severity === 'CRITICAL' || p.severity === 'HIGH'));

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.symptoms.toLowerCase().includes(q)
      );
    }

    if (filterSeverity !== 'ALL') {
      filtered = filtered.filter((p) => p.severity === filterSeverity);
    }

    switch (sortBy) {
      case 'priority':
        filtered.sort((a, b) => b.aiScore - a.aiScore);
        break;
      case 'wait':
        filtered.sort((a, b) => a.estimatedWait - b.estimatedWait);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'age':
        filtered.sort((a, b) => b.age - a.age);
        break;
      default:
        break;
    }

    return filtered;
  }, [search, filterSeverity, sortBy, patients]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading emergency queue...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          Emergency Queue
        </h1>
        <p className="text-sm text-slate-500 mt-1">Priority-based queue for critical and high-severity patients</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="emergency-search"
            name="emergency-search"
            type="text"
            placeholder="Search by name, ID, or symptoms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent cursor-text placeholder:text-slate-400"
          />
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <select
              id="emergency-filter-severity"
              name="emergency-filter-severity"
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="pl-8 pr-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          <div className="relative">
            <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <select
              id="emergency-sort-by"
              name="emergency-sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="pl-8 pr-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
            >
              <option value="priority">AI Priority</option>
              <option value="wait">Wait Time</option>
              <option value="name">Name</option>
              <option value="age">Age</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-4 text-xs text-slate-500 bg-slate-50 rounded-lg px-4 py-2 border border-slate-200">
        <Activity className="w-3.5 h-3.5 text-cyan-600" />
        <span>Showing {emergencyPatients.length} emergency patients</span>
        <span className="text-slate-300">|</span>
        <span>Critical: {emergencyPatients.filter((p) => p.severity === 'CRITICAL').length}</span>
        <span className="text-slate-300">|</span>
        <span>High: {emergencyPatients.filter((p) => p.severity === 'HIGH').length}</span>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Age</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Symptoms</th>
                <th className="px-4 py-3">Wait</th>
                <th className="px-4 py-3">AI Score</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {emergencyPatients.map((p, index) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors cursor-default">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${index === 0 ? 'bg-red-500 text-white' : index === 1 ? 'bg-orange-500 text-white' : index === 2 ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{p.id}</td>
                  <td className="px-4 py-3 font-medium text-slate-700">{p.name}</td>
                  <td className="px-4 py-3 text-slate-500">{p.age}</td>
                  <td className="px-4 py-3">
                    <SeverityBadge severity={p.severity} />
                  </td>
                  <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">{p.symptoms}</td>
                  <td className="px-4 py-3 text-slate-500">{p.estimatedWait} min</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${p.aiScore > 0.8 ? 'bg-red-500' : p.aiScore > 0.6 ? 'bg-orange-500' : 'bg-cyan-500'}`}
                          style={{ width: `${p.aiScore * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-600">{(p.aiScore * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge bg-amber-100 text-amber-700 border border-amber-300">
                      Waiting
                    </span>
                  </td>
                </tr>
              ))}
              {emergencyPatients.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    No emergency patients found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
