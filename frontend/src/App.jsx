import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext.jsx';
import Layout from './components/Layout';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import AdminDashboard from './pages/AdminDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import NurseDashboard from './pages/NurseDashboard';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import PatientDashboard from './pages/PatientDashboard';
import EmergencyQueue from './pages/EmergencyQueue';
import NormalQueue from './pages/NormalQueue';
import Registration from './pages/Registration';
import Dispatch from './pages/Dispatch';
import Analytics from './pages/Analytics';
import MapView from './pages/MapView';
import Treatment from './pages/Treatment';
import BedManagement from './pages/BedManagement';
import Notifications from './pages/Notifications';
import Kiosk from './pages/Kiosk';
import Doctors from './pages/Doctors';
import Pharmacy from './pages/Pharmacy';
import PatientHistory from './pages/PatientHistory';
import Billing from './pages/Billing';
import UserManagement from './pages/UserManagement';
import DataStructures from './pages/DataStructures';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role) && user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }
  return children;
}

function RoleDashboard() {
  const { user } = useAuth();
  switch (user?.role) {
    case 'DOCTOR':
      return <DoctorDashboard />;
    case 'NURSE':
      return <NurseDashboard />;
    case 'RECEPTIONIST':
      return <ReceptionistDashboard />;
    case 'PATIENT':
      return <PatientDashboard />;
    default:
      return <AdminDashboard />;
  }
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/" replace /> : <SignUp />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<RoleDashboard />} />
        <Route path="emergency" element={<EmergencyQueue />} />
        <Route path="normal" element={<NormalQueue />} />
        <Route path="register" element={<ProtectedRoute allowedRoles={['ADMIN','RECEPTIONIST']}><Registration /></ProtectedRoute>} />
        <Route path="treatment" element={<ProtectedRoute allowedRoles={['ADMIN','DOCTOR']}><Treatment /></ProtectedRoute>} />
        <Route path="dispatch" element={<ProtectedRoute allowedRoles={['ADMIN','DOCTOR','NURSE']}><Dispatch /></ProtectedRoute>} />
        <Route path="beds" element={<ProtectedRoute allowedRoles={['ADMIN','NURSE']}><BedManagement /></ProtectedRoute>} />
        <Route path="analytics" element={<ProtectedRoute allowedRoles={['ADMIN','DOCTOR']}><Analytics /></ProtectedRoute>} />
        <Route path="map" element={<ProtectedRoute allowedRoles={['ADMIN','DOCTOR','NURSE','PATIENT']}><MapView /></ProtectedRoute>} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="kiosk" element={<ProtectedRoute allowedRoles={['ADMIN','RECEPTIONIST']}><Kiosk /></ProtectedRoute>} />
        <Route path="doctors" element={<ProtectedRoute allowedRoles={['ADMIN','DOCTOR','PATIENT']}><Doctors /></ProtectedRoute>} />
        <Route path="pharmacy" element={<ProtectedRoute allowedRoles={['ADMIN','DOCTOR','NURSE','PATIENT']}><Pharmacy /></ProtectedRoute>} />
        <Route path="history" element={<ProtectedRoute allowedRoles={['ADMIN','DOCTOR','RECEPTIONIST','PATIENT']}><PatientHistory /></ProtectedRoute>} />
        <Route path="billing" element={<ProtectedRoute allowedRoles={['ADMIN','RECEPTIONIST','PATIENT']}><Billing /></ProtectedRoute>} />
        <Route path="users" element={<ProtectedRoute allowedRoles={['ADMIN']}><UserManagement /></ProtectedRoute>} />
        <Route path="data-structures" element={<ProtectedRoute allowedRoles={['ADMIN','DOCTOR','RECEPTIONIST','NURSE']}><DataStructures /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
