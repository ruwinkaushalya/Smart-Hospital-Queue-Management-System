import { useState, useEffect, useCallback } from 'react';
import StatCard from '../components/StatCard';
import SeverityBadge from '../components/SeverityBadge';
import { getPatients, getQueueStatus, getAmbulances, getHospitals } from '../services/api';
import useRealtimeData from '../hooks/useRealtimeData';
import {
  Activity, Users, AlertTriangle, BedDouble, Truck,
  Loader2, HeartPulse, ArrowRight, Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NurseDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [queueStats, setQueueStats] = useState({});
  const [ambulances, setAmbulances] = useState([]);
  const [hospitals, setHospitals] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [p, q, a, h] = await Promise.all([getPatients(), getQueueStatus(), getAmbulances(), getHospitals()]);
        if (!mounted) return;
        setPatients(p);
        setQueueStats(q);
        setAmbulances(a);
        setHospitals(h);
      } catch (err) {
        console.error('NurseDashboard load error:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const load = useCallback(async () => {
    try {
      const [p, q, a, h] = await Promise.all([getPatients(), getQueueStatus(), getAmbulances(), getHospitals()]);
      setPatients(p);
      setQueueStats(q);
      setAmbulances(a);
      setHospitals(h);
    } catch (err) {
      console.error('NurseDashboard load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useRealtimeData(load, []);

  const waitingPatients = patients.filter(p => p.status === 'waiting');
  const availableAmbulances = ambulances.filter(a => a.status === 'AVAILABLE');
  const dispatchedAmbulances = ambulances.filter(a => a.status !== 'AVAILABLE');
  const totalBeds = hospitals.reduce((acc, h) => acc + h.totalBeds, 0);
  const availableBeds = hospitals.reduce((acc, h) => acc + h.availableBeds, 0);
  const highOccupancy = hospitals.filter(h => ((h.totalBeds - h.availableBeds) / h.totalBeds) > 0.85);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading nurse dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Activity className="w-6 h-6 text-amber-600" />
          Nurse Dashboard
        </h1>
        <p className="text-sm text-slate-500 mt-1">Bed availability, ambulance dispatch status, and queue overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Waiting Patients" value={waitingPatients.length} subtitle="In queue" icon={Users} color="blue" />
        <StatCard title="Available Beds" value={availableBeds} subtitle={`Out of ${totalBeds} total`} icon={BedDouble} color="green" />
        <StatCard title="Avail. Ambulances" value={availableAmbulances.length} subtitle="Ready to deploy" icon={Truck} color="pink" />
        <StatCard title="Active Dispatches" value={dispatchedAmbulances.length} subtitle="Currently en route" icon={HeartPulse} color="red" />
        <StatCard title="Hospitals at Risk" value={highOccupancy.length} subtitle=">85% occupancy" icon={AlertTriangle} color="orange" />
        <StatCard title="Queue Status" value={queueStats.status || 'N/A'} subtitle="System load" icon={Clock} color="purple" />
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bed Availability */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <BedDouble className="w-4 h-4 text-cyan-500" />
              Bed Availability by Hospital
              <span className="text-xs font-normal text-slate-400">— {availableBeds} beds free</span>
            </h3>
            <Link to="/beds" className="text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1">
              Manage Beds <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {hospitals.slice(0, 6).map((h) => {
              const occupancy = ((h.totalBeds - h.availableBeds) / h.totalBeds) * 100;
              const occupancyColor = occupancy > 90 ? 'bg-red-500' : occupancy > 70 ? 'bg-amber-500' : 'bg-emerald-500';
              return (
                <div key={h.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-700 font-medium">{h.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{h.availableBeds} free</span>
                      <span className={`text-xs font-semibold ${occupancy > 90 ? 'text-red-600' : occupancy > 70 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {occupancy.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${occupancyColor}`} style={{ width: `${occupancy}%` }} />
                  </div>
                  <div className="flex gap-3 mt-0.5 text-[10px] text-slate-400">
                    <span>ICU: {h.availableICU}/{h.totalICU}</span>
                    <span>Doctors: {h.availableDoctors}/{h.doctors}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ambulance Status */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-500" />
              Ambulance Fleet Status
              <span className="text-xs font-normal text-slate-400">— {availableAmbulances.length} available</span>
            </h3>
            <Link to="/dispatch" className="text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1">
              Dispatch Center <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {ambulances.slice(0, 5).map((a) => (              <div key={a.id} className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
    a.status === 'AVAILABLE' ? 'bg-emerald-50 border-emerald-100' :
    a.status === 'DISPATCHED' ? 'bg-amber-50 border-amber-100' :
    'bg-red-50 border-red-100'
  }`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    a.status === 'AVAILABLE' ? 'bg-emerald-100' :
                    a.status === 'DISPATCHED' ? 'bg-amber-100' : 'bg-red-100'
                  }`}>
                    <Truck className={`w-4 h-4 ${
                      a.status === 'AVAILABLE' ? 'text-emerald-600' :
                      a.status === 'DISPATCHED' ? 'text-amber-600' : 'text-red-600'
                    }`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{a.id} · {a.driver}</p>
                    <p className="text-xs text-slate-400">
                      {a.status === 'AVAILABLE' ? 'Standing by' :
                       `${a.patient} → ${a.destination} (ETA: ${a.eta} min)`}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  a.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' :
                  a.status === 'DISPATCHED' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {a.status === 'AVAILABLE' ? 'Available' :
                   a.status === 'DISPATCHED' ? 'Dispatched' : 'En Route'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Critical patients today */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Critical Patients in Queue
            <span className="text-xs font-normal text-slate-400">— Require immediate attention</span>
          </h3>
          <Link to="/emergency" className="text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1">
            Emergency Queue <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                <th className="pb-2 font-medium">Patient</th>
                <th className="pb-2 font-medium">Severity</th>
                <th className="pb-2 font-medium">Symptoms</th>
                <th className="pb-2 font-medium">Wait Time</th>
                <th className="pb-2 font-medium">AI Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {waitingPatients.filter(p => p.severity === 'CRITICAL' || p.severity === 'HIGH').slice(0, 6).map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5">
                    <p className="font-medium text-slate-700">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.id}</p>
                  </td>
                  <td className="py-2.5"><SeverityBadge severity={p.severity} /></td>
                  <td className="py-2.5 max-w-[160px]">
                    <p className="text-xs text-slate-500 truncate" title={p.symptoms}>{p.symptoms}</p>
                  </td>
                  <td className="py-2.5 text-slate-500">{p.estimatedWait} min</td>
                  <td className="py-2.5">
                    <span className={`text-xs font-bold ${p.aiScore > 0.8 ? 'text-red-600' : 'text-amber-600'}`}>
                      {(p.aiScore * 100).toFixed(0)}%
                    </span>
                  </td>
                </tr>
              ))}
              {waitingPatients.filter(p => p.severity === 'CRITICAL' || p.severity === 'HIGH').length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">
                    No critical or high-severity patients waiting.
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
