import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Shield, Eye, EyeOff, LogIn, UserCheck, AlertCircle } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await login(username, password);
    setLoading(false);
    if (result?.success) {
      navigate('/');
    } else {
      setError(result.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-200 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Smart Hospital</h1>
          <p className="text-sm text-slate-400 mt-1">Queue Management System</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Top gradient */}
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500" />

          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-1">Welcome back</h2>
            <p className="text-sm text-slate-400 mb-4">Sign in to your account</p>

            {/* Quick login buttons */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { role: 'Admin', username: 'admin', password: 'admin123', color: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' },
                { role: 'Doctor', username: 'doctor', password: 'doctor123', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
                { role: 'Reception', username: 'reception', password: 'reception123', color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
                { role: 'Nurse', username: 'nurse', password: 'nurse123', color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
              ].map((btn) => (
                <button
                  key={btn.role}
                  type="button"
                  onClick={() => { setUsername(btn.username); setPassword(btn.password); }}
                  className={`px-3 py-2 rounded-lg border text-xs font-semibold transition cursor-pointer ${btn.color}`}
                >
                  {btn.role}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-600 mb-1">Username</label>
                <div className="relative">
                  <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                    placeholder="Enter username"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-600 mb-1">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl border border-red-100">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm shadow-lg shadow-cyan-200 hover:shadow-xl hover:shadow-cyan-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              <div className="text-center pt-2">
                <p className="text-sm text-slate-500">
                  Don't have an account?{' '}
                  <Link to="/signup" className="font-semibold text-cyan-600 hover:text-cyan-700 transition-colors">
                    Sign Up
                  </Link>
                </p>
              </div>

              <div className="text-center pt-1 border-t border-slate-100">
                <p className="text-xs text-slate-400">
                  Demo: <span className="font-mono">admin / admin123</span> · <span className="font-mono">doctor / doctor123</span>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
