import { useState, useEffect, useCallback, useRef } from 'react';
import { getHospitals, allocateBed, dischargeBed, emergencyICURequest } from '../services/api';
import useRealtimeData from '../hooks/useRealtimeData';
import {
  BedDouble, Loader2, CheckCircle, AlertTriangle,
  Hospital, Activity, TrendingUp, Filter, X, Plus, Minus, HeartPulse
} from 'lucide-react';

function generateBeds(hospital) {
  const beds = [];
  const occupied = hospital.totalBeds - hospital.availableBeds;
  for (let i = 0; i < hospital.totalBeds; i++) {
    beds.push({
      id: `${hospital.id}-B${i + 1}`,
      number: i + 1,
      occupied: i < occupied,
      type: i < hospital.totalICU ? 'ICU' : 'General',
      patient: i < occupied ? `Patient ${i + 1}` : null,
    });
  }
  return beds;
}

export default function BedManagement() {
  const [hospitals, setHospitals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [filterType, setFilterType] = useState('ALL');
  const [modal, setModal] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [actionFeedback, setActionFeedback] = useState(null);
  const feedbackTimeoutRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const h = await getHospitals();
      setHospitals(h);
      if (!selectedHospital && h.length > 0) setSelectedHospital(h[0]);
    } catch (err) {
      console.error('BedManagement load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedHospital]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const h = await getHospitals();
        if (mounted) {
          setHospitals(h);
          if (h.length > 0) setSelectedHospital(h[0]);
        }
      } catch (err) {
        console.error('BedManagement load error:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useRealtimeData(load, []);

  const showFeedback = (feedback) => {
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    setActionFeedback(feedback);
    feedbackTimeoutRef.current = setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleAllocate = async (hospitalId, bedType) => {
    setActionLoading((prev) => ({ ...prev, allocate: true }));
    try {
      const result = await allocateBed(hospitalId, bedType);
      if (result.success) {
        const h = hospitals.find(hh => hh.id === hospitalId);
        showFeedback({ type: 'success', message: `${bedType} bed allocated at ${h?.name || hospitalId}` });
      } else {
        showFeedback({ type: 'error', message: result.message || 'Failed to allocate bed' });
      }
      await load();
    } catch {
      showFeedback({ type: 'error', message: 'Failed to allocate bed' });
    } finally {
      setActionLoading((prev) => ({ ...prev, allocate: false }));
      setModal(null);
    }
  };

  const handleDischarge = async (hospitalId, bedType) => {
    setActionLoading((prev) => ({ ...prev, discharge: true }));
    try {
      const result = await dischargeBed(hospitalId, bedType);
      if (result.success) {
        const h = hospitals.find(hh => hh.id === hospitalId);
        showFeedback({ type: 'success', message: `${bedType} bed discharged at ${h?.name || hospitalId}` });
      } else {
        showFeedback({ type: 'error', message: result.message || 'Failed to discharge bed' });
      }
      await load();
    } catch {
      showFeedback({ type: 'error', message: 'Failed to discharge bed' });
    } finally {
      setActionLoading((prev) => ({ ...prev, discharge: false }));
      setModal(null);
    }
  };

  const handleEmergencyICU = async () => {
    setActionLoading((prev) => ({ ...prev, icu: true }));
    try {
      const result = await emergencyICURequest();
      showFeedback({ type: 'success', message: `Emergency ICU request added: ${result.name || 'ICU Patient'}` });
    } catch {
      showFeedback({ type: 'error', message: 'Failed to add ICU request' });
    } finally {
      setActionLoading((prev) => ({ ...prev, icu: false }));
    }
  };

  const currentHospital = selectedHospital || hospitals[0];
  const beds = currentHospital ? generateBeds(currentHospital) : [];
  const filteredBeds = filterType === 'ALL' ? beds : beds.filter(b => b.type === filterType);

  const totalBeds = hospitals.reduce((acc, h) => acc + h.totalBeds, 0);
  const availableBeds = hospitals.reduce((acc, h) => acc + h.availableBeds, 0);
  const totalICU = hospitals.reduce((acc, h) => acc + h.totalICU, 0);
  const availableICU = hospitals.reduce((acc, h) => acc + h.availableICU, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading bed management...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BedDouble className="w-6 h-6 text-cyan-600" />
            Bed & ICU Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">Real-time bed allocation, ICU tracking, and availability across all hospitals</p>
        </div>

        {/* Quick Actions Floating Bar */}
        <div className="flex-shrink-0">
          <div className="flex flex-wrap items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 shadow-lg shadow-slate-100">
            {actionFeedback && (
              <div className={`w-full mb-1 p-2.5 rounded-lg text-xs font-bold flex items-center gap-2 ${
                actionFeedback.type === 'error'
                  ? 'bg-red-100 text-red-800 border-2 border-red-200'
                  : 'bg-emerald-100 text-emerald-800 border-2 border-emerald-200'
              }`}>
                {actionFeedback.type === 'error'
                  ? <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  : <CheckCircle className="w-4 h-4 flex-shrink-0" />
                }
                {actionFeedback.message}
              </div>
            )}
            <button
              onClick={() => setModal('allocate')}
              disabled={actionLoading.allocate}
              className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-200 hover:shadow-blue-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading.allocate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Allocate Bed
            </button>
            <button
              onClick={() => setModal('discharge')}
              disabled={actionLoading.discharge}
              className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-700 hover:to-emerald-600 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-200 hover:shadow-emerald-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading.discharge ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Minus className="w-3.5 h-3.5" />}
              Discharge Patient
            </button>
            <button
              onClick={handleEmergencyICU}
              disabled={actionLoading.icu}
              className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-red-200 hover:shadow-red-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading.icu ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <HeartPulse className="w-3.5 h-3.5" />}
              Emergency ICU
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-blue-50 border-blue-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <BedDouble className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-blue-600 font-medium">Total Beds</p>
            <p className="text-2xl font-bold text-blue-800">{totalBeds}</p>
          </div>
        </div>
        <div className="card bg-emerald-50 border-emerald-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-emerald-600 font-medium">Available Beds</p>
            <p className="text-2xl font-bold text-emerald-800">{availableBeds}</p>
          </div>
        </div>
        <div className="card bg-red-50 border-red-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-xs text-red-600 font-medium">Total ICU</p>
            <p className="text-2xl font-bold text-red-800">{totalICU}</p>
          </div>
        </div>
        <div className="card bg-amber-50 border-amber-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <Activity className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-amber-600 font-medium">Available ICU</p>
            <p className="text-2xl font-bold text-amber-800">{availableICU}</p>
          </div>
        </div>
      </div>

      {/* Hospital selector */}
      <div className="flex flex-wrap gap-2">
        {hospitals.map((h) => {
          const active = currentHospital?.id === h.id;
          const occupancy = ((h.totalBeds - h.availableBeds) / h.totalBeds) * 100;
          return (
            <button
              key={h.id}
              onClick={() => setSelectedHospital(h)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition border cursor-pointer ${
                active
                  ? 'bg-cyan-50 text-cyan-700 border-cyan-300'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Hospital className="w-4 h-4" />
                <span>{h.name}</span>
                <span className={`w-2 h-2 rounded-full ${occupancy > 90 ? 'bg-red-500' : occupancy > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Bed grid */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <BedDouble className="w-4 h-4 text-cyan-600" />
            {currentHospital?.name} — Bed Layout
          </h3>
          <div className="flex items-center gap-2">
            <label htmlFor="beds-filter" className="sr-only">Filter bed type</label>
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="beds-filter"
              name="filterType"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Beds</option>
              <option value="General">General Ward</option>
              <option value="ICU">ICU</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filteredBeds.map((bed) => (
            <div
              key={bed.id}
              className={`relative p-3 rounded-lg border transition-all cursor-pointer ${
                bed.occupied
                  ? bed.type === 'ICU'
                    ? 'bg-red-50 border-red-200 hover:border-red-300'
                    : 'bg-amber-50 border-amber-200 hover:border-amber-300'
                  : bed.type === 'ICU'
                    ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-300'
                    : 'bg-white border-slate-200 hover:border-cyan-300'
              }`}
              title={bed.occupied ? `${bed.patient} (${bed.type})` : `Available ${bed.type} Bed`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-bold ${bed.type === 'ICU' ? 'text-red-600' : 'text-slate-600'}`}>
                  {bed.type === 'ICU' ? 'ICU' : 'GW'}
                </span>
                <span className={`w-2 h-2 rounded-full ${bed.occupied ? 'bg-red-500' : 'bg-emerald-500'}`} />
              </div>
              <p className="text-sm font-semibold text-slate-800">Bed {bed.number}</p>
              <p className="text-xs text-slate-500 truncate">
                {bed.occupied ? bed.patient : 'Available'}
              </p>
              {bed.occupied && (
                <div className="absolute top-2 right-2">
                  <AlertTriangle className="w-3 h-3 text-red-400" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500" /> Available
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500" /> Occupied
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-red-50 border border-red-200" /> ICU
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-white border border-slate-200" /> General
          </div>
        </div>
      </div>

      {/* Occupancy breakdown */}
      <div className="card">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-600" />
          Occupancy by Hospital
        </h3>
        <div className="space-y-3">
          {hospitals.map((h) => {
            const occupancy = ((h.totalBeds - h.availableBeds) / h.totalBeds) * 100;
            return (
              <div key={h.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-700">{h.name}</span>
                  <span className={`font-semibold ${occupancy > 90 ? 'text-red-600' : occupancy > 70 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {occupancy.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${occupancy > 90 ? 'bg-red-500' : occupancy > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${occupancy}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {h.availableBeds} available / {h.totalBeds} total · {h.availableICU} ICU available
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">
                {modal === 'allocate' ? 'Allocate New Bed' : 'Discharge Patient'}
              </h3>
              <button onClick={() => setModal(null)} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <BedModalContent
              hospitals={hospitals}
              modal={modal}
              onAction={modal === 'allocate' ? handleAllocate : handleDischarge}
              loading={actionLoading[modal]}
              onCancel={() => setModal(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function BedModalContent({ hospitals, modal, onAction, loading, onCancel }) {
  const [hospitalId, setHospitalId] = useState(hospitals[0]?.id || '');
  const [bedType, setBedType] = useState('GENERAL');

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Hospital</label>
        <select
          value={hospitalId}
          onChange={(e) => setHospitalId(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
        >
          {hospitals.map((h) => (
            <option key={h.id} value={h.id}>{h.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Bed Type</label>
        <div className="flex gap-2">
          <button
            onClick={() => setBedType('GENERAL')}
            className={`flex-1 py-2 rounded-lg border text-sm font-medium transition cursor-pointer ${
              bedType === 'GENERAL'
                ? 'bg-cyan-50 text-cyan-700 border-cyan-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            General Ward
          </button>
          <button
            onClick={() => setBedType('ICU')}
            className={`flex-1 py-2 rounded-lg border text-sm font-medium transition cursor-pointer ${
              bedType === 'ICU'
                ? 'bg-red-50 text-red-700 border-red-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            ICU
          </button>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onAction(hospitalId, bedType)}
          disabled={loading}
          className={`flex-1 py-2.5 rounded-lg text-white font-medium text-sm transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
            modal === 'allocate' ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : modal === 'allocate' ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
          {modal === 'allocate' ? 'Allocate' : 'Discharge'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium text-sm transition cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
