import { useState, useEffect, useCallback } from 'react';
import { getPatients, getHospitals } from '../services/api';
import useRealtimeData from '../hooks/useRealtimeData';
import SeverityBadge from '../components/SeverityBadge';
import {
  Stethoscope, CheckCircle, Loader2, Clock, User, BedDouble,
  Search, Filter
} from 'lucide-react';

const DOCTORS = ['Dr. Silva', 'Dr. Fernando', 'Dr. Perera', 'Dr. Jayasinghe', 'Dr. Bandara'];

export default function Treatment() {
  const [patients, setPatients] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [treatedPatients, setTreatedPatients] = useState([]);

  const load = useCallback(async () => {
    try {
      const [p, h] = await Promise.all([getPatients(), getHospitals()]);
      setPatients(p);
      setHospitals(h);
    } catch (err) {
      console.error('Treatment load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [p, h] = await Promise.all([getPatients(), getHospitals()]);
        if (mounted) {
          setPatients(p);
          setHospitals(h);
        }
      } catch (err) {
        console.error('Treatment load error:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useRealtimeData(load, []);

  const handleTreat = (patientId, doctor, bed, hospital) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    setTreatedPatients(prev => [...prev, { ...patient, doctor, bed, hospital, treatedAt: new Date().toLocaleString() }]);
    setPatients(prev => prev.filter(p => p.id !== patientId));
    setSelectedPatient(null);
  };

  const filteredPatients = patients.filter(p => {
    if (filterStatus !== 'ALL' && p.status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.symptoms.toLowerCase().includes(q);
    }
    return true;
  });

  const waitingPatients = filteredPatients.filter(p => p.status === 'waiting');


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading treatment panel...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Stethoscope className="w-6 h-6 text-cyan-600" />
          Treatment & Processing
        </h1>
        <p className="text-sm text-slate-500 mt-1">Process waiting patients, assign doctors and beds, track treatment history</p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="card bg-cyan-50 border-cyan-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
            <Clock className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <p className="text-xs text-cyan-600 font-medium">Waiting</p>
            <p className="text-xl font-bold text-cyan-800">{waitingPatients.length}</p>
          </div>
        </div>
        <div className="card bg-emerald-50 border-emerald-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-emerald-600 font-medium">Completed Today</p>
            <p className="text-xl font-bold text-emerald-800">{treatedPatients.length}</p>
          </div>
        </div>
        <div className="card bg-amber-50 border-amber-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <User className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-amber-600 font-medium">Critical Waiting</p>
            <p className="text-xl font-bold text-amber-800">{waitingPatients.filter(p => p.severity === 'CRITICAL').length}</p>
          </div>
        </div>
        <div className="card bg-violet-50 border-violet-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
            <BedDouble className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <p className="text-xs text-violet-600 font-medium">Beds Available</p>
            <p className="text-xl font-bold text-violet-800">{hospitals.reduce((acc, h) => acc + h.availableBeds, 0)}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <label htmlFor="treatment-search" className="sr-only">Search patients</label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="treatment-search"
            name="search"
            type="text"
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-text placeholder:text-slate-400"
          />
        </div>
        <div className="relative">
          <label htmlFor="treatment-status" className="sr-only">Filter by status</label>
          <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <select
            id="treatment-status"
            name="status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="pl-8 pr-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="waiting">Waiting</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Waiting List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-600" />
            Waiting Patients ({waitingPatients.length})
          </h3>
          {waitingPatients.length === 0 ? (
            <div className="card text-center py-12 text-slate-400">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 text-emerald-400" />
              <p className="text-sm">All patients have been processed!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {waitingPatients.map((p) => (
                <div key={p.id} className={`card p-4 transition-all ${selectedPatient?.id === p.id ? 'ring-2 ring-cyan-500' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-slate-800">{p.name}</h4>
                        <SeverityBadge severity={p.severity} />
                        <span className="text-xs text-slate-400 font-mono">{p.id}</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">{p.symptoms}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {p.estimatedWait} min wait</span>
                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> Age {p.age}</span>
                        <span className="flex items-center gap-1">AI Score: <span className="font-semibold text-slate-700">{(p.aiScore * 100).toFixed(0)}%</span></span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedPatient(selectedPatient?.id === p.id ? null : p)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100 text-sm font-medium transition cursor-pointer"
                    >
                      {selectedPatient?.id === p.id ? 'Close' : 'Process'}
                    </button>
                  </div>

                  {/* Process panel */}
                  {selectedPatient?.id === p.id && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <h5 className="text-sm font-semibold text-slate-700 mb-3">Assign Treatment</h5>
                      <ProcessForm
                        patient={p}
                        hospitals={hospitals}
                        onTreat={handleTreat}
                        onCancel={() => setSelectedPatient(null)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Treatment History */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            Treatment History
          </h3>
          {treatedPatients.length === 0 ? (
            <div className="card text-center py-8 text-slate-400">
              <Stethoscope className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">No treatments completed yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {treatedPatients.slice().reverse().map((p, i) => (
                <div key={`${p.id}-${i}`} className="card p-3 border-l-4 border-l-emerald-500">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-sm text-slate-800">{p.name}</h4>
                    <SeverityBadge severity={p.severity} />
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{p.symptoms}</p>
                  <div className="space-y-1 text-xs text-slate-500">
                    <p className="flex items-center gap-1"><User className="w-3 h-3" /> {p.doctor}</p>
                    <p className="flex items-center gap-1"><BedDouble className="w-3 h-3" /> {p.bed} · {p.hospital}</p>
                    <p className="flex items-center gap-1"><Clock className="w-3 h-3" /> {p.treatedAt}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProcessForm({ patient, hospitals, onTreat, onCancel }) {
  const [doctor, setDoctor] = useState(DOCTORS[0]);
  const [bed, setBed] = useState('General Ward - Bed 1');
  const [hospital, setHospital] = useState(hospitals[0]?.name || 'General Hospital');
  const [notes, setNotes] = useState('');

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Assign Doctor</label>
          <select value={doctor} onChange={(e) => setDoctor(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer">
            {DOCTORS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Hospital</label>
          <select value={hospital} onChange={(e) => setHospital(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer">
            {hospitals.map(h => <option key={h.id} value={h.name}>{h.name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Bed Assignment</label>
        <select value={bed} onChange={(e) => setBed(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer">
          <option>General Ward - Bed 1</option>
          <option>General Ward - Bed 2</option>
          <option>General Ward - Bed 3</option>
          <option>ICU - Bed 1</option>
          <option>ICU - Bed 2</option>
          <option>Emergency Room</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Treatment Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-text placeholder:text-slate-400" placeholder="Enter treatment notes..." />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onTreat(patient.id, doctor, bed, hospital)}
          className="flex-1 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-medium text-sm transition cursor-pointer flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-4 h-4" /> Complete Treatment
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium text-sm transition cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
