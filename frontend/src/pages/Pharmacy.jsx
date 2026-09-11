import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import {
  getMedications, createMedication, getLowStockMedications, getExpiredMedications,
  searchMedications, updateMedicationStock, subscribeToRealtime
} from '../services/api';
import {
  Pill, Search, AlertTriangle, AlertCircle, CheckCircle, Loader2,
  Plus, Minus, Package, TrendingDown, Calendar, DollarSign, Filter,
  RefreshCw, TreePine, X
} from 'lucide-react';

export default function Pharmacy() {
  const { user } = useAuth();
  const isPatient = user?.role === 'PATIENT';
  const [medications, setMedications] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [expired, setExpired] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [form, setForm] = useState({
    name: '', category: '', description: '', stock: '', reorderThreshold: '',
    pricePerUnit: '', expiryDate: '', supplier: '', dosage: '', unit: ''
  });

  const fetchData = useCallback(async () => {
    try {
      const [meds, low, exp] = await Promise.all([
        getMedications(),
        getLowStockMedications(),
        getExpiredMedications()
      ]);
      setMedications(Array.isArray(meds) ? meds : []);
      setLowStock(Array.isArray(low) ? low : []);
      setExpired(Array.isArray(exp) ? exp : []);
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

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchData();
      return;
    }
    try {
      const results = await searchMedications(searchQuery);
      setMedications(Array.isArray(results) ? results : []);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleUpdateStock = async (id, delta) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await updateMedicationStock(id, delta);
      setFeedback({ type: 'success', message: `Stock ${delta > 0 ? 'added' : 'removed'} successfully` });
      await fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createMedication({
        ...form,
        stock: parseInt(form.stock),
        reorderThreshold: parseInt(form.reorderThreshold || '10'),
        pricePerUnit: parseFloat(form.pricePerUnit),
      });
      setFeedback({ type: 'success', message: 'Medication added successfully' });
      setShowModal(false);
      setForm({ name: '', category: '', description: '', stock: '', reorderThreshold: '', pricePerUnit: '', expiryDate: '', supplier: '', dosage: '', unit: '' });
      await fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const categories = useMemo(() => {
    const cats = new Set(medications.map(m => m.category).filter(Boolean));
    return ['All', ...Array.from(cats)];
  }, [medications]);

  const filtered = useMemo(() => {
    let list = medications;
    if (filterCategory !== 'All') {
      list = list.filter(m => m.category === filterCategory);
    }
    return list;
  }, [medications, filterCategory]);

  const totalInventoryValue = medications.reduce((sum, m) => sum + (m.inventoryValue || 0), 0);
  const totalItems = medications.reduce((sum, m) => sum + (m.stock || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading pharmacy inventory...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Pill className="w-6 h-6 text-violet-600" />
            Pharmacy Inventory (BST)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Binary Search Tree medication management with stock tracking and expiry alerts
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
          feedback.type === 'error'
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        }`}>
          {feedback.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {feedback.message}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card bg-violet-50 border-violet-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
            <Package className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <p className="text-xs text-violet-600 font-medium">Medications</p>
            <p className="text-2xl font-bold text-violet-800">{medications.length}</p>
          </div>
        </div>
        <div className="card bg-emerald-50 border-emerald-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
            <Package className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-emerald-600 font-medium">Total Items</p>
            <p className="text-2xl font-bold text-emerald-800">{totalItems}</p>
          </div>
        </div>
        <div className="card bg-blue-50 border-blue-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-blue-600 font-medium">Inventory Value</p>
            <p className="text-2xl font-bold text-blue-800">${totalInventoryValue.toFixed(0)}</p>
          </div>
        </div>
        <div className="card bg-red-50 border-red-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-xs text-red-600 font-medium">Low/Expired</p>
            <p className="text-2xl font-bold text-red-800">{lowStock.length + expired.length}</p>
          </div>
        </div>
      </div>

      {/* BST Info */}
      <div className="card bg-slate-50 border-slate-200">
        <div className="flex items-center gap-2 mb-2">
          <TreePine className="w-4 h-4 text-slate-600" />
          <h3 className="font-bold text-slate-800 text-sm">Data Structure: Binary Search Tree</h3>
        </div>
        <p className="text-xs text-slate-500">
          Medications are stored in a Binary Search Tree (BST) for O(log n) average-case search, insert, and delete operations.
          In-order traversal produces sorted medication lists by ID. Tree operations: searchByName, getLowStock, getExpired, updateStock.
        </p>
      </div>

      {/* Alerts */}
      {(lowStock.length > 0 || expired.length > 0) && (
        <div className="space-y-3">
          {lowStock.length > 0 && (
            <div className="card bg-amber-50 border-amber-200">
              <h3 className="font-bold text-amber-800 text-sm flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4" />
                Low Stock Alerts ({lowStock.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {lowStock.map(m => (
                  <span key={m.id} className="px-2 py-1 rounded-md bg-amber-100 text-amber-700 text-xs border border-amber-300">
                    {m.name} ({m.stock} / {m.reorderThreshold})
                  </span>
                ))}
              </div>
            </div>
          )}
          {expired.length > 0 && (
            <div className="card bg-red-50 border-red-200">
              <h3 className="font-bold text-red-800 text-sm flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4" />
                Expired Medications ({expired.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {expired.map(m => (
                  <span key={m.id} className="px-2 py-1 rounded-md bg-red-100 text-red-700 text-xs border border-red-300">
                    {m.name} (exp: {m.expiryDate})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search medications by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-text placeholder:text-slate-400"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={handleSearch} className="px-3 py-2.5 rounded-lg bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 text-sm font-medium transition cursor-pointer">
            Search
          </button>
          <div className="relative">
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="pl-8 pr-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none cursor-pointer"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {!isPatient && (
            <button
              onClick={() => setShowModal(true)}
              className="px-3 py-2.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 text-sm font-medium transition cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          )}
        </div>
      </div>

      {/* Medication Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Expiry</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{m.id}</td>
                  <td className="px-4 py-3 font-medium text-slate-700">{m.name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-md text-xs bg-violet-50 text-violet-700 border border-violet-200">
                      {m.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${m.isLowStock ? 'text-red-600' : 'text-slate-700'}`}>
                        {m.stock}
                      </span>
                      <span className="text-xs text-slate-400">/ {m.reorderThreshold}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">${m.pricePerUnit?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-500">{m.expiryDate}</td>
                  <td className="px-4 py-3">
                    {m.isExpired ? (
                      <span className="px-2 py-0.5 rounded-md text-xs bg-red-100 text-red-700 border border-red-300 font-semibold">EXPIRED</span>
                    ) : m.isLowStock ? (
                      <span className="px-2 py-0.5 rounded-md text-xs bg-amber-100 text-amber-700 border border-amber-300 font-semibold">LOW</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-xs bg-emerald-100 text-emerald-700 border border-emerald-300">OK</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {!isPatient ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleUpdateStock(m.id, -1)}
                          disabled={actionLoading[m.id]}
                          className="p-1 rounded hover:bg-slate-100 text-slate-500 transition cursor-pointer disabled:opacity-50"
                          title="Decrease stock"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleUpdateStock(m.id, 1)}
                          disabled={actionLoading[m.id]}
                          className="p-1 rounded hover:bg-slate-100 text-slate-500 transition cursor-pointer disabled:opacity-50"
                          title="Increase stock"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No medications found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">Add New Medication</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Name *</label>
                  <input required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Category *</label>
                  <input required value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows={2} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Stock *</label>
                  <input required type="number" value={form.stock} onChange={(e) => setForm({...form, stock: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Reorder Threshold</label>
                  <input type="number" value={form.reorderThreshold} onChange={(e) => setForm({...form, reorderThreshold: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Price/Unit *</label>
                  <input required type="number" step="0.01" value={form.pricePerUnit} onChange={(e) => setForm({...form, pricePerUnit: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Expiry Date</label>
                  <input type="date" value={form.expiryDate} onChange={(e) => setForm({...form, expiryDate: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Supplier</label>
                  <input value={form.supplier} onChange={(e) => setForm({...form, supplier: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Dosage</label>
                  <input value={form.dosage} onChange={(e) => setForm({...form, dosage: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Unit</label>
                  <input value={form.unit} onChange={(e) => setForm({...form, unit: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 font-medium text-sm transition cursor-pointer">
                  Add Medication
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
