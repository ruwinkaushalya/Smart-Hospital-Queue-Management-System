import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getUsers, adminCreateUser, adminUpdateUser, adminDeleteUser } from '../services/api.js';
import { Users, Plus, Pencil, Trash2, Shield, CheckCircle, XCircle, Loader2, Search, AlertTriangle } from 'lucide-react';

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Administrator', color: 'text-red-600 bg-red-50 border-red-200' },
  { value: 'DOCTOR', label: 'Doctor', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { value: 'RECEPTIONIST', label: 'Receptionist', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { value: 'NURSE', label: 'Nurse', color: 'text-amber-600 bg-amber-50 border-amber-200' },
];

const AVATAR_COLORS = {
  ADMIN: 'bg-red-500',
  DOCTOR: 'bg-emerald-500',
  RECEPTIONIST: 'bg-blue-500',
  NURSE: 'bg-amber-500',
};

const roleBadge = (role) => {
  const opt = ROLE_OPTIONS.find((r) => r.value === role);
  return opt ? opt.color : 'text-slate-600 bg-slate-50 border-slate-200';
};

const avatarColor = (role) => {
  return AVATAR_COLORS[role] || 'bg-slate-400';
};

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState({
    username: '',
    password: '',
    name: '',
    role: 'RECEPTIONIST',
    email: '',
    active: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filteredUsers = useMemo(() => {
    const term = debouncedSearch.toLowerCase();
    if (!term) return users;
    return users.filter((u) =>
      u.name?.toLowerCase().includes(term) ||
      u.username?.toLowerCase().includes(term) ||
      u.role?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term)
    );
  }, [users, debouncedSearch]);

  const validateForm = () => {
    const errors = {};
    if (!form.username.trim()) errors.username = 'Username is required';
    if (!form.name.trim()) errors.name = 'Name is required';
    if (!editingUser && !form.password.trim()) errors.password = 'Password is required';
    if (form.password && form.password.length < 4) errors.password = 'Password must be at least 4 characters';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      if (editingUser) {
        const payload = {
          name: form.name,
          role: form.role,
          email: form.email,
          active: form.active,
        };
        if (form.password) payload.password = form.password;
        await adminUpdateUser(editingUser.id, payload);
      } else {
        await adminCreateUser(form);
      }
      setShowModal(false);
      setEditingUser(null);
      setForm({ username: '', password: '', name: '', role: 'RECEPTIONIST', email: '', active: true });
      loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to save user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setForm({
      username: user.username,
      password: '',
      name: user.name,
      role: user.role,
      email: user.email || '',
      active: user.active,
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingUser(null);
    setForm({ username: '', password: '', name: '', role: 'RECEPTIONIST', email: '', active: true });
    setFormErrors({});
    setShowModal(true);
  };

  const handleToggleActive = async (user) => {
    try {
      await adminUpdateUser(user.id, { active: !user.active });
      loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to update user');
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminDeleteUser(id);
      setDeleteConfirm(null);
      loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-600" />
            User Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">Create, edit, and manage system users</p>
        </div>
        <button
          onClick={handleAdd}
          className="px-4 py-2.5 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 font-medium text-sm flex items-center gap-2 transition cursor-pointer min-h-[44px]"
        >
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      {/* Search bar */}
      <div className="card p-3">
        <div className="relative max-w-md">
          <label htmlFor="users-search" className="sr-only">Search users</label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="users-search"
            name="search"
            type="text"
            placeholder="Search users by name, username, role, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoComplete="off"
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-text placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm flex items-center gap-2" role="alert">
          <AlertTriangle className="w-4 h-4" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700 cursor-pointer">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Users table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-2 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading users...</span>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                      <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-sm">No users found</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${avatarColor(u.role)}`}>
                            {u.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{u.name}</p>
                            <p className="text-xs text-slate-400">@{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${roleBadge(u.role)}`}>
                          <Shield className="w-3 h-3" />
                          {u.roleDisplay || u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{u.email || '—'}</td>
                      <td className="px-4 py-3">
                        {currentUser?.id === u.id ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                            u.active
                              ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                              : 'text-slate-500 bg-slate-50 border-slate-200'
                          }`}>
                            {u.active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {u.active ? 'Active' : 'Inactive'}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleToggleActive(u)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition cursor-pointer ${
                              u.active
                                ? 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                                : 'text-slate-500 bg-slate-50 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {u.active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {u.active ? 'Active' : 'Inactive'}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {currentUser?.id === u.id ? (
                            <span className="text-xs text-slate-400 font-medium px-2 py-1 rounded-full bg-slate-100 border border-slate-200">
                              You
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEdit(u)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition cursor-pointer"
                                title="Edit user"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(u)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                                title="Delete user"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Full Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white ${formErrors.name ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                  placeholder="Enter full name"
                />
                {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Username <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  disabled={!!editingUser}
                  className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white ${formErrors.username ? 'border-red-300 bg-red-50' : 'border-slate-200'} ${editingUser ? 'opacity-60 cursor-not-allowed' : ''}`}
                  placeholder="Enter username"
                />
                {formErrors.username && <p className="text-xs text-red-500 mt-1">{formErrors.username}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Password {editingUser ? '(leave blank to keep unchanged)' : <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white ${formErrors.password ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                  placeholder={editingUser ? '••••••' : 'Enter password'}
                />
                {formErrors.password && <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                  placeholder="Enter email address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Role <span className="text-red-500">*</span></label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Status</label>
                  <select
                    value={form.active ? 'true' : 'false'}
                    onChange={(e) => setForm({ ...form, active: e.target.value === 'true' })}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 font-medium text-sm transition cursor-pointer min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 font-medium text-sm flex items-center gap-2 transition cursor-pointer min-h-[44px] disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Delete User</h3>
                <p className="text-sm text-slate-500">
                  Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 font-medium text-sm transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                className="px-4 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium text-sm transition cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
