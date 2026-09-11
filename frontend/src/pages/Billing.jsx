import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getInvoices, generateInvoice, generateInvoiceFromVisit, payInvoice, getRevenueAnalytics,
  getPatients, getDoctors, getHospitals, getVisitRecords, subscribeToRealtime
} from '../services/api';
import { generateInvoicePDF } from '../utils/invoicePDF';
import {
  Receipt, DollarSign, CheckCircle, AlertCircle, Plus, X, Loader2,
  RefreshCw, CreditCard, FileText,
  ArrowUpRight, ArrowDownRight, Clock, Link2, ClipboardList
} from 'lucide-react';

const INVOICE_TYPES = ['CONSULTATION', 'EMERGENCY', 'SURGERY', 'MEDICATION', 'BED_CHARGE', 'LAB_TEST', 'AMBULANCE', 'PACKAGE'];

const STATUS_COLORS = {
  PENDING: 'bg-amber-100 text-amber-700 border-amber-300',
  PAID: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  OVERDUE: 'bg-red-100 text-red-700 border-red-300',
  CANCELLED: 'bg-slate-100 text-slate-600 border-slate-300',
};

export default function Billing() {
  const { user } = useAuth();
  const isPatient = user?.role === 'PATIENT';
  const [invoices, setInvoices] = useState([]);
  const [revenue, setRevenue] = useState({});
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [form, setForm] = useState({
    patientId: '', patientName: '', type: 'CONSULTATION', baseAmount: '',
    description: '', hospitalName: '', doctorName: ''
  });
  const [visitRecords, setVisitRecords] = useState([]);
  const [modalTab, setModalTab] = useState('manual'); // 'manual' | 'from-visit'
  const [generatingFromVisit, setGeneratingFromVisit] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [inv, rev, pts, docs, hosps, visits] = await Promise.all([
        getInvoices(), getRevenueAnalytics(), getPatients(), getDoctors(), getHospitals(), getVisitRecords()
      ]);
      let allInvoices = Array.isArray(inv) ? inv : [];
      if (isPatient) {
        allInvoices = allInvoices.filter(i =>
          i.patientName?.toLowerCase() === user?.name?.toLowerCase()
        );
      }
      setInvoices(allInvoices);
      setRevenue(rev || {});
      setPatients(Array.isArray(pts) ? pts : []);
      setDoctors(Array.isArray(docs) ? docs : []);
      setHospitals(Array.isArray(hosps) ? hosps : []);
      setVisitRecords(Array.isArray(visits) ? visits : []);
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

  const handlePay = async (invoiceId) => {
    try {
      await payInvoice(invoiceId);
      setFeedback({ type: 'success', message: 'Invoice marked as paid' });
      await fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const invoice = await generateInvoice({
        ...form,
        baseAmount: parseFloat(form.baseAmount),
      });
      generateInvoicePDF(invoice);
      setFeedback({ type: 'success', message: 'Invoice generated and PDF downloaded' });
      setShowModal(false);
      setForm({ patientId: '', patientName: '', type: 'CONSULTATION', baseAmount: '', description: '', hospitalName: '', doctorName: '' });
      await fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handlePatientSelect = (e) => {
    const pid = e.target.value;
    const p = patients.find(pt => pt.id === pid);
    setForm(prev => ({ ...prev, patientId: pid, patientName: p ? p.name : '' }));
  };

  const handleGenerateFromVisit = async (visitId) => {
    if (generatingFromVisit) return;
    setGeneratingFromVisit(visitId);
    try {
      const invoice = await generateInvoiceFromVisit(visitId);
      generateInvoicePDF(invoice);
      setFeedback({ type: 'success', message: 'Invoice generated and PDF downloaded' });
      setShowModal(false);
      setModalTab('manual');
      await fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setGeneratingFromVisit(null);
    }
  };

  const filtered = useMemo(() => {
    if (filterStatus === 'All') return invoices;
    return invoices.filter(i => i.status === filterStatus);
  }, [invoices, filterStatus]);

  const pendingAmount = invoices.filter(i => i.status === 'PENDING').reduce((sum, i) => sum + (i.totalAmount || 0), 0);
  const paidAmount = invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + (i.totalAmount || 0), 0);
  const totalAmount = invoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading billing...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-teal-600" />
            Billing & Invoices
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Revenue tracking, invoice generation, and payment processing
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          {!isPatient && (
            <button onClick={() => setShowModal(true)} className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 text-sm font-medium transition cursor-pointer flex items-center gap-1">
              <Plus className="w-4 h-4" /> New Invoice
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

      {/* Revenue Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card bg-teal-50 border-teal-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <p className="text-xs text-teal-600 font-medium">Total Revenue</p>
            <p className="text-2xl font-bold text-teal-800">${totalAmount.toFixed(0)}</p>
          </div>
        </div>
        <div className="card bg-emerald-50 border-emerald-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-emerald-600 font-medium">Paid</p>
            <p className="text-2xl font-bold text-emerald-800">${paidAmount.toFixed(0)}</p>
          </div>
        </div>
        <div className="card bg-amber-50 border-amber-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-amber-600 font-medium">Pending</p>
            <p className="text-2xl font-bold text-amber-800">${pendingAmount.toFixed(0)}</p>
          </div>
        </div>
        <div className="card bg-blue-50 border-blue-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-blue-600 font-medium">Invoices</p>
            <p className="text-2xl font-bold text-blue-800">{invoices.length}</p>
          </div>
        </div>
      </div>

      {/* Revenue Breakdown — hidden for patients */}
      {!isPatient && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Invoices</p>
              <p className="text-xl font-bold text-slate-800">{revenue.totalInvoices || invoices.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-slate-500" />
            </div>
          </div>
          <div className="card flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Paid Invoices</p>
              <p className="text-xl font-bold text-emerald-700">{revenue.paidInvoices || invoices.filter(i => i.status === 'PAID').length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="card flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Pending Invoices</p>
              <p className="text-xl font-bold text-amber-700">{revenue.pendingInvoices || invoices.filter(i => i.status === 'PENDING').length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-500 font-medium">Filter:</span>
        {['All', 'PENDING', 'PAID', 'OVERDUE'].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer border ${
              filterStatus === s
                ? 'bg-teal-50 text-teal-700 border-teal-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {s}
          </button>
        ))}
        <span className="text-sm text-slate-400 ml-auto">
          Showing {filtered.length} of {invoices.length} invoices
        </span>
      </div>

      {/* Invoice Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Base</th>
                <th className="px-4 py-3">Tax</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs text-slate-500">{inv.invoiceNumber}</div>
                    <div className="text-xs text-slate-400">{inv.id}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-700">{inv.patientName}</div>
                    <div className="text-xs text-slate-400">{inv.hospitalName}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-md text-xs bg-slate-100 text-slate-700 border border-slate-200">
                      {inv.typeLabel || inv.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">${inv.baseAmount?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-600">${inv.tax?.toFixed(2)}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">${inv.totalAmount?.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${STATUS_COLORS[inv.status] || STATUS_COLORS.PENDING}`}>
                      {inv.statusLabel || inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {inv.status === 'PENDING' && (
                      <button
                        onClick={() => handlePay(inv.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-medium transition cursor-pointer flex items-center gap-1"
                      >
                        <CreditCard className="w-3 h-3" /> Pay
                      </button>
                    )}
                    {inv.status === 'PAID' && (
                      <span className="text-xs text-emerald-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Paid
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No invoices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal — hidden for patients */}
      {showModal && !isPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => { setShowModal(false); setModalTab('manual'); }}>
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">Generate New Invoice</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-2 mb-4 border-b border-slate-200">
              <button
                onClick={() => setModalTab('manual')}
                className={`px-4 py-2 text-sm font-medium transition cursor-pointer border-b-2 ${
                  modalTab === 'manual'
                    ? 'border-teal-500 text-teal-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <span className="flex items-center gap-1.5"><FileText className="w-4 h-4" /> Manual Entry</span>
              </button>
              <button
                onClick={() => setModalTab('from-visit')}
                className={`px-4 py-2 text-sm font-medium transition cursor-pointer border-b-2 ${
                  modalTab === 'from-visit'
                    ? 'border-teal-500 text-teal-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <span className="flex items-center gap-1.5"><Link2 className="w-4 h-4" /> From Visit Record</span>
              </button>
            </div>

            {modalTab === 'manual' ? (
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Patient *</label>
                  <select required value={form.patientId} onChange={handlePatientSelect} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer">
                    <option value="">Select patient</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Invoice Type *</label>
                    <select required value={form.type} onChange={(e) => setForm({...form, type: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer">
                      {INVOICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Base Amount *</label>
                    <input required type="number" step="0.01" value={form.baseAmount} onChange={(e) => setForm({...form, baseAmount: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Doctor</label>
                    <select value={form.doctorName} onChange={(e) => setForm({...form, doctorName: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer">
                      <option value="">Select doctor</option>
                      {doctors.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Hospital</label>
                    <select value={form.hospitalName} onChange={(e) => setForm({...form, hospitalName: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer">
                      <option value="">Select hospital</option>
                      {hospitals.map(h => <option key={h.id} value={h.name}>{h.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                  <textarea rows={2} value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 py-2.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 font-medium text-sm transition cursor-pointer">
                    Generate Invoice
                  </button>
                  <button type="button" onClick={() => { setShowModal(false); setModalTab('manual'); }} className="px-4 py-2.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium text-sm transition cursor-pointer">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">
                  Select a visit record to auto-generate an invoice. The invoice will be pre-filled with the visit's patient, doctor, hospital, and cost data.
                </p>
                <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                  {visitRecords.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <ClipboardList className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-sm">No visit records found.</p>
                    </div>
                  ) : (
                    visitRecords.slice().reverse().map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-800 truncate">{record.patientName}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                              record.type === 'EMERGENCY' ? 'bg-red-100 text-red-700 border-red-200' :
                              record.type === 'SURGERY' ? 'bg-violet-100 text-violet-700 border-violet-200' :
                              record.type === 'INPATIENT' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                              'bg-emerald-100 text-emerald-700 border-emerald-200'
                            }`}>
                              {record.typeLabel || record.type}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {record.doctorName} @ {record.hospitalName} · ${record.totalCost?.toFixed(2)}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 truncate">
                            {record.diagnosis}
                          </div>
                        </div>
                        <button
                          onClick={() => handleGenerateFromVisit(record.id)}
                          disabled={generatingFromVisit === record.id}
                          className="ml-3 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 text-xs font-medium transition cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {generatingFromVisit === record.id ? (
                            <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Generating...</span>
                          ) : 'Generate'}
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => { setShowModal(false); setModalTab('manual'); }} className="px-4 py-2.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium text-sm transition cursor-pointer">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
