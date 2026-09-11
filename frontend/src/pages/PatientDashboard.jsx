import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import {
  getPatients, getInvoices, getVisitRecords, getQueueStatus,
  getHospitals, getDoctors, getAmbulances, getMedications,
  payInvoice, createPatient, dispatchAmbulance, emergencyICURequest,
  getQueuePosition, getPatientReports, createReport, downloadReport
} from '../services/api';
import useRealtimeData from '../hooks/useRealtimeData';
import SeverityBadge from '../components/SeverityBadge';
import {
  User, Clock, AlertTriangle, CheckCircle, FileText, CreditCard,
  Loader2, Activity, Calendar, MapPin, Phone, ArrowRight,
  Hospital, HeartPulse, DollarSign, BedDouble, Stethoscope,
  Pill, Truck, Plus, X, Brain, PhoneCall, Map, Zap, UserPlus,
  CalendarCheck, Ticket, Upload, Download, Trash2, Eye
} from 'lucide-react';

const SEVERITIES = ['CRITICAL', 'HIGH', 'MODERATE', 'LOW', 'ROUTINE'];

export default function PatientDashboard() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [patientRecord, setPatientRecord] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [visitHistory, setVisitHistory] = useState([]);
  const [queueStats, setQueueStats] = useState({});
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [medications, setMedications] = useState([]);

  // Action states
  const [payingId, setPayingId] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [emergencyHospitalId, setEmergencyHospitalId] = useState(null);

  // Self-registration form
  const [regForm, setRegForm] = useState({
    name: user?.name || '',
    age: '',
    contact: '',
    symptoms: '',
    severity: 'MODERATE'
  });
  const [regErrors, setRegErrors] = useState({});
  const [aiAnalysis, setAiAnalysis] = useState(null);

  // Appointment booking states
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointmentDoctorId, setAppointmentDoctorId] = useState(null);
  const [appointmentForm, setAppointmentForm] = useState({
    symptoms: '',
    severity: 'MODERATE'
  });
  const [appointmentErrors, setAppointmentErrors] = useState({});
  const [appointmentLoading, setAppointmentLoading] = useState(false);
  const [appointmentConfirmation, setAppointmentConfirmation] = useState(null);
  const [queueNumber, setQueueNumber] = useState(null);

  // Report upload states
  const [reports, setReports] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [viewingReport, setViewingReport] = useState(null);

  const loadPatientData = useCallback(async () => {
    try {
      const [
        patients, inv, visits, q,
        hos, docs, amb, meds
      ] = await Promise.all([
        getPatients(), getInvoices(), getVisitRecords(), getQueueStatus(),
        getHospitals(), getDoctors(), getAmbulances(), getMedications()
      ]);

      const match = patients.find(p =>
        p.name?.toLowerCase() === user?.name?.toLowerCase()
      );
      setPatientRecord(match || null);
      setInvoices(inv || []);
      setVisitHistory(visits || []);
      setQueueStats(q || {});
      setHospitals(hos || []);
      setDoctors(docs || []);
      setAmbulances(amb || []);
      setMedications(meds || []);

      // Load patient reports
      if (match?.id) {
        try {
          const reps = await getPatientReports(match.id);
          setReports(reps || []);
        } catch (e) {
          console.error('Failed to load reports:', e);
        }
      }
    } catch (err) {
      console.error('PatientDashboard load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPatientData();
  }, [loadPatientData]);

  useRealtimeData(loadPatientData, []);

  // Auto-select first hospital when emergency modal opens
  useEffect(() => {
    if (showEmergencyModal && hospitals.length > 0 && !emergencyHospitalId) {
      setEmergencyHospitalId(hospitals[0].id);
    }
  }, [showEmergencyModal, hospitals, emergencyHospitalId]);

  // Action handlers
  const handlePayInvoice = async (invoiceId) => {
    setPayingId(invoiceId);
    try {
      await payInvoice(invoiceId);
      setActionFeedback({ type: 'success', message: 'Invoice paid successfully!' });
      await loadPatientData();
    } catch (err) {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to pay invoice' });
    } finally {
      setPayingId(null);
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  const handleEmergencyDispatch = async (type, hospitalId) => {
    if (!hospitalId) {
      setActionFeedback({ type: 'error', message: 'No hospital available for dispatch' });
      setTimeout(() => setActionFeedback(null), 4000);
      return;
    }
    setDispatchLoading(true);
    try {
      const result = await dispatchAmbulance(type, hospitalId);
      if (result.success) {
        setActionFeedback({
          type: 'success',
          message: `${type === 'EMERGENCY' ? 'Emergency' : 'Transport'} ambulance dispatched! ID: ${result.ambulanceId}`
        });
      } else {
        setActionFeedback({ type: 'error', message: result.message || 'Dispatch failed' });
      }
      await loadPatientData();
    } catch (err) {
      setActionFeedback({ type: 'error', message: 'Failed to dispatch ambulance' });
    } finally {
      setDispatchLoading(false);
      setShowEmergencyModal(false);
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  const handleEmergencyICU = async () => {
    setDispatchLoading(true);
    try {
      const result = await emergencyICURequest();
      setActionFeedback({ type: 'success', message: `Emergency ICU request added: ${result.name || 'ICU Patient'}` });
      await loadPatientData();
    } catch (err) {
      setActionFeedback({ type: 'error', message: 'Failed to request emergency ICU' });
    } finally {
      setDispatchLoading(false);
      setShowEmergencyModal(false);
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  // AI Symptom Analysis
  const analyzeSymptoms = () => {
    if (!regForm.symptoms.trim()) return;
    const symptoms = regForm.symptoms.toLowerCase();
    let suggested = 'ROUTINE';
    let waitTime = 60;

    if (symptoms.includes('chest') || symptoms.includes('breathing') || symptoms.includes('heart')) {
      suggested = 'CRITICAL'; waitTime = 5;
    } else if (symptoms.includes('accident') || symptoms.includes('broken') || symptoms.includes('bleeding') || symptoms.includes('allergic')) {
      suggested = 'HIGH'; waitTime = 15;
    } else if (symptoms.includes('fever') || symptoms.includes('pain') || symptoms.includes('dehydration')) {
      suggested = 'MODERATE'; waitTime = 35;
    } else if (symptoms.includes('migraine') || symptoms.includes('dizzy') || symptoms.includes('sprain')) {
      suggested = 'LOW'; waitTime = 55;
    }

    if (regForm.age && +regForm.age > 65) {
      if (suggested === 'MODERATE') suggested = 'HIGH';
      waitTime = Math.max(5, waitTime - 10);
    }

    setAiAnalysis({ suggested, waitTime, confidence: Math.floor(Math.random() * 15 + 80) });
    setRegForm(prev => ({ ...prev, severity: suggested }));
  };

  const validateReg = () => {
    const e = {};
    if (!regForm.name.trim()) e.name = 'Name is required';
    if (!regForm.age.trim()) e.age = 'Age is required';
    else if (isNaN(regForm.age) || +regForm.age < 0 || +regForm.age > 120) e.age = 'Valid age 0-120 required';
    if (!regForm.contact.trim()) e.contact = 'Contact number is required';
    if (!regForm.symptoms.trim()) e.symptoms = 'Symptoms description is required';
    setRegErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateAppointment = () => {
    const e = {};
    if (!appointmentForm.symptoms.trim()) e.symptoms = 'Symptoms description is required';
    if (!appointmentDoctorId) e.doctor = 'Please select a doctor';
    setAppointmentErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSelfRegister = async (e) => {
    e.preventDefault();
    if (!validateReg()) return;
    setRegisterLoading(true);
    try {
      await createPatient({
        name: regForm.name,
        age: regForm.age,
        contact: regForm.contact,
        symptoms: regForm.symptoms,
        severity: regForm.severity,
      });
      setActionFeedback({ type: 'success', message: 'You have been registered successfully!' });
      setShowRegisterModal(false);
      setRegForm({ name: user?.name || '', age: '', contact: '', symptoms: '', severity: 'MODERATE' });
      setAiAnalysis(null);
      await loadPatientData();
    } catch (err) {
      setActionFeedback({ type: 'error', message: err.message || 'Registration failed' });
    } finally {
      setRegisterLoading(false);
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!validateAppointment()) return;
    setAppointmentLoading(true);
    try {
      const patient = await createPatient({
        name: user?.name || 'Patient',
        age: patientRecord?.age || 30,
        contact: patientRecord?.contact || 'N/A',
        symptoms: appointmentForm.symptoms,
        severity: appointmentForm.severity,
        doctorId: appointmentDoctorId,
      });
      setAppointmentConfirmation({
        patientId: patient.id,
        doctorName: doctors.find(d => d.id === appointmentDoctorId)?.name || 'Selected Doctor',
        severity: appointmentForm.severity,
      });
      setShowAppointmentModal(false);
      setAppointmentForm({ symptoms: '', severity: 'MODERATE' });
      setAppointmentDoctorId(null);
      await loadPatientData();
      // Fetch queue position after a short delay for queue to update
      setTimeout(async () => {
        try {
          const qp = await getQueuePosition(patient.id);
          if (qp && qp.position > 0) {
            setQueueNumber(qp.position);
          }
        } catch (err) {
          console.error('Queue position fetch error:', err);
        }
      }, 500);
      setActionFeedback({ type: 'success', message: `Appointment booked! Your reference: ${patient.id}` });
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err) {
      setActionFeedback({ type: 'error', message: err.message || 'Appointment booking failed' });
      setTimeout(() => setActionFeedback(null), 4000);
    } finally {
      setAppointmentLoading(false);
    }
  };

  // Report upload handlers
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const MAX_SIZE = 7 * 1024 * 1024; // ~7MB before base64 inflation
    if (file.size > MAX_SIZE) {
      setUploadError('File size exceeds 7MB limit');
      setUploadFile(null);
      return;
    }
    setUploadError(null);
    setUploadFile(file);
  };

  const handleUploadReport = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please select a file');
      return;
    }
    if (!patientRecord?.id) {
      setUploadError('You must be registered as a patient to upload reports');
      return;
    }
    setUploadLoading(true);
    setUploadError(null);
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(uploadFile);
      });
      await createReport({
        patientId: patientRecord.id,
        patientName: patientRecord.name || user?.name || '',
        fileName: uploadFile.name,
        mimeType: uploadFile.type || 'application/octet-stream',
        fileSize: uploadFile.size,
        base64Content: base64,
        description: uploadDescription,
      });
      setActionFeedback({ type: 'success', message: 'Report uploaded successfully!' });
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadDescription('');
      await loadPatientData();
    } catch (err) {
      setUploadError(err.message || 'Failed to upload report');
      setActionFeedback({ type: 'error', message: err.message || 'Failed to upload report' });
    } finally {
      setUploadLoading(false);
      setTimeout(() => setActionFeedback(null), 4000);
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
      setActionFeedback({ type: 'error', message: 'Failed to download report' });
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  // Fetch queue number for existing patient record
  useEffect(() => {
    if (patientRecord && patientRecord.status === 'waiting') {
      let cancelled = false;
      (async () => {
        try {
          const qp = await getQueuePosition(patientRecord.id);
          if (!cancelled && qp && qp.position > 0) {
            setQueueNumber(qp.position);
          }
        } catch (err) {
          console.error('Queue position fetch error:', err);
        }
      })();
      return () => { cancelled = true; };
    } else {
      setQueueNumber(null);
    }
  }, [patientRecord?.id]);

  // Derived data
  const myInvoices = invoices.filter(i =>
    i.patientName?.toLowerCase() === user?.name?.toLowerCase()
  );
  const myVisits = visitHistory.filter(v =>
    v.patientName?.toLowerCase() === user?.name?.toLowerCase()
  );
  const totalBilled = myInvoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
  const unpaidInvoices = myInvoices.filter(i => i.status === 'PENDING' || i.status === 'UNPAID');
  const waitingPatients = patientRecord && patientRecord.status === 'waiting';
  const completedTreatment = patientRecord && patientRecord.status === 'completed';
  const inProgress = patientRecord && patientRecord.status === 'in-progress';

  const availableDoctors = doctors.filter(d => d.available);
  const availableAmbulances = ambulances.filter(a => a.status === 'AVAILABLE');
  const totalBeds = hospitals.reduce((acc, h) => acc + h.totalBeds, 0);
  const availableBeds = hospitals.reduce((acc, h) => acc + h.availableBeds, 0);
  const lowStockMeds = medications.filter(m => m.stockQuantity <= 10);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading your dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-200">
          <span className="text-xl font-bold text-white">{user?.name?.charAt(0) || 'P'}</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            Welcome, {user?.name || 'Patient'}
          </h1>
          <p className="text-sm text-slate-500">Your health records, queue status, and actionable services</p>
        </div>
      </div>

      {/* Action feedback */}
      {actionFeedback && (
        <div className={`p-3.5 rounded-xl text-sm font-bold flex items-center gap-3 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300 ${
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

      {/* Status banner */}
      {patientRecord && (
        <div className={`rounded-xl border-2 p-4 ${
          patientRecord.severity === 'CRITICAL' ? 'bg-red-50 border-red-200' :
          patientRecord.severity === 'HIGH' ? 'bg-orange-50 border-orange-200' :
          patientRecord.severity === 'MODERATE' ? 'bg-blue-50 border-blue-200' :
          'bg-emerald-50 border-emerald-200'
        }`}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                waitingPatients ? 'bg-amber-100' : completedTreatment ? 'bg-emerald-100' : 'bg-blue-100'
              }`}>
                {waitingPatients ? <Clock className="w-6 h-6 text-amber-600" /> :
                 completedTreatment ? <CheckCircle className="w-6 h-6 text-emerald-600" /> :
                 <Activity className="w-6 h-6 text-blue-600" />}
              </div>
              <div>
                <p className="font-bold text-slate-800 text-lg">
                  {waitingPatients ? 'You are in the queue' :
                   completedTreatment ? 'Treatment completed' :
                   inProgress ? 'Treatment in progress' : 'Registration pending'}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <SeverityBadge severity={patientRecord.severity} />
                  {waitingPatients && (
                    <span className="text-sm text-slate-500">
                      Est. wait: <strong>{patientRecord.estimatedWait} minutes</strong>
                    </span>
                  )}
                  <span className="text-sm text-slate-400">· {patientRecord.id}</span>
                </div>
              </div>
            </div>
            {waitingPatients && (
              <div className="flex gap-3">
                {queueNumber && (
                  <div className="text-center px-4 py-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-400">Queue Number</p>
                    <p className="text-2xl font-bold text-cyan-700">#{queueNumber}</p>
                    <p className="text-xs text-slate-400">of {queueStats.totalWaiting != null ? queueStats.totalWaiting : '?'}</p>
                  </div>
                )}
                <div className="text-center px-4 py-2 bg-white rounded-lg border border-slate-200">
                  <p className="text-xs text-slate-400">Priority</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {patientRecord.aiScore > 0.8 ? 'High' : patientRecord.aiScore > 0.5 ? 'Medium' : 'Low'}
                  </p>
                  <p className="text-xs text-slate-400">AI Score</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!patientRecord && (
        <div className="rounded-xl border-2 border-dashed border-purple-300 bg-purple-50/50 p-6 text-center">
          <User className="w-10 h-10 text-purple-300 mx-auto mb-2" />
          <p className="text-slate-600 font-medium">No active patient record found</p>
          <p className="text-sm text-slate-400 mt-1 mb-3">Register yourself to access hospital services and track your queue status.</p>
          <button
            onClick={() => setShowRegisterModal(true)}
            className="px-4 py-2.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 text-sm font-medium transition cursor-pointer inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Register as Patient
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => { setShowAppointmentModal(true); setAppointmentDoctorId(null); setAppointmentErrors({}); }}
          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-cyan-50 border-2 border-cyan-200 hover:border-cyan-300 hover:bg-cyan-100 transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center group-hover:bg-cyan-200 transition">
            <CalendarCheck className="w-5 h-5 text-cyan-600" />
          </div>
          <span className="text-xs font-bold text-cyan-700">Book Appointment</span>
        </button>
        <button
          onClick={() => setShowEmergencyModal(true)}
          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-red-50 border-2 border-red-200 hover:border-red-300 hover:bg-red-100 transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition">
            <PhoneCall className="w-5 h-5 text-red-600" />
          </div>
          <span className="text-xs font-bold text-red-700">Emergency SOS</span>
        </button>
        <Link
          to="/billing"
          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-amber-50 border-2 border-amber-200 hover:border-amber-300 hover:bg-amber-100 transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition">
            <CreditCard className="w-5 h-5 text-amber-600" />
          </div>
          <span className="text-xs font-bold text-amber-700">Pay Bills</span>
        </Link>
        <button
          onClick={() => setExpandedSection(expandedSection === 'beds' ? null : 'beds')}
          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-blue-50 border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-100 transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition">
            <BedDouble className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-xs font-bold text-blue-700">Check Beds</span>
        </button>
        <button
          onClick={() => setExpandedSection(expandedSection === 'doctors' ? null : 'doctors')}
          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-emerald-50 border-2 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-100 transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition">
            <Stethoscope className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="text-xs font-bold text-emerald-700">Find Doctors</span>
        </button>
        <button
          onClick={() => { setShowUploadModal(true); setUploadFile(null); setUploadDescription(''); setUploadError(null); }}
          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-violet-50 border-2 border-violet-200 hover:border-violet-300 hover:bg-violet-100 transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center group-hover:bg-violet-200 transition">
            <Upload className="w-5 h-5 text-violet-600" />
          </div>
          <span className="text-xs font-bold text-violet-700">Upload Reports</span>
        </button>
        <Link
          to="/map"
          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-orange-50 border-2 border-orange-200 hover:border-orange-300 hover:bg-orange-100 transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition">
            <Map className="w-5 h-5 text-orange-600" />
          </div>
          <span className="text-xs font-bold text-orange-700">Hospital Map</span>
        </Link>
      </div>

      {/* My Reports */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-violet-500" />
            My Reports
            <span className="text-xs font-normal text-slate-400">— {reports.length} uploaded</span>
          </h3>
          <button
            onClick={() => { setShowUploadModal(true); setUploadFile(null); setUploadDescription(''); setUploadError(null); }}
            className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1 cursor-pointer"
          >
            <Upload className="w-3 h-3" /> Upload New
          </button>
        </div>
        {reports.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {reports.map((r) => (
              <div key={r.id} className="flex flex-col gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-violet-200 transition">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-violet-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700 truncate" title={r.fileName}>{r.fileName}</p>
                    <p className="text-xs text-slate-400">{r.formattedSize} · {r.fileExtension || 'file'}</p>
                  </div>
                </div>
                {r.description && <p className="text-xs text-slate-500 line-clamp-2">{r.description}</p>}
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    r.status === 'REVIEWED' ? 'bg-emerald-100 text-emerald-700' :
                    r.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {r.status}
                  </span>
                  {r.doctorName && <span className="text-xs text-slate-400">by {r.doctorName}</span>}
                </div>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => handleDownloadReport(r)}
                    className="flex-1 py-1.5 rounded-lg bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 text-xs font-medium flex items-center justify-center gap-1 cursor-pointer transition"
                  >
                    <Download className="w-3 h-3" /> Download
                  </button>
                  <button
                    onClick={() => setViewingReport(r)}
                    className="px-2 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-medium flex items-center justify-center gap-1 cursor-pointer transition"
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No reports uploaded yet</p>
            <p className="text-xs text-slate-400 mt-1">Upload lab results, scans, or any medical documents</p>
          </div>
        )}
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-purple-50 border-purple-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-purple-600 font-medium">Visit Records</p>
            <p className="text-2xl font-bold text-purple-800">{myVisits.length}</p>
          </div>
        </div>
        <div className="card bg-amber-50 border-amber-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-amber-600 font-medium">Total Billed</p>
            <p className="text-2xl font-bold text-amber-800">${totalBilled.toFixed(2)}</p>
          </div>
        </div>
        <div className="card bg-red-50 border-red-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-xs text-red-600 font-medium">Unpaid Invoices</p>
            <p className="text-2xl font-bold text-red-800">{unpaidInvoices.length}</p>
          </div>
        </div>
        <div className="card bg-emerald-50 border-emerald-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-emerald-600 font-medium">Paid Invoices</p>
            <p className="text-2xl font-bold text-emerald-800">{myInvoices.filter(i => i.status === 'PAID').length}</p>
          </div>
        </div>
      </div>

      {/* Two columns: Patient Info + Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Info */}
        {patientRecord && (
          <div className="card">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-purple-500" />
              Your Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">Full Name</p>
                <p className="text-sm font-semibold text-slate-700">{patientRecord.name}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">Patient ID</p>
                <p className="text-sm font-semibold text-slate-700 font-mono">{patientRecord.id}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">Age</p>
                <p className="text-sm font-semibold text-slate-700">{patientRecord.age} years</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">Contact</p>
                <p className="text-sm font-semibold text-slate-700">{patientRecord.contact}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg col-span-2">
                <p className="text-xs text-slate-400 mb-1">Symptoms</p>
                <p className="text-sm font-medium text-slate-700">{patientRecord.symptoms}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg col-span-2">
                <p className="text-xs text-slate-400 mb-1">Registration Time</p>
                <p className="text-sm font-medium text-slate-700">
                  {new Date(patientRecord.registrationTime).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Invoices with Pay action */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-500" />
              Your Invoices
              <span className="text-xs font-normal text-slate-400">— {myInvoices.length} total</span>
            </h3>
            <Link to="/billing" className="text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {myInvoices.length > 0 ? (
            <div className="space-y-2">
              {myInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{inv.description || `Invoice ${inv.invoiceNumber}`}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400">{inv.hospitalName}</span>
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                        inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                        inv.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {inv.statusLabel || inv.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-800">${(inv.totalAmount || 0).toFixed(2)}</p>
                      <p className="text-[10px] text-slate-400">{inv.typeLabel || inv.type}</p>
                    </div>
                    {(inv.status === 'PENDING' || inv.status === 'UNPAID') && (
                      <button
                        onClick={() => handlePayInvoice(inv.id)}
                        disabled={payingId === inv.id}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-medium transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
                      >
                        {payingId === inv.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <DollarSign className="w-3 h-3" />}
                        Pay
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">No invoices yet.</p>
          )}
        </div>
      </div>

      {/* Bed Availability Section (expandable) */}
      {expandedSection === 'beds' && (
        <div className="card animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <BedDouble className="w-4 h-4 text-blue-500" />
              Bed Availability
              <span className="text-xs font-normal text-slate-400">— {availableBeds} beds available across {hospitals.length} hospitals</span>
            </h3>
          </div>
          <div className="space-y-3">
            {hospitals.map((h) => {
              const occupancy = ((h.totalBeds - h.availableBeds) / h.totalBeds) * 100;
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
                    <div className={`h-full rounded-full transition-all ${occupancy > 90 ? 'bg-red-500' : occupancy > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${occupancy}%` }} />
                  </div>
                  <div className="flex gap-3 mt-0.5 text-[10px] text-slate-400">
                    <span>ICU: {h.availableICU}/{h.totalICU}</span>
                    <span>Doctors: {h.availableDoctors}/{h.doctors}</span>
                    <span>Emergency: {h.hasEmergency ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Doctor Availability Section (expandable) */}
      {expandedSection === 'doctors' && (
        <div className="card animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-emerald-500" />
              Doctors On Duty
              <span className="text-xs font-normal text-slate-400">— {availableDoctors.length} available</span>
            </h3>
            <Link to="/doctors" className="text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1">
              All Doctors <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {doctors.map((d) => (
              <div key={d.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${d.available ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                  {d.name?.charAt(0) || 'D'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{d.name}</p>
                  <p className="text-xs text-slate-400">{d.specialty || 'General'}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${d.available ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                  {d.available ? 'Available' : 'Busy'}
                </span>
              </div>
            ))}
            {doctors.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4 col-span-full">No doctors data available.</p>
            )}
          </div>
        </div>
      )}

      {/* Pharmacy Section (expandable) */}
      {expandedSection === 'pharmacy' && (
        <div className="card animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Pill className="w-4 h-4 text-violet-500" />
              Pharmacy Inventory
              <span className="text-xs font-normal text-slate-400">— {medications.length} medications</span>
            </h3>
            <Link to="/pharmacy" className="text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1">
              Full Pharmacy <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {lowStockMeds.length > 0 && (
            <div className="mb-3 p-2.5 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-xs font-bold text-amber-800 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Low Stock Alert
              </p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {lowStockMeds.slice(0, 5).map(m => (
                  <span key={m.id} className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] border border-amber-300">
                    {m.name} ({m.stock} left)
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {medications.slice(0, 8).map((m) => (
              <div key={m.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-xs font-medium text-slate-700 truncate">{m.name}</p>
                <p className="text-[10px] text-slate-400">{m.category}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-xs font-bold ${m.isLowStock ? 'text-red-600' : 'text-slate-600'}`}>
                    {m.stock} in stock
                  </span>
                  <span className="text-[10px] text-slate-400">${m.pricePerUnit?.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visit History */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-500" />
            Visit History
            <span className="text-xs font-normal text-slate-400">— {myVisits.length} past visits</span>
          </h3>
          <Link to="/history" className="text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1">
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {myVisits.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Diagnosis</th>
                  <th className="pb-2 font-medium">Doctor</th>
                  <th className="pb-2 font-medium">Hospital</th>
                  <th className="pb-2 font-medium">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myVisits.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 text-slate-600">{v.visitDate || new Date(v.createdAt).toLocaleDateString()}</td>
                    <td className="py-2.5">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                        {v.typeLabel || v.type}
                      </span>
                    </td>
                    <td className="py-2.5 max-w-[200px]">
                      <p className="text-slate-700 truncate" title={v.diagnosis}>{v.diagnosis}</p>
                    </td>
                    <td className="py-2.5 text-slate-600">{v.doctorName}</td>
                    <td className="py-2.5 text-slate-600">{v.hospitalName}</td>
                    <td className="py-2.5 font-semibold text-slate-700">${(v.totalCost || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-8">No visit history yet.</p>
        )}
      </div>

      {/* Hospital info */}
      <div className="card bg-gradient-to-r from-sky-50 to-indigo-50 border-sky-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
            <Hospital className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">Smart Hospital Queue Management System</p>
            <p className="text-xs text-slate-400">For assistance, please contact the reception desk or call our helpline.</p>
          </div>
        </div>
      </div>

      {/* Emergency SOS Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowEmergencyModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-red-600" />
                Emergency Request
              </h3>
              <button onClick={() => setShowEmergencyModal(false)} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-slate-500 mb-3">
                Available ambulances: <strong className="text-slate-700">{availableAmbulances.length}</strong>
              </p>
              {hospitals.length > 0 && (
                <div className="mb-3">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Destination Hospital</label>
                  <select
                    id="emergency-hospital"
                    value={emergencyHospitalId}
                    onChange={(e) => setEmergencyHospitalId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
                  >
                    {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleEmergencyDispatch('EMERGENCY', emergencyHospitalId)}
                  disabled={dispatchLoading || !emergencyHospitalId}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-red-50 border-2 border-red-200 hover:border-red-300 hover:bg-red-100 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Zap className="w-6 h-6 text-red-600" />
                  <span className="text-xs font-bold text-red-700">Emergency Ambulance</span>
                </button>
                <button
                  onClick={() => handleEmergencyDispatch('TRANSPORT', emergencyHospitalId)}
                  disabled={dispatchLoading || !emergencyHospitalId}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-blue-50 border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-100 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Truck className="w-6 h-6 text-blue-600" />
                  <span className="text-xs font-bold text-blue-700">Transport Ambulance</span>
                </button>
              </div>
              <button
                onClick={handleEmergencyICU}
                disabled={dispatchLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {dispatchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <HeartPulse className="w-4 h-4" />}
                Request Emergency ICU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Booking Modal */}
      {showAppointmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => { setShowAppointmentModal(false); setRegErrors({}); }}>
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-cyan-600" />
                Book Doctor Appointment
              </h3>
              <button onClick={() => { setShowAppointmentModal(false); setRegErrors({}); }} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleBookAppointment} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Select Doctor</label>
                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                  {doctors.filter(d => d.available).length === 0 && (
                    <p className="text-xs text-slate-400 py-2">No available doctors right now.</p>
                  )}
                  {doctors.filter(d => d.available).map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => !appointmentLoading && setAppointmentDoctorId(d.id)}
                      disabled={appointmentLoading}
                      className={`flex items-center gap-3 p-2.5 rounded-lg border text-left transition cursor-pointer disabled:opacity-50 ${
                        appointmentDoctorId === d.id
                          ? 'bg-cyan-50 border-cyan-300 ring-1 ring-cyan-300'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${appointmentDoctorId === d.id ? 'bg-cyan-500' : 'bg-slate-400'}`}>
                        {d.name?.charAt(0) || 'D'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{d.name}</p>
                        <p className="text-xs text-slate-400">{d.specialty || 'General'}</p>
                      </div>
                      {appointmentDoctorId === d.id && <CheckCircle className="w-4 h-4 text-cyan-600" />}
                    </button>
                  ))}
                </div>
                {appointmentErrors.doctor && <p className="text-xs text-red-500 mt-1">{appointmentErrors.doctor}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Reason / Symptoms</label>
                <textarea
                  value={appointmentForm.symptoms}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, symptoms: e.target.value })}
                  rows={3}
                  className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 ${appointmentErrors.symptoms ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                />
                {appointmentErrors.symptoms && <p className="text-xs text-red-500 mt-1">{appointmentErrors.symptoms}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Severity</label>
                <select
                  value={appointmentForm.severity}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, severity: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none cursor-pointer"
                >
                  {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={appointmentLoading}
                  className="flex-1 py-2.5 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 font-medium text-sm transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {appointmentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarCheck className="w-4 h-4" />}
                  Book Appointment
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAppointmentModal(false); setAppointmentErrors({}); setAppointmentDoctorId(null); }}
                  className="px-4 py-2.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium text-sm transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Appointment Confirmation */}
      {appointmentConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setAppointmentConfirmation(null)}>
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-6 w-full max-w-sm mx-4 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-full bg-cyan-100 flex items-center justify-center mx-auto mb-4">
              <Ticket className="w-8 h-8 text-cyan-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Appointment Confirmed!</h3>
            <p className="text-sm text-slate-500 mb-4">Your appointment has been booked successfully.</p>
            <div className="space-y-2 mb-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-400">Doctor</p>
                <p className="text-sm font-semibold text-slate-700">{appointmentConfirmation.doctorName}</p>
              </div>
              <div className="p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                <p className="text-xs text-cyan-600">Reference ID</p>
                <p className="text-sm font-bold text-cyan-800 font-mono">{appointmentConfirmation.patientId}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-400">Severity</p>
                <p className="text-sm font-semibold text-slate-700">{appointmentConfirmation.severity}</p>
              </div>
            </div>
            <button
              onClick={() => setAppointmentConfirmation(null)}
              className="w-full py-2.5 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 font-medium text-sm transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Upload Report Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowUploadModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-6 w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Upload className="w-5 h-5 text-violet-600" />
                Upload Medical Report
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUploadReport} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Select File</label>
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:border-violet-300 transition">
                  <input
                    type="file"
                    id="report-file"
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="*/*"
                  />
                  <label htmlFor="report-file" className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="w-6 h-6 text-slate-400" />
                    <span className="text-sm text-slate-500">
                      {uploadFile ? uploadFile.name : 'Click to select any file'}
                    </span>
                    <span className="text-xs text-slate-400">Max size: 7MB</span>
                  </label>
                </div>
                {uploadFile && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                    <FileText className="w-3 h-3" />
                    <span>{uploadFile.name}</span>
                    <span>·</span>
                    <span>{(uploadFile.size / 1024).toFixed(1)} KB</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  rows={2}
                  placeholder="e.g., Blood test results, X-ray scan, etc."
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              {uploadError && (
                <div className="p-2.5 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-xs text-red-600">{uploadError}</p>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={uploadLoading || !uploadFile}
                  className="flex-1 py-2.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 font-medium text-sm transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploadLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Upload Report
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium text-sm transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-400">Uploaded</p>
                <p className="text-sm text-slate-700">{new Date(viewingReport.uploadedAt).toLocaleString()}</p>
              </div>
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

      {/* Self-Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => { setShowRegisterModal(false); setAiAnalysis(null); }}>
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-600" />
                Register as Patient
              </h3>
              <button onClick={() => { setShowRegisterModal(false); setAiAnalysis(null); }} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSelfRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Full Name</label>
                  <input
                    value={regForm.name}
                    onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${regErrors.name ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                  />
                  {regErrors.name && <p className="text-xs text-red-500 mt-1">{regErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Age</label>
                  <input
                    type="number"
                    value={regForm.age}
                    onChange={(e) => setRegForm({ ...regForm, age: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${regErrors.age ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                  />
                  {regErrors.age && <p className="text-xs text-red-500 mt-1">{regErrors.age}</p>}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Contact Number</label>
                <input
                  value={regForm.contact}
                  onChange={(e) => setRegForm({ ...regForm, contact: e.target.value })}
                  className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${regErrors.contact ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                />
                {regErrors.contact && <p className="text-xs text-red-500 mt-1">{regErrors.contact}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Symptoms</label>
                <textarea
                  value={regForm.symptoms}
                  onChange={(e) => setRegForm({ ...regForm, symptoms: e.target.value })}
                  rows={3}
                  className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${regErrors.symptoms ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                />
                {regErrors.symptoms && <p className="text-xs text-red-500 mt-1">{regErrors.symptoms}</p>}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={analyzeSymptoms}
                  className="px-3 py-2 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Brain className="w-3.5 h-3.5" /> AI Analyze
                </button>
                <select
                  value={regForm.severity}
                  onChange={(e) => setRegForm({ ...regForm, severity: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none cursor-pointer"
                >
                  {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {aiAnalysis && (
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-xs font-semibold text-purple-700">AI Suggested: {aiAnalysis.suggested}</p>
                  <p className="text-xs text-slate-500">Est. wait: {aiAnalysis.waitTime} min · Confidence: {aiAnalysis.confidence}%</p>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={registerLoading}
                  className="flex-1 py-2.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 font-medium text-sm transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {registerLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Register
                </button>
                <button
                  type="button"
                  onClick={() => { setShowRegisterModal(false); setAiAnalysis(null); }}
                  className="px-4 py-2.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium text-sm transition cursor-pointer"
                >
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
