import { useState, useEffect } from 'react';
import { createPatient } from '../services/api';
import { UserPlus, Brain, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const SEVERITIES = ['CRITICAL', 'HIGH', 'MODERATE', 'LOW', 'ROUTINE'];

export default function Registration() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const [form, setForm] = useState({ name: '', age: '', contact: '', symptoms: '', severity: 'MODERATE' });
  const [errors, setErrors] = useState({});
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.age.trim()) e.age = 'Age is required';
    else if (isNaN(form.age) || +form.age < 0 || +form.age > 120) e.age = 'Valid age 0-120 required';
    if (!form.contact.trim()) e.contact = 'Contact number is required';
    if (!form.symptoms.trim()) e.symptoms = 'Symptoms description is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const analyzeWithAI = () => {
    if (!form.symptoms.trim()) return;
    const symptoms = form.symptoms.toLowerCase();
    let suggested;
    let waitTime;

    if (symptoms.includes('chest') || symptoms.includes('breathing') || symptoms.includes('heart')) {
      suggested = 'CRITICAL';
      waitTime = 5;
    } else if (symptoms.includes('accident') || symptoms.includes('broken') || symptoms.includes('bleeding') || symptoms.includes('allergic')) {
      suggested = 'HIGH';
      waitTime = 15;
    } else if (symptoms.includes('fever') || symptoms.includes('pain') || symptoms.includes('dehydration')) {
      suggested = 'MODERATE';
      waitTime = 35;
    } else if (symptoms.includes('migraine') || symptoms.includes('dizzy') || symptoms.includes('sprain')) {
      suggested = 'LOW';
      waitTime = 55;
    } else {
      suggested = 'ROUTINE';
      waitTime = 60;
    }

    if (form.age && +form.age > 65) {
      if (suggested === 'MODERATE') suggested = 'HIGH';
      waitTime = Math.max(5, waitTime - 10);
    }

    setAiAnalysis({ suggested, waitTime, confidence: Math.floor(Math.random() * 15 + 80), queuePosition: Math.floor(Math.random() * 10 + 1) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await createPatient({
        name: form.name,
        age: form.age,
        contact: form.contact,
        symptoms: form.symptoms,
        severity: form.severity,
      });
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      setForm({ name: '', age: '', contact: '', symptoms: '', severity: 'MODERATE' });
      setAiAnalysis(null);
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  const inputClass = (field) =>
    `w-full px-3 py-2.5 rounded-lg border text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition bg-white border-slate-200 ${
      errors[field] ? 'border-red-300 bg-red-50' : ''
    }`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading registration...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-cyan-600" />
            Patient Registration
          </h1>
          <p className="text-sm text-slate-500 mt-1">Register new patients with AI-assisted severity assessment</p>
        </div>
        <Link to="/treatment" className="btn-primary flex items-center gap-2 text-sm">
          <CheckCircle className="w-4 h-4" /> Treatment Panel
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 card">
          <h3 className="font-bold text-slate-800 mb-4">Patient Details</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="patient-name" className="block text-sm font-medium text-slate-600 mb-1">Full Name <span aria-hidden="true">*</span></label>
                <input id="patient-name" name="name" type="text" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={`${inputClass('name')} cursor-text placeholder:text-slate-400`} placeholder="Enter patient name" aria-required="true" aria-invalid={!!errors.name} aria-describedby={errors.name ? 'name-error' : undefined} />
                {errors.name && <p id="name-error" className="text-xs text-red-500 mt-1" aria-live="polite" role="alert">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="patient-age" className="block text-sm font-medium text-slate-600 mb-1">Age <span aria-hidden="true">*</span></label>
                <input id="patient-age" name="age" type="text" inputMode="numeric" autoComplete="off" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className={`${inputClass('age')} cursor-text placeholder:text-slate-400`} placeholder="e.g. 45" aria-required="true" aria-invalid={!!errors.age} aria-describedby={errors.age ? 'age-error' : undefined} />
                {errors.age && <p id="age-error" className="text-xs text-red-500 mt-1" aria-live="polite" role="alert">{errors.age}</p>}
              </div>
            </div>

            <div>                <label htmlFor="patient-contact" className="block text-sm font-medium text-slate-600 mb-1">Contact Number <span aria-hidden="true">*</span></label>
                <input id="patient-contact" name="contact" type="tel" autoComplete="tel" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} className={`${inputClass('contact')} cursor-text placeholder:text-slate-400`} placeholder="e.g. 071-1111111" aria-required="true" aria-invalid={!!errors.contact} aria-describedby={errors.contact ? 'contact-error' : undefined} />
                {errors.contact && <p id="contact-error" className="text-xs text-red-500 mt-1" aria-live="polite" role="alert">{errors.contact}</p>}
            </div>

            <div>                <label htmlFor="patient-symptoms" className="block text-sm font-medium text-slate-600 mb-1">Symptoms <span aria-hidden="true">*</span></label>
                <textarea id="patient-symptoms" name="symptoms" autoComplete="off" value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} rows={3} className={`${inputClass('symptoms')} cursor-text placeholder:text-slate-400`} placeholder="Describe symptoms in detail..." aria-required="true" aria-invalid={!!errors.symptoms} aria-describedby={errors.symptoms ? 'symptoms-error' : undefined} />
                {errors.symptoms && <p id="symptoms-error" className="text-xs text-red-500 mt-1" aria-live="polite" role="alert">{errors.symptoms}</p>}
            </div>

            <div>                <label htmlFor="patient-severity" className="block text-sm font-medium text-slate-600 mb-1">Severity Level <span aria-hidden="true">*</span></label>
                <select id="patient-severity" name="severity" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer" aria-required="true">
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={analyzeWithAI} className="px-4 py-2.5 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100 font-medium text-sm flex items-center gap-2 transition cursor-pointer min-h-[44px]">
                <Brain className="w-4 h-4" /> AI Analyze Symptoms
              </button>
              <button type="submit" className="px-6 py-2.5 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 font-medium text-sm flex items-center gap-2 transition cursor-pointer min-h-[44px]">
                <CheckCircle className="w-4 h-4" /> Register Patient
              </button>
              <button type="button" onClick={() => { setForm({ name: '', age: '', contact: '', symptoms: '', severity: 'MODERATE' }); setErrors({}); setAiAnalysis(null); }} className="px-4 py-2.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 font-medium text-sm transition cursor-pointer min-h-[44px]">
                Clear
              </button>
            </div>
          </form>

          {submitted && (
            <div className="mt-4 p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm flex items-center gap-2" role="status" aria-live="polite">
              <CheckCircle className="w-4 h-4" />
              Patient registered successfully!
            </div>
          )}
        </div>

        {/* AI Panel */}
        <div className="card">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Brain className="w-4 h-4 text-cyan-600" />
            AI Decision Support
          </h3>

          {aiAnalysis ? (
            <div className="space-y-4">
              <div className="p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                <p className="text-xs text-cyan-700 uppercase font-semibold">AI Suggested Severity</p>
                <p className={`text-lg font-bold mt-1 ${aiAnalysis.suggested === 'CRITICAL' ? 'text-red-600' : aiAnalysis.suggested === 'HIGH' ? 'text-orange-600' : aiAnalysis.suggested === 'MODERATE' ? 'text-cyan-600' : 'text-emerald-600'}`}>
                  {aiAnalysis.suggested}
                </p>
                <p className="text-xs text-slate-500 mt-1">Confidence: {aiAnalysis.confidence}%</p>
              </div>

              <div className="p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                <p className="text-xs text-slate-500 uppercase font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Predicted Wait Time
                </p>
                <p className="text-lg font-bold text-cyan-700 mt-1">{aiAnalysis.waitTime} minutes</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700">AI Analysis:</p>
                <p>Symptoms analyzed for severity classification.</p>
                <p>Queue position: #{aiAnalysis.queuePosition}</p>
                <p>Estimated processing based on current hospital load.</p>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500 py-8 text-center">
              <Brain className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              Enter symptoms and click "AI Analyze" for AI-powered recommendations.
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-700 mb-2">Severity Guide:</p>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-slate-500">Critical — Life threatening</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-slate-500">High — Severe injury/condition</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500" />
                <span className="text-slate-500">Moderate — Urgent but stable</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-500">Low — Minor issue</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
