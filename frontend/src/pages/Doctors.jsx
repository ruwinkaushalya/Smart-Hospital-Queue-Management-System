import { useState, useEffect, useCallback } from 'react';
import { getDoctors, getHospitals, subscribeToRealtime } from '../services/api';
import StatCard from '../components/StatCard';

import {
  Stethoscope, Users, Clock, Activity, CheckCircle2, XCircle, CircleDot,
  Phone, Building2, Calendar, Loader2, RefreshCw
} from 'lucide-react';

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [specialtyFilter, setSpecialtyFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchData = useCallback(async () => {
    try {
      const [docs, hosps] = await Promise.all([getDoctors(), getHospitals()]);
      setDoctors(Array.isArray(docs) ? docs : []);
      setHospitals(Array.isArray(hosps) ? hosps : []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const unsubscribe = subscribeToRealtime((event) => {
      if (event.type === 'refresh') fetchData();
    });
    return () => unsubscribe();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const hospitalMap = {};
  hospitals.forEach(h => { hospitalMap[h.id] = h.name; });

  const specialties = ['All', ...new Set(doctors.map(d => d.specialty).filter(Boolean))];

  const filtered = doctors.filter(d => {
    const matchSpecialty = specialtyFilter === 'All' || d.specialty === specialtyFilter;
    const matchStatus = statusFilter === 'All'
      || (statusFilter === 'Available' && d.available)
      || (statusFilter === 'On Duty' && d.onDuty && !d.available)
      || (statusFilter === 'Off Duty' && !d.onDuty);
    return matchSpecialty && matchStatus;
  });

  const total = doctors.length;
  const available = doctors.filter(d => d.available).length;
  const onDuty = doctors.filter(d => d.onDuty).length;
  const offDuty = doctors.filter(d => !d.onDuty).length;
  const totalPatientsToday = doctors.reduce((sum, d) => sum + (d.patientsToday || 0), 0);

  const getStatusConfig = (d) => {
    if (d.available) return { label: 'Available', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' };
    if (d.onDuty) return { label: 'Busy', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' };
    return { label: 'Off Duty', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' };
  };

  const specialtyColors = {
    'Emergency Medicine': 'bg-red-100 text-red-700 border-red-200',
    'Cardiology': 'bg-rose-100 text-rose-700 border-rose-200',
    'Orthopedics': 'bg-blue-100 text-blue-700 border-blue-200',
    'Pediatrics': 'bg-pink-100 text-pink-700 border-pink-200',
    'General Surgery': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'Neurology': 'bg-violet-100 text-violet-700 border-violet-200',
    'Oncology': 'bg-orange-100 text-orange-700 border-orange-200',
    'Radiology': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
        <span className="ml-3 text-slate-500 font-medium">Loading doctors...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-emerald-500" />
            Doctors
          </h2>
          <p className="text-sm text-slate-500 mt-1">View doctor availability, specialties, and assignments</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="Total Doctors" value={total} icon={Users} color="blue" />
        <StatCard title="Available" value={available} icon={CheckCircle2} color="emerald" />
        <StatCard title="On Duty" value={onDuty} icon={Activity} color="cyan" />
        <StatCard title="Off Duty" value={offDuty} icon={XCircle} color="slate" />
        <StatCard title="Patients Today" value={totalPatientsToday} icon={Calendar} color="violet" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="doctors-specialty" className="text-sm text-slate-500 font-medium">Specialty:</label>
          <select
            id="doctors-specialty"
            name="specialty"
            value={specialtyFilter}
            onChange={e => setSpecialtyFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            {specialties.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="doctors-status" className="text-sm text-slate-500 font-medium">Status:</label>
          <select
            id="doctors-status"
            name="status"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <option value="All">All</option>
            <option value="Available">Available</option>
            <option value="On Duty">On Duty (Busy)</option>
            <option value="Off Duty">Off Duty</option>
          </select>
        </div>
        <span className="text-sm text-slate-400 ml-auto">
          Showing {filtered.length} of {doctors.length} doctors
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          Failed to load doctors: {error}
        </div>
      )}

      {/* Doctor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(d => {
          const status = getStatusConfig(d);
          const StatusIcon = status.icon;
          const workloadPct = d.maxPatientsPerDay > 0 ? Math.round((d.patientsToday / d.maxPatientsPerDay) * 100) : 0;
          return (
            <div
              key={d.id}
              className={`bg-white rounded-xl border ${status.border} p-5 shadow-sm hover:shadow-md transition-all duration-200`}
            >
              {/* Top row */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${status.bg}`}>
                    <Stethoscope className={`w-5 h-5 ${status.text}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm">{d.name}</h3>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${specialtyColors[d.specialty] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                      {d.specialty}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200">
                  <span className={`w-2 h-2 rounded-full ${status.dot} ${d.available ? 'animate-pulse' : ''}`} />
                  <span className={`text-[11px] font-semibold ${status.text}`}>{status.label}</span>
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{hospitalMap[d.hospitalId] || d.hospitalId}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{d.phone || '—'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Users className="w-3.5 h-3.5" />
                  <span>ID: {d.id}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <CircleDot className="w-3.5 h-3.5" />
                  <span>{d.currentPatientId ? 'With Patient' : 'No Patient'}</span>
                </div>
              </div>

              {/* Workload bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Daily Workload</span>
                  <span className="font-semibold text-slate-700">{d.patientsToday} / {d.maxPatientsPerDay}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      workloadPct >= 90 ? 'bg-red-500' : workloadPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(workloadPct, 100)}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-400 text-right">
                  {workloadPct}% capacity used
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && !loading && (
        <div className="text-center py-16 text-slate-400">
          <Stethoscope className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-medium">No doctors match the selected filters</p>
        </div>
      )}
    </div>
  );
}
