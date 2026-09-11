import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getVisitRecords, createVisitRecord, getPatients, getDoctors, subscribeToRealtime, generateInvoiceFromVisit } from '../services/api';
import { generateInvoicePDF } from '../utils/invoicePDF';
import { ClipboardList, Calendar, Stethoscope, User, DollarSign, Plus, X, CheckCircle, AlertCircle, Loader2, RefreshCw, Link2, History, Receipt } from 'lucide-react';

const VISIT_TYPES = ['EMERGENCY', 'OUTPATIENT', 'INPATIENT', 'SURGERY', 'CONSULTATION', 'FOLLOW_UP', 'CHECKUP'];

export default function PatientHistory() {
  const { user } = useAuth();
  const isPatient = user?.role === 'PATIENT';
  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [generatingId, setGeneratingId] = useState(null);
  const [form, setForm] = useState({
    patientId: '', patientName: '', type: 'CONSULTATION', diagnosis: '',
    treatment: '', doctorName: '', hospitalName: '', medicationCost: '',
    procedureCost: '', bedCost: '', notes: ''
  });

  const fetchData = useCallback(async () => {
    try {
      const [recs, pts, docs] = await Promise.all([getVisitRecords(), getPatients(), getDoctors()]);
      let allRecords = Array.isArray(recs) ? recs : [];
      if (isPatient) {
        allRecords = allRecords.filter(r =>
          r.patientName?.toLowerCase() === user?.name?.toLowerCase()
        );
      }
      setRecords(allRecords);
      setPatients(Array.isArray(pts) ? pts : []);
      setDoctors(Array.isArray(docs) ? docs : []);
      setFeedback(null);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
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

  const handleRefresh = () => { setRefreshing(true); fetchData(); };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createVisitRecord({
        ...form,
        medicationCost: parseFloat(form.medicationCost || '0'),
        procedureCost: parseFloat(form.procedureCost || '0'),
        bedCost: parseFloat(form.bedCost || '0'),
      });
      setFeedback({ type: 'success', message: 'Visit record added successfully' });
      setShowModal(false);
      setForm({ patientId: '', patientName: '', type: 'CONSULTATION', diagnosis: '', treatment: '', doctorName: '', hospitalName: '', medicationCost: '', procedureCost: '', bedCost: '', notes: '' });
      await fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleGenerateInvoice = async (record) => {
    if (generatingId) return;
    setGeneratingId(record.id);
    try {
      const invoice = await generateInvoiceFromVisit(record.id);
      generateInvoicePDF(invoice);
      setFeedback({ type: 'success', message: `Invoice generated and PDF downloaded for ${record.patientName}` });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setGeneratingId(null);
    }
  };

  const handlePatientSelect = (e) => {
    const pid = e.target.value;
    const p = patients.find(pt => pt.id === pid);
    setSelectedPatient(pid);
    setForm(prev => ({ ...prev, patientId: pid, patientName: p ? p.name : '' }));
  };

  const filteredRecords = selectedPatient
    ? records.filter(r => r.patientId === selectedPatient)
    : records;

  const totalCost = filteredRecords.reduce((sum, r) => sum + (r.totalCost || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading patient history...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-600" />
            Patient Medical History (Linked List)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Doubly Linked List tracks chronological patient visits, treatments, and costs
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          {!isPatient && (
            <button onClick={() => setShowModal(true)} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-sm font-medium transition cursor-pointer flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add Record
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${feedback.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
          {feedback.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {feedback.message}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card bg-indigo-50 border-indigo-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs text-indigo-600 font-medium">Total Records</p>
            <p className="text-2xl font-bold text-indigo-800">{records.length}</p>
          </div>
        </div>
        <div className="card bg-emerald-50 border-emerald-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
            <User className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-emerald-600 font-medium">Patients</p>
            <p className="text-2xl font-bold text-emerald-800">{new Set(records.map(r => r.patientId)).size}</p>
          </div>
        </div>
        <div className="card bg-amber-50 border-amber-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-amber-600 font-medium">Emergency Visits</p>
            <p className="text-2xl font-bold text-amber-800">{records.filter(r => r.type === 'EMERGENCY').length}</p>
          </div>
        </div>
        <div className="card bg-blue-50 border-blue-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-blue-600 font-medium">Total Cost</p>
            <p className="text-2xl font-bold text-blue-800">${totalCost.toFixed(0)}</p>
          </div>
        </div>
      </div>

      {/* Data Structure Info */}
      <div className="card bg-slate-50 border-slate-200">
        <div className="flex items-center gap-2 mb-2">
          <Link2 className="w-4 h-4 text-slate-600" />
          <h3 className="font-bold text-slate-800 text-sm">Data Structure: Doubly Linked List</h3>
        </div>
        <p className="text-xs text-slate-500">
          Patient visit records are stored in a Doubly Linked List enabling O(1) insertion at tail, O(n) traversal, and bidirectional navigation.
          Each node contains a VisitRecord with patient info, diagnosis, treatment, and costs. Supports chronological queries, type filtering, and date-range extraction.
        </p>
      </div>

      {/* Filter */}
      {!isPatient && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500 font-medium">Filter by Patient:</span>
          <select
            value={selectedPatient}
            onChange={handlePatientSelect}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer max-w-xs"
          >
            <option value="">All Patients</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
          </select>
          <span className="text-sm text-slate-400 ml-auto">
            Showing {filteredRecords.length} of {records.length} records
          </span>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-4">
        {filteredRecords.length === 0 ? (
          <div className="card text-center py-12 text-slate-400">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-sm">No visit records found.</p>
          </div>
        ) : (
          filteredRecords.slice().reverse().map((record, index) => (
            <div key={record.id} className="card border-l-4 border-l-indigo-500 hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                      {filteredRecords.length - index}
                    </span>
                    <h3 className="font-semibold text-slate-800">{record.patientName}</h3>
                    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${
                      record.type === 'EMERGENCY' ? 'bg-red-100 text-red-700 border-red-200' :
                      record.type === 'SURGERY' ? 'bg-violet-100 text-violet-700 border-violet-200' :
                      record.type === 'INPATIENT' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                      'bg-emerald-100 text-emerald-700 border-emerald-200'
                    }`}>
                      {record.typeLabel || record.type}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600 mb-2">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{record.visitDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                      <span>{record.doctorName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{record.hospitalName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-800">${record.totalCost?.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs text-slate-500">
                    <p><span className="font-semibold text-slate-700">Diagnosis:</span> {record.diagnosis}</p>
                    <p><span className="font-semibold text-slate-700">Treatment:</span> {record.treatment}</p>
                    {record.notes && <p><span className="font-semibold text-slate-700">Notes:</span> {record.notes}</p>}
                  </div>
                  <div className="flex gap-3 mt-2 text-xs text-slate-400">
                    <span>Meds: ${record.medicationCost?.toFixed(2)}</span>
                    <span>Procedure: ${record.procedureCost?.toFixed(2)}</span>
                    <span>Bed: ${record.bedCost?.toFixed(2)}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleGenerateInvoice(record)}
                      disabled={generatingId === record.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 text-xs font-medium transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {generatingId === record.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Receipt className="w-3.5 h-3.5" />
                      )}
                      {generatingId === record.id ? 'Generating...' : 'Generate Invoice'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal — hidden for patients */}
      {showModal && !isPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">Add Visit Record</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Patient *</label>
                <select required value={form.patientId} onChange={handlePatientSelect} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
                  <option value="">Select patient</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Visit Type *</label>
                  <select required value={form.type} onChange={(e) => setForm({...form, type: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
                    {VISIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Doctor *</label>
                  <select required value={form.doctorName} onChange={(e) => setForm({...form, doctorName: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
                    <option value="">Select doctor</option>
                    {doctors.map(d => <option key={d.id} value={d.name}>{d.name} ({d.specialty})</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Hospital</label>
                <input value={form.hospitalName} onChange={(e) => setForm({...form, hospitalName: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Diagnosis</label>
                <input value={form.diagnosis} onChange={(e) => setForm({...form, diagnosis: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Treatment</label>
                <input value={form.treatment} onChange={(e) => setForm({...form, treatment: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Med Cost</label>
                  <input type="number" step="0.01" value={form.medicationCost} onChange={(e) => setForm({...form, medicationCost: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Proc Cost</label>
                  <input type="number" step="0.01" value={form.procedureCost} onChange={(e) => setForm({...form, procedureCost: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Bed Cost</label>
                  <input type="number" step="0.01" value={form.bedCost} onChange={(e) => setForm({...form, bedCost: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
                <textarea rows={2} value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-medium text-sm transition cursor-pointer">
                  Add Record
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium text-sm transition cursor-pointer">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
