import { useState, useEffect, useCallback, useRef } from 'react';
import { getHospitals, getRoads, getAmbulances, getShortestPath, dispatchAmbulance } from '../services/api';
import useRealtimeData from '../hooks/useRealtimeData';
import { Truck, MapPin, Route, Navigation, Loader2, Send, AlertCircle, X, CheckCircle, AlertTriangle } from 'lucide-react';

export default function Dispatch() {
  const [hospitals, setHospitals] = useState([]);
  const [roads, setRoads] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [fromHospital, setFromHospital] = useState('');
  const [toHospital, setToHospital] = useState('');
  const [pathResult, setPathResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [actionFeedback, setActionFeedback] = useState(null);
  const feedbackTimeoutRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const [h, r, a] = await Promise.all([getHospitals(), getRoads(), getAmbulances()]);
      setHospitals(h);
      setRoads(r);
      setAmbulances(a);
    } catch (err) {
      console.error('Dispatch load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        const [h, r, a] = await Promise.all([getHospitals(), getRoads(), getAmbulances()]);
        if (!mounted) return;
        setHospitals(h);
        setRoads(r);
        setAmbulances(a);
        if (h.length > 0) setFromHospital(h[0].id);
        if (h.length > 1) setToHospital(h[1].id);
      } catch (err) {
        console.error('Dispatch load error:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    init();
    return () => { mounted = false; };
  }, []);

  useRealtimeData(load, []);

  const showFeedback = (feedback) => {
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    setActionFeedback(feedback);
    feedbackTimeoutRef.current = setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleDispatch = async (type, hospitalId) => {
    setActionLoading((prev) => ({ ...prev, [type]: true }));
    try {
      const result = await dispatchAmbulance(type, hospitalId);
      if (result.success) {
        showFeedback({
          type: 'success',
          message: `${type === 'EMERGENCY' ? 'Emergency' : 'Transport'} dispatched: ${result.ambulanceId} → ${result.hospital}`,
        });
      } else {
        showFeedback({ type: 'error', message: result.message || 'Dispatch failed' });
      }
      await load();
    } catch {
      showFeedback({ type: 'error', message: `Failed to dispatch ${type.toLowerCase()}` });
    } finally {
      setActionLoading((prev) => ({ ...prev, [type]: false }));
      setModal(null);
    }
  };

  const calculatePath = async () => {
    if (!fromHospital || !toHospital || fromHospital === toHospital) {
      setPathResult({ error: 'Select different hospitals' });
      return;
    }
    try {
      const result = await getShortestPath(fromHospital, toHospital);
      setPathResult({
        path: result.path,
        distance: result.distance,
        time: result.time,
      });
    } catch {
      setPathResult({ error: 'Failed to calculate path' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading dispatch panel...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Truck className="w-6 h-6 text-cyan-600" />
          Ambulance Dispatch & Hospital Network
        </h1>
        <p className="text-sm text-slate-500 mt-1">Dijkstra shortest path algorithm for optimal hospital routing</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hospital Network */}
        <div className="card">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-600" />
            Hospital Network (Graph)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Hospital</th>
                  <th className="px-3 py-2">Beds</th>
                  <th className="px-3 py-2">ICU</th>
                  <th className="px-3 py-2">Doctors</th>
                  <th className="px-3 py-2">Emergency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hospitals.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-mono text-xs text-slate-400">{h.id}</td>
                    <td className="px-3 py-2 font-medium text-slate-700">{h.name}</td>
                    <td className="px-3 py-2 text-slate-500">{h.availableBeds}/{h.totalBeds}</td>
                    <td className="px-3 py-2 text-slate-500">{h.availableICU}/{h.totalICU}</td>
                    <td className="px-3 py-2 text-slate-500">{h.availableDoctors}/{h.doctors}</td>
                    <td className="px-3 py-2">
                      {h.hasEmergency ? (
                        <span className="badge bg-emerald-100 text-emerald-700 border border-emerald-300">Yes</span>
                      ) : (
                        <span className="badge bg-slate-100 text-slate-500 border border-slate-300">No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs font-semibold text-slate-700 mb-2">Road Connections:</p>
            <div className="grid grid-cols-2 gap-1 text-xs text-slate-500">
              {roads.map((r, i) => (
                <div key={i} className="flex items-center gap-1">
                  <Route className="w-3 h-3 text-cyan-600" />
                  {r.from} ↔ {r.to}: {r.distance} km
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dispatch & Dijkstra */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Send className="w-4 h-4 text-cyan-600" />
              Quick Dispatch
            </h3>
            {actionFeedback && (
              <div className={`mb-4 p-3.5 rounded-xl text-sm font-bold flex items-center gap-3 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300 ${
                actionFeedback.type === 'error'
                  ? 'bg-red-100 text-red-800 border-2 border-red-300 shadow-red-100'
                  : 'bg-emerald-100 text-emerald-800 border-2 border-emerald-300 shadow-emerald-100'
              }`}>
                {actionFeedback.type === 'error'
                  ? <AlertTriangle className="w-5 h-5 text-red-600" />
                  : <CheckCircle className="w-5 h-5 text-emerald-600" />
                }
                {actionFeedback.message}
              </div>
            )}
            <div className="space-y-2 text-sm text-slate-600">
              <p className="text-xs text-slate-500">Available ambulances: {ambulances.filter(a => a.status === 'AVAILABLE').length}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setModal('EMERGENCY')}
                  disabled={actionLoading.EMERGENCY}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-red-200 hover:shadow-red-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading.EMERGENCY ? <Loader2 className="w-5 h-5 animate-spin" /> : <AlertTriangle className="w-5 h-5" />}
                  Dispatch Emergency
                </button>
                <button
                  onClick={() => setModal('TRANSPORT')}
                  disabled={actionLoading.TRANSPORT}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading.TRANSPORT ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  Dispatch Transport
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-cyan-600" />
              Shortest Path (Dijkstra)
            </h3>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label htmlFor="dispatch-from" className="block text-xs font-medium text-slate-600 mb-1">From Hospital</label>
                <select id="dispatch-from" name="fromHospital" value={fromHospital} onChange={(e) => setFromHospital(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer">
                  {hospitals.map((h) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="dispatch-to" className="block text-xs font-medium text-slate-600 mb-1">To Hospital</label>
                <select id="dispatch-to" name="toHospital" value={toHospital} onChange={(e) => setToHospital(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer">
                  {hospitals.map((h) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <button onClick={calculatePath} className="w-full py-2.5 rounded-lg bg-cyan-600 text-white font-medium text-sm hover:bg-cyan-700 transition flex items-center justify-center gap-2 cursor-pointer min-h-[44px] shadow-sm shadow-cyan-200">
              <Route className="w-4 h-4" /> Calculate Shortest Path
            </button>

            {pathResult && (
              <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                {pathResult.error ? (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" /> {pathResult.error}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-700">Shortest Path:</p>
                    <div className="flex items-center gap-1 flex-wrap text-sm">
                      {pathResult.path.map((node, i) => (
                        <span key={node} className="flex items-center gap-1">
                          <span className="px-2 py-0.5 bg-cyan-50 text-cyan-700 border border-cyan-200 rounded text-xs font-mono font-bold">{node}</span>
                          {i < pathResult.path.length - 1 && <span className="text-slate-400">→</span>}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500">Distance: <span className="font-bold text-slate-800">{pathResult.distance.toFixed(1)} km</span></p>
                    <p className="text-xs text-slate-500">Est. Travel Time: <span className="font-bold text-slate-800">{pathResult.time} minutes</span></p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Truck className="w-4 h-4 text-red-500" />
              Active Ambulances
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">Driver</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Patient</th>
                    <th className="px-3 py-2">Destination</th>
                    <th className="px-3 py-2">Dist</th>
                    <th className="px-3 py-2">ETA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ambulances.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-mono text-xs text-slate-400">{a.id}</td>
                      <td className="px-3 py-2 text-slate-700">{a.driver}</td>
                      <td className="px-3 py-2">
                        <AmbulanceStatusBadge status={a.status} />
                      </td>
                      <td className="px-3 py-2 text-slate-500">{a.patient || '-'}</td>
                      <td className="px-3 py-2 text-slate-500">{a.destination || '-'}</td>
                      <td className="px-3 py-2 text-slate-500">{a.distance > 0 ? `${a.distance} km` : '-'}</td>
                      <td className="px-3 py-2 text-slate-500">{a.eta > 0 ? `${a.eta} min` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">
                {modal === 'EMERGENCY' ? 'Dispatch Emergency Ambulance' : 'Dispatch Transport Ambulance'}
              </h3>
              <button onClick={() => setModal(null)} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <DispatchModalContent
              hospitals={hospitals}
              modal={modal}
              onAction={handleDispatch}
              loading={actionLoading[modal]}
              onCancel={() => setModal(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function DispatchModalContent({ hospitals, modal, onAction, loading, onCancel }) {
  const [hospitalId, setHospitalId] = useState(hospitals[0]?.id || '');

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Destination Hospital</label>
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
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onAction(modal, hospitalId)}
          disabled={loading}
          className={`flex-1 py-2.5 rounded-lg text-white font-medium text-sm transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
            modal === 'EMERGENCY' ? 'bg-red-600 hover:bg-red-700' : 'bg-cyan-600 hover:bg-cyan-700'
          }`}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : modal === 'EMERGENCY' ? <AlertTriangle className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          {modal === 'EMERGENCY' ? 'Dispatch Emergency' : 'Dispatch Transport'}
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

function AmbulanceStatusBadge({ status }) {
  const colors = {
    AVAILABLE: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    DISPATCHED: 'bg-red-100 text-red-700 border-red-300',
    EN_ROUTE: 'bg-amber-100 text-amber-700 border-amber-300',
    AT_SCENE: 'bg-cyan-100 text-cyan-700 border-cyan-300',
    TRANSPORTING: 'bg-cyan-100 text-cyan-700 border-cyan-300',
    AT_HOSPITAL: 'bg-teal-100 text-teal-700 border-teal-300',
    RETURNING: 'bg-slate-100 text-slate-600 border-slate-300',
  };
  return (
    <span className={`badge border text-[10px] ${colors[status] || colors.RETURNING}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
