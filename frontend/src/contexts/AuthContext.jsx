import { createContext, useContext, useState, useEffect } from 'react';
import { login, getMe, logout } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      getMe(token)
        .then((u) => {
          setUser(u);
          setError(null);
        })
        .catch(() => {
          localStorage.removeItem('authToken');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (username, password) => {
    setError(null);
    try {
      const result = await login(username, password);
      if (result.success && result.user) {
        localStorage.setItem('authToken', result.user.token);
        setUser(result.user);
        return { success: true };
      }
      return { success: false, message: result.message || 'Login failed' };
    } catch (err) {
      const msg = err.message || 'Login failed';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('authToken');
    try {
      if (token) await logout(token);
    } catch (_) { /* ignore */ }
    localStorage.removeItem('authToken');
    setUser(null);
    setError(null);
  };

  const isAdmin = () => user?.role === 'ADMIN';
  const isDoctor = () => user?.role === 'DOCTOR';
  const isReceptionist = () => user?.role === 'RECEPTIONIST';
  const isNurse = () => user?.role === 'NURSE';
  const isPatient = () => user?.role === 'PATIENT';
  const isLoggedIn = () => !!user;
  const hasRole = (role) => user?.role === role;
  const canAccess = (roles) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      login: handleLogin,
      logout: handleLogout,
      isAdmin,
      isDoctor,
      isReceptionist,
      isNurse,
      isLoggedIn,
      hasRole,
      canAccess,
      setError
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
