import { useState, useEffect, useCallback } from 'react';
import { getHospitals, getRoads, getAmbulances } from '../services/api';
import HospitalScene3D from '../components/HospitalScene3D';
import { MapPin, Hospital, Truck, Activity, Navigation, Loader2, Crosshair, RotateCcw } from 'lucide-react';

export default function MapView() {
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [selectedAmbulance, setSelectedAmbulance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hospitals, setHospitals] = useState([]);
  const [roads, setRoads] = useState([]);
  const [ambulances, setAmbulances] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [h, r, a] = await Promise.all([getHospitals(), getRoads(), getAmbulances()]);
        if (!mounted) return;
        setHospitals(h);
        setRoads(r);
        setAmbulances(a);
      } catch (err) {
        console.error('MapView load error:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const handleHospitalClick = useCallback((h) => {
    setSelectedHospital(prev => prev?.id === h.id ? null : h);
    setSelectedAmbulance(null);
  }, []);

  const handleAmbulanceClick = useCallback((a) => {
    setSelectedAmbulance(prev => prev?.id === a.id ? null : a);
    setSelectedHospital(null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedHospital(null);
    setSelectedAmbulance(null);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading 3D map view...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-cyan-600" />
            3D Hospital Network Map
          </h1>
          <p className="text-sm text-slate-500 mt-1">Interactive 3D dispatch simulation with real-time ambulance tracking</p>
        </div>
        <button
          onClick={clearSelection}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 text-sm transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" /> Reset View
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 3D Map */}
        <div className="lg:col-span-3 card p-0 overflow-hidden border border-slate-200 bg-slate-900">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-cyan-400" />
              3D Dispatch Simulation
            </h3>
            <div className="flex items-center gap-4 text-xs text-slate-300">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" /> Emergency Hospital</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]" /> General Hospital</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" /> Available Ambulance</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" /> Active Ambulance</span>
            </div>
          </div>

          <div className="relative aspect-[16/9] overflow-hidden">
            <HospitalScene3D
              hospitals={hospitals}
              roads={roads}
              ambulances={ambulances}
              selectedHospital={selectedHospital}
              selectedAmbulance={selectedAmbulance}
              onHospitalClick={handleHospitalClick}
              onAmbulanceClick={handleAmbulanceClick}
              cameraTarget={selectedHospital || selectedAmbulance}
            />

            {/* Overlay controls */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
              <div className="pointer-events-auto bg-black/60 backdrop-blur-md rounded-lg px-3 py-2 text-xs text-gray-300 border border-gray-700">
                <p className="flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                  Drag to rotate · Scroll to zoom · Right-click to pan
                </p>
              </div>
              <div className="pointer-events-auto bg-black/60 backdrop-blur-md rounded-lg px-3 py-2 text-xs text-gray-300 border border-gray-700">
                <p className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  {hospitals.length} Hospitals · {ambulances.length} Ambulances · {roads.length} Roads
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <div className="space-y-4">
          {selectedHospital ? (
            <div className="card border border-slate-200 border-l-4 border-l-cyan-500">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                  <Hospital className="w-4 h-4 text-cyan-600" />
                </div>
                <h3 className="font-bold text-slate-800">{selectedHospital.name}</h3>
              </div>
              <div className="space-y-2 text-sm">
                <InfoRow label="ID" value={selectedHospital.id} />
                <InfoRow label="Address" value={selectedHospital.address} />
                <InfoRow label="Beds" value={`${selectedHospital.availableBeds} / ${selectedHospital.totalBeds}`} />
                <InfoRow label="ICU" value={`${selectedHospital.availableICU} / ${selectedHospital.totalICU}`} />
                <InfoRow label="Doctors" value={`${selectedHospital.availableDoctors} / ${selectedHospital.doctors}`} />
                <InfoRow label="Emergency Unit" value={selectedHospital.hasEmergency ? 'Yes' : 'No'} />
                <InfoRow label="Load" value={`${(selectedHospital.loadFactor * 100).toFixed(0)}%`} />
              </div>
              <button onClick={() => setSelectedHospital(null)} className="mt-3 text-xs text-slate-500 hover:text-slate-700 cursor-pointer transition-colors">Clear selection</button>
            </div>
          ) : (
            <div className="card text-center py-8 text-slate-400 border border-slate-200 bg-slate-50">
              <Hospital className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              <p className="text-sm">Click a 3D hospital building to view details</p>
            </div>
          )}

          {selectedAmbulance ? (
            <div className="card border border-slate-200 border-l-4 border-l-emerald-500">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Truck className="w-4 h-4 text-emerald-600" />
                </div>
                <h3 className="font-bold text-slate-800">Ambulance {selectedAmbulance.id}</h3>
              </div>
              <div className="space-y-2 text-sm">
                <InfoRow label="Driver" value={selectedAmbulance.driver} />
                <InfoRow label="Status" value={selectedAmbulance.status} />
                <InfoRow label="Contact" value={selectedAmbulance.contact} />
                <InfoRow label="Patient" value={selectedAmbulance.patient || 'None'} />
                <InfoRow label="Destination" value={selectedAmbulance.destination || 'None'} />
                <InfoRow label="Distance" value={selectedAmbulance.distance > 0 ? `${selectedAmbulance.distance} km` : '-'} />
                <InfoRow label="ETA" value={selectedAmbulance.eta > 0 ? `${selectedAmbulance.eta} min` : '-'} />
              </div>
              <button onClick={() => setSelectedAmbulance(null)} className="mt-3 text-xs text-slate-500 hover:text-slate-700 cursor-pointer transition-colors">Clear selection</button>
            </div>
          ) : (
            <div className="card text-center py-8 text-slate-400 border border-slate-200 bg-slate-50">
              <Truck className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              <p className="text-sm">Click a 3D ambulance on the map to view details</p>
            </div>
          )}

          <div className="card border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-600" />
              Network Legend
            </h3>
            <div className="space-y-2 text-xs text-slate-500">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500" /> Emergency Hospital</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-cyan-500" /> General Hospital</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500" /> Available Ambulance</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500" /> Active Ambulance</div>
              <div className="flex items-center gap-2"><span className="w-8 h-0.5 bg-cyan-400" /> Road Connection</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800 text-right">{value}</span>
    </div>
  );
}
