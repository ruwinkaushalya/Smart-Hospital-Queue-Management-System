import { useState, useEffect, useCallback } from 'react';
import StatCard from '../components/StatCard';
import SeverityBadge from '../components/SeverityBadge';
import { getPatients, getQueueStatus, getMedications, getDoctors, processNextPatient, getReports, downloadReport } from '../services/api';
import useRealtimeData from '../hooks/useRealtimeData';
import {
  Stethoscope, Users, AlertTriangle, CheckCircle, Clock, Pill,
  Activity, Loader2, ArrowRight, Zap, HeartPulse, TrendingUp,
  FileText, Download, Eye, X
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DoctorDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [queueStats, setQueueStats] = useState({});
  const [medications, setMedications] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [processingId, setProcessingId] = useState(null);
  const [reports, setReports] = useState([]);
  const [viewingReport, setViewingReport] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [p, q, m, d] = await Promise.all([getPatients(), getQueueStatus(), getMedications(), getDoctors()]);
        if (!mounted) return;
        setPatients(p);
        setQueueStats(q);
        setMedications(m);
        setDoctors(d);
      } catch (err) {
        console.error('DoctorDashboard load error:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const load = useCallback(async () => {
    try {
      const [p, q, m, d, r] = await Promise.all([getPatients(), getQueueStatus(), getMedications(), getDoctors(), getReports()]);
      setPatients(p);
      setQueueStats(q);
      setMedications(m);
      setDoctors(d);
      setReports(r || []);
    } catch (err) {
      console.error('DoctorDashboard load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useRealtimeData(load, []);

  const handleProcessPatient = async (patientId) => {
    setProcessingId(patientId);
    try {
      await processNextPatient();
      await load();
    } catch {
      /* ignore */
    } finally {
      setProcessingId(null);
    }
  };

  const handleDownloadReport = async (report) => {
    try {
      const data = await downloadReport(report.id);
      const base64 = data.base64Content || '';
      // Robust base64 to Uint8Array that handles Unicode correctly
      const byteChars = atob(base64);
      const bytes = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        bytes[i] = byteChars.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: data.mimeType || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.fileName || 'report';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download report:', err);
    }
  };

  const waitingPatients = patients.filter(p => p.status === 'waiting').sort((a, b) => b.aiScore - a.aiScore);
  const completedToday = patients.filter(p => p.status === 'completed').length;
  const lowStockMeds = medications.filter(m => m.stockQuantity <= 10);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading doctor dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Stethoscope className="w-6 h-6 text-emerald-600" />
          Doctor Dashboard
        </h1>
        <p className="text-sm text-slate-500 mt-1">Patient queue, treatment priorities, medication status, and clinical overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Waiting Patients" value={waitingPatients.length} subtitle="Need attention" icon={Users} color="blue" />
        <StatCard title="Critical Cases" value={waitingPatients.filter(p => p.severity === 'CRITICAL').length} subtitle="Immediate attention required" icon={AlertTriangle} color="red" />
        <StatCard title="Treated Today" value={completedToday} subtitle="Completed consultations" icon={CheckCircle} color="green" trend={completedToday > 0 ? 100 : 0} />
        <StatCard title="Avg Wait Time" value={`${queueStats.avgWaitTime} min`} subtitle="Patient queue" icon={Clock} color="amber" />
        <StatCard title="On Duty Doctors" value={doctors.length} subtitle="Available for consults" icon={HeartPulse} color="pink" />
        <StatCard title="Low Stock Meds" value={lowStockMeds.length} subtitle="Need reordering" icon={Pill} color="orange" />
        <StatCard title="Throughput" value={`${queueStats.throughput}/hr`} subtitle="Processing rate" icon={TrendingUp} color="teal" />
        <StatCard title="Pending Beds" value={queueStats.pendingBeds || 0} subtitle="Awaiting admission" icon={Activity} color="purple" />
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Queue */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Patients Awaiting Treatment
              <span className="text-xs font-normal text-slate-400">— Sorted by AI priority score</span>
            </h3>
            <Link to="/treatment" className="text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1">
              Treatment Room <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                  <th className="pb-2 font-medium">Patient</th>
                  <th className="pb-2 font-medium">Severity</th>
                  <th className="pb-2 font-medium">Symptoms</th>
                  <th className="pb-2 font-medium">AI Score</th>
                  <th className="pb-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {waitingPatients.slice(0, 10).map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5">
                      <p className="font-medium text-slate-700">{p.name}</p>
                      <p className="text-xs text-slate-400">Age {p.age} · {p.id}</p>
                    </td>
                    <td className="py-2.5">
                      <SeverityBadge severity={p.severity} />
                    </td>
                    <td className="py-2.5 max-w-[160px]">
                      <p className="text-xs text-slate-500 truncate" title={p.symptoms}>{p.symptoms}</p>
                    </td>
                    <td className="py-2.5">
                      <span className={`text-xs font-bold ${p.aiScore > 0.8 ? 'text-red-600' : p.aiScore > 0.5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {(p.aiScore * 100).toFixed(0)}%
                      </span>
                      <div className="w-14 h-1.5 bg-slate-200 rounded-full mt-0.5">
                        <div
                          className={`h-full rounded-full ${p.aiScore > 0.8 ? 'bg-red-500' : p.aiScore > 0.5 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${p.aiScore * 100}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-2.5">
                      <button
                        onClick={() => handleProcessPatient(p.id)}
                        disabled={processingId === p.id}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-medium transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
                      >
                        {processingId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                        Treat
                      </button>
                    </td>
                  </tr>
                ))}
                {waitingPatients.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">
                      No patients waiting. All clear!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Low Stock Medications */}
          <div className="card">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Pill className="w-4 h-4 text-orange-500" />
              Low Stock Medications
              <span className="text-xs font-normal text-slate-400">— {lowStockMeds.length} items need reorder</span>
            </h3>
            {lowStockMeds.length > 0 ? (
              <div className="space-y-2">
                {lowStockMeds.slice(0, 6).map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-2.5 bg-orange-50 rounded-lg border border-orange-100">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{m.name}</p>
                      <p className="text-xs text-slate-400">{m.dosage} · {m.category}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      m.stockQuantity <= 5 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {m.stockQuantity} left
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">All medications adequately stocked.</p>
            )}
            <Link to="/pharmacy" className="block mt-3 text-xs text-cyan-600 hover:text-cyan-700 text-center">
              View Full Pharmacy →
            </Link>
          </div>

          {/* Doctor Availability */}
          <div className="card">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-emerald-500" />
              Doctors On Duty
              <span className="text-xs font-normal text-slate-400">— Currently available</span>
            </h3>
            <div className="space-y-2">
              {doctors.slice(0, 5).map((d) => (
                <div key={d.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-emerald-700">{d.name?.charAt(0) || 'D'}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{d.name}</p>
                      <p className="text-xs text-slate-400">{d.specialty || 'General'}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    d.available ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {d.available ? 'Available' : 'Busy'}
                  </span>
                </div>
              ))}
              {doctors.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">No doctors data available.</p>
              )}
            </div>
            <Link to="/doctors" className="block mt-3 text-xs text-cyan-600 hover:text-cyan-700 text-center">
              Manage Doctors →
            </Link>
          </div>

          {/* Patient Reports */}
          <div className="card">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-violet-500" />
              Patient Reports
              <span className="text-xs font-normal text-slate-400">— {reports.length} uploaded</span>
            </h3>
            {reports.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {reports.slice(0, 8).map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100 hover:border-violet-200 transition">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-violet-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-700 truncate" title={r.fileName}>{r.fileName}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">{r.patientName}</span>
                          <span className="text-xs text-slate-400">· {r.formattedSize}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        r.status === 'REVIEWED' ? 'bg-emerald-100 text-emerald-700' :
                        r.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {r.status}
                      </span>
                      <button
                        onClick={() => setViewingReport(r)}
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer transition"
                        title="View details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDownloadReport(r)}
                        className="p-1.5 rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100 cursor-pointer transition"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">No patient reports uploaded yet.</p>
            )}
            <Link to="/patient-history" className="block mt-3 text-xs text-cyan-600 hover:text-cyan-700 text-center">
              View Patient History →
            </Link>
          </div>
        </div>
      </div>

      {/* Report Viewer Modal */}
      {viewingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setViewingReport(null)}>
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-violet-600" />
                Report Details
              </h3>
              <button onClick={() => setViewingReport(null)} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-400">Patient</p>
                <p className="text-sm font-semibold text-slate-700">{viewingReport.patientName}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-400">File Name</p>
                <p className="text-sm font-semibold text-slate-700">{viewingReport.fileName}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs text-slate-400">Size</p>
                  <p className="text-sm font-semibold text-slate-700">{viewingReport.formattedSize}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs text-slate-400">Type</p>
                  <p className="text-sm font-semibold text-slate-700">{viewingReport.fileExtension || 'file'}</p>
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-400">Status</p>
                <p className="text-sm font-semibold text-slate-700">{viewingReport.status}</p>
              </div>
              {viewingReport.description && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs text-slate-400">Description</p>
                  <p className="text-sm text-slate-700">{viewingReport.description}</p>
                </div>
              )}
              <button
                onClick={() => { handleDownloadReport(viewingReport); setViewingReport(null); }}
                className="w-full py-2.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 font-medium text-sm transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Download File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
