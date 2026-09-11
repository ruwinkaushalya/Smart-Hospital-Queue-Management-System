import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { createPatient } from '../services/api';
import { QrCode, UserPlus, CheckCircle, AlertTriangle, Smartphone, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Kiosk() {
  const [form, setForm] = useState({ name: '', age: '', contact: '', symptoms: '', severity: 'LOW' });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [kioskUrl, setKioskUrl] = useState('');

  useEffect(() => {
    const url = window.location.origin + '/kiosk';
    setKioskUrl(url);
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.age || !form.contact || !form.symptoms) {
      setFeedback({ type: 'error', message: 'Please fill in all fields' });
      return;
    }
    setLoading(true);
    try {
      const result = await createPatient({
        name: form.name,
        age: String(form.age),
        contact: form.contact,
        symptoms: form.symptoms,
        severity: form.severity,
      });
      setFeedback({
        type: 'success',
        message: `Registration successful! Your patient ID is ${result.id || result.patient?.id || 'assigned'}. Please wait for your turn.`,
      });
      setForm({ name: '', age: '', contact: '', symptoms: '', severity: 'LOW' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Patient Self Check-in Kiosk</h1>
          <p className="text-sm text-slate-500 mt-1">Scan the QR code or fill in the form to register yourself</p>
        </div>
        <Link to="/register" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="w-4 h-4" /> Staff Registration
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* QR Code Section */}
        <div className="card flex flex-col items-center justify-center text-center p-8">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-200 mb-4">
            <QrCode className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-bold text-slate-800 mb-1">Scan to Check In</h3>
          <p className="text-xs text-slate-500 mb-4">Point your phone camera at this QR code</p>
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <QRCodeSVG value={kioskUrl} size={180} level="H" includeMargin={true} />
          </div>
          <div className="flex items-center gap-2 mt-4 text-xs text-slate-500">
            <Smartphone className="w-3.5 h-3.5" />
            <span>No app needed — scan with any camera</span>
          </div>
        </div>

        {/* Self Registration Form */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-5 h-5 text-teal-500" />
            <h3 className="font-bold text-slate-800">Self Check-in Form</h3>
          </div>

          {feedback && (
            <div className={`mb-4 p-3 rounded-lg text-sm flex items-start gap-2 ${
              feedback.type === 'error'
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {feedback.type === 'error' ? <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> : <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />}
              {feedback.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="kiosk-name" className="block text-xs font-medium text-slate-600 mb-1">Full Name</label>
              <input
                id="kiosk-name"
                name="name"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                placeholder="Enter your full name"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="kiosk-age" className="block text-xs font-medium text-slate-600 mb-1">Age</label>
                <input
                  id="kiosk-age"
                  name="age"
                  type="number"
                  value={form.age}
                  onChange={handleChange}
                  autoComplete="off"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                  placeholder="Age"
                  required
                />
              </div>
              <div>
                <label htmlFor="kiosk-severity" className="block text-xs font-medium text-slate-600 mb-1">Severity</label>
                <select
                  id="kiosk-severity"
                  name="severity"
                  value={form.severity}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                >
                  <option value="LOW">Low</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="kiosk-contact" className="block text-xs font-medium text-slate-600 mb-1">Contact Number</label>
              <input
                id="kiosk-contact"
                name="contact"
                value={form.contact}
                onChange={handleChange}
                autoComplete="tel"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                placeholder="e.g. 071-1234567"
                required
              />
            </div>
            <div>
              <label htmlFor="kiosk-symptoms" className="block text-xs font-medium text-slate-600 mb-1">Symptoms</label>
              <textarea
                id="kiosk-symptoms"
                name="symptoms"
                value={form.symptoms}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                placeholder="Describe your symptoms"
                rows={3}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-semibold hover:from-teal-600 hover:to-emerald-600 transition shadow-md shadow-teal-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="animate-pulse">Registering...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" /> Complete Check-in
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
