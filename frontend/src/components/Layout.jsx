import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

const roleColorMap = {
  ADMIN: 'bg-red-500',
  DOCTOR: 'bg-emerald-500',
  RECEPTIONIST: 'bg-blue-500',
  NURSE: 'bg-amber-500',
  PATIENT: 'bg-purple-500',
};
import ToastNotification from './ToastNotification';
import AIChatbot from './AIChatbot';
import usePatientNotifications from '../hooks/usePatientNotifications';
import {
  LayoutDashboard, AlertTriangle, Users, UserPlus, Truck, BarChart3, Map, Menu, X,
  Activity, Clock, Shield, Stethoscope, BedDouble, Bell, Sparkles, QrCode, HeartPulse,
  Pill, FileText, CreditCard, LogOut, ChevronDown, UserCog
} from 'lucide-react';

const focusRing = 'focus-visible:outline focus-visible:outline-3 focus-visible:outline-cyan-400 focus-visible:outline-offset-2';

const allNavItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, color: '#3b82f6', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', iconText: 'text-blue-500', iconActive: 'text-blue-600', hover: 'hover:bg-blue-50/60', dot: 'bg-blue-500', roles: ['ADMIN','DOCTOR','RECEPTIONIST','NURSE'] },
  { path: '/emergency', label: 'Emergency Queue', icon: AlertTriangle, color: '#ef4444', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', iconText: 'text-red-500', iconActive: 'text-red-600', hover: 'hover:bg-red-50/60', dot: 'bg-red-500', roles: ['ADMIN','DOCTOR','RECEPTIONIST','NURSE'] },
  { path: '/normal', label: 'Normal Queue', icon: Users, color: '#6366f1', bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', iconText: 'text-indigo-500', iconActive: 'text-indigo-600', hover: 'hover:bg-indigo-50/60', dot: 'bg-indigo-500', roles: ['ADMIN','DOCTOR','RECEPTIONIST','NURSE'] },
  { path: '/register', label: 'Registration', icon: UserPlus, color: '#14b8a6', bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', iconText: 'text-teal-500', iconActive: 'text-teal-600', hover: 'hover:bg-teal-50/60', dot: 'bg-teal-500', roles: ['ADMIN','RECEPTIONIST'] },
  { path: '/kiosk', label: 'Self Check-in', icon: QrCode, color: '#0d9488', bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', iconText: 'text-teal-500', iconActive: 'text-teal-600', hover: 'hover:bg-teal-50/60', dot: 'bg-teal-500', roles: ['ADMIN','RECEPTIONIST'] },
  { path: '/treatment', label: 'Treatment', icon: Stethoscope, color: '#10b981', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', iconText: 'text-emerald-500', iconActive: 'text-emerald-600', hover: 'hover:bg-emerald-50/60', dot: 'bg-emerald-500', roles: ['ADMIN','DOCTOR'] },
  { path: '/dispatch', label: 'Ambulance Dispatch', icon: Truck, color: '#f59e0b', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', iconText: 'text-amber-500', iconActive: 'text-amber-600', hover: 'hover:bg-amber-50/60', dot: 'bg-amber-500', roles: ['ADMIN','DOCTOR','NURSE'] },
  { path: '/beds', label: 'Bed Management', icon: BedDouble, color: '#0ea5e9', bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', iconText: 'text-sky-500', iconActive: 'text-sky-600', hover: 'hover:bg-sky-50/60', dot: 'bg-sky-500', roles: ['ADMIN','NURSE'] },
  { path: '/doctors', label: 'Doctors', icon: HeartPulse, color: '#16a34a', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', iconText: 'text-green-500', iconActive: 'text-green-600', hover: 'hover:bg-green-50/60', dot: 'bg-green-500', roles: ['ADMIN','DOCTOR'] },
  { path: '/pharmacy', label: 'Pharmacy', icon: Pill, color: '#14b8a6', bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', iconText: 'text-teal-500', iconActive: 'text-teal-600', hover: 'hover:bg-teal-50/60', dot: 'bg-teal-500', roles: ['ADMIN','DOCTOR','NURSE'] },
  { path: '/history', label: 'Patient History', icon: FileText, color: '#0ea5e9', bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', iconText: 'text-sky-500', iconActive: 'text-sky-600', hover: 'hover:bg-sky-50/60', dot: 'bg-sky-500', roles: ['ADMIN','DOCTOR','RECEPTIONIST'] },
  { path: '/billing', label: 'Billing', icon: CreditCard, color: '#f59e0b', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', iconText: 'text-amber-500', iconActive: 'text-amber-600', hover: 'hover:bg-amber-50/60', dot: 'bg-amber-500', roles: ['ADMIN','RECEPTIONIST'] },
  { path: '/analytics', label: 'AI Analytics', icon: BarChart3, color: '#8b5cf6', bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', iconText: 'text-violet-500', iconActive: 'text-violet-600', hover: 'hover:bg-violet-50/60', dot: 'bg-violet-500', roles: ['ADMIN','DOCTOR'] },
  { path: '/map', label: '3D Hospital Map', icon: Map, color: '#f97316', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', iconText: 'text-orange-500', iconActive: 'text-orange-600', hover: 'hover:bg-orange-50/60', dot: 'bg-orange-500', roles: ['ADMIN','DOCTOR','NURSE'] },
  { path: '/notifications', label: 'Notifications', icon: Bell, color: '#f43f5e', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', iconText: 'text-rose-500', iconActive: 'text-rose-600', hover: 'hover:bg-rose-50/60', dot: 'bg-rose-500', roles: ['ADMIN','DOCTOR','RECEPTIONIST','NURSE'] },
  { path: '/users', label: 'User Management', icon: UserCog, color: '#7c3aed', bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', iconText: 'text-violet-500', iconActive: 'text-violet-600', hover: 'hover:bg-violet-50/60', dot: 'bg-violet-500', roles: ['ADMIN'] },
  { path: '/data-structures', label: 'Data Structures', icon: BarChart3, color: '#d946ef', bg: 'bg-fuchsia-50', border: 'border-fuchsia-200', text: 'text-fuchsia-700', iconText: 'text-fuchsia-500', iconActive: 'text-fuchsia-600', hover: 'hover:bg-fuchsia-50/60', dot: 'bg-fuchsia-500', roles: ['ADMIN','DOCTOR','RECEPTIONIST','NURSE'] },
  // Patient nav items
  { path: '/', label: 'My Dashboard', icon: LayoutDashboard, color: '#7c3aed', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', iconText: 'text-purple-500', iconActive: 'text-purple-600', hover: 'hover:bg-purple-50/60', dot: 'bg-purple-500', roles: ['PATIENT'] },
  { path: '/history', label: 'My Records', icon: FileText, color: '#0ea5e9', bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', iconText: 'text-sky-500', iconActive: 'text-sky-600', hover: 'hover:bg-sky-50/60', dot: 'bg-sky-500', roles: ['PATIENT'] },
  { path: '/billing', label: 'My Billing', icon: CreditCard, color: '#f59e0b', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', iconText: 'text-amber-500', iconActive: 'text-amber-600', hover: 'hover:bg-amber-50/60', dot: 'bg-amber-500', roles: ['PATIENT'] },
  { path: '/doctors', label: 'Find Doctors', icon: HeartPulse, color: '#16a34a', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', iconText: 'text-green-500', iconActive: 'text-green-600', hover: 'hover:bg-green-50/60', dot: 'bg-green-500', roles: ['PATIENT'] },
  { path: '/pharmacy', label: 'Pharmacy', icon: Pill, color: '#14b8a6', bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', iconText: 'text-teal-500', iconActive: 'text-teal-600', hover: 'hover:bg-teal-50/60', dot: 'bg-teal-500', roles: ['PATIENT'] },
  { path: '/map', label: 'Hospital Map', icon: Map, color: '#f97316', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', iconText: 'text-orange-500', iconActive: 'text-orange-600', hover: 'hover:bg-orange-50/60', dot: 'bg-orange-500', roles: ['PATIENT'] },
  { path: '/notifications', label: 'Notifications', icon: Bell, color: '#f43f5e', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', iconText: 'text-rose-500', iconActive: 'text-rose-600', hover: 'hover:bg-rose-50/60', dot: 'bg-rose-500', roles: ['PATIENT'] },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { notifications, dismissNotification } = usePatientNotifications();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = user
    ? allNavItems.filter((item) => item.roles.includes(user.role))
    : allNavItems;

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Toast notifications */}
      <ToastNotification notifications={notifications} onDismiss={dismissNotification} />

      {!sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(true)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white text-slate-700 transition-transform duration-300 flex flex-col border-r border-slate-200 shadow-sm ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
        {/* Top gradient strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500" />

        <div className="p-5 border-b border-slate-100 bg-gradient-to-br from-white to-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-200">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wide text-slate-800">SMART HOSPITAL</h1>
              <p className="text-[10px] text-slate-400">Queue Management System</p>
            </div>
          </div>
          <div className="mt-3 inline-flex items-center gap-1.5 text-[10px] text-cyan-700 bg-gradient-to-r from-cyan-50 to-blue-50 px-2.5 py-1 rounded-full border border-cyan-100 font-medium">
            <Sparkles className="w-3 h-3 text-cyan-500" />
            3D ENABLED
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} aria-label={item.label}
                className={`nav-item-hover group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer min-h-[44px] ${focusRing} ${
                  active
                    ? `${item.bg} ${item.text} ${item.border} border shadow-sm pr-2 nav-item-active`
                    : `text-slate-500 ${item.hover} hover:text-slate-700`
                }`}
              >
                {/* Active indicator stripe */}
                {active && (
                  <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full ${item.dot}`} />
                )}
                {/* Hover stripe indicator */}
                {!active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 rounded-r-full opacity-0 transition-all duration-300 ease-out group-hover:h-5 group-hover:opacity-100" style={{ backgroundColor: item.color }} />
                )}
                <span className={`nav-icon-box flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${
                  active ? 'bg-white shadow-sm' : 'bg-slate-100 group-hover:bg-white group-hover:shadow-sm'
                }`}>
                  <Icon className={`w-4 h-4 transition-colors duration-200 ${
                    active ? item.iconActive : item.iconText
                  }`} />
                </span>
                <span className="nav-label flex-1">{item.label}</span>
                {active && (
                  <span className={`w-2 h-2 rounded-full ${item.dot} animate-pulse`} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        {user && (
          <div className="p-3 border-t border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${roleColorMap[user.role] || 'bg-slate-400'}`}>
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-700 truncate">{user.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.roleDisplay || user.role}</p>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 border-t border-slate-100 text-[10px] text-slate-400">
          v3.0.0 | Smart Hospital System
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-600" aria-label="Toggle sidebar">
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h2 className="font-semibold text-slate-800 text-sm lg:text-base">
              {navItems.find((n) => n.path === location.pathname)?.label || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-500" />
                <span className="text-slate-500">{new Date().toLocaleTimeString()}</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-100">
                <Activity className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">System Normal</span>
              </div>
            </div>
            {/* User menu */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${roleColorMap[user.role] || 'bg-slate-400'}`}>
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-xs font-semibold text-slate-600 hidden md:block">{user.name}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 z-20 py-1">
                      <div className="px-3 py-2 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                        <p className="text-xs text-slate-400">{user.roleDisplay || user.role}</p>
                        <p className="text-[10px] text-slate-400">{user.email}</p>
                      </div>
                      <button
                        onClick={() => { handleLogout(); setUserMenuOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {/* AI Chatbot — appears on all pages */}
      <AIChatbot />
    </div>
  );
}
