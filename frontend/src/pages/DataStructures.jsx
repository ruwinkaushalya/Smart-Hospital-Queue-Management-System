import { useState, useEffect, useCallback } from 'react';
import {
  undoLastAction, getUndoStack, getAVLMedications, getAVLStats,
  sortPatients, getKruskalMST
} from '../services/api.js';
import {
  Undo2, TreePine, ArrowUpDown, GitBranch, RefreshCw, Layers,
  RotateCcw, BarChart3, AlertCircle, CheckCircle2, Activity,
  Clock, Hash, Maximize2, Zap, Network, Users
} from 'lucide-react';

const focusRing = 'focus-visible:outline focus-visible:outline-3 focus-visible:outline-cyan-400 focus-visible:outline-offset-2';

export default function DataStructures() {
  const [activeTab, setActiveTab] = useState('undo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Undo Stack state
  const [undoStack, setUndoStack] = useState({ size: 0, actions: [] });
  const [undoResult, setUndoResult] = useState(null);

  // AVL Tree state
  const [avlMedications, setAvlMedications] = useState([]);
  const [avlStats, setAvlStats] = useState({ size: 0, height: 0, isBalanced: false, rootBalanceFactor: 0 });

  // Sorting state
  const [sortBy, setSortBy] = useState('severity');
  const [sortAlgorithm, setSortAlgorithm] = useState('bubble');
  const [sortResult, setSortResult] = useState(null);

  // MST state
  const [mstResult, setMstResult] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'undo') {
        const stack = await getUndoStack();
        setUndoStack(stack);
      } else if (activeTab === 'avl') {
        const [meds, stats] = await Promise.all([getAVLMedications(), getAVLStats()]);
        setAvlMedications(meds);
        setAvlStats(stats);
      } else if (activeTab === 'sort') {
        const result = await sortPatients(sortBy, sortAlgorithm);
        setSortResult(result);
      } else if (activeTab === 'mst') {
        const result = await getKruskalMST();
        setMstResult(result);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [activeTab, sortBy, sortAlgorithm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUndo = async () => {
    setLoading(true);
    try {
      const result = await undoLastAction();
      setUndoResult(result);
      const stack = await getUndoStack();
      setUndoStack(stack);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'undo', label: 'Undo Stack', icon: Undo2, desc: 'LIFO Stack for undoing actions' },
    { id: 'avl', label: 'AVL Tree', icon: TreePine, desc: 'Self-balancing BST for medications' },
    { id: 'sort', label: 'Sorting', icon: ArrowUpDown, desc: 'Bubble & Selection Sort demo' },
    { id: 'mst', label: 'Kruskal MST', icon: GitBranch, desc: 'Minimum Spanning Tree for roads' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Data Structures & Algorithms</h1>
            <p className="text-fuchsia-100 text-sm">CW Scope Demonstration — All 4 new features</p>
          </div>
        </div>
        <div className="flex gap-4 mt-4 text-xs text-fuchsia-100">
          <span className="flex items-center gap-1"><Undo2 className="w-3 h-3" /> Stack</span>
          <span className="flex items-center gap-1"><TreePine className="w-3 h-3" /> AVL Tree</span>
          <span className="flex items-center gap-1"><ArrowUpDown className="w-3 h-3" /> Sorting</span>
          <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" /> Kruskal MST</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setError(null); setUndoResult(null); }}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${focusRing} ${
                  active
                    ? 'text-fuchsia-700 bg-fuchsia-50 border-b-2 border-fuchsia-500'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-fuchsia-500' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* UNDO STACK TAB */}
          {activeTab === 'undo' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Undo Stack</h3>
                  <p className="text-sm text-slate-500">LIFO Stack — Push actions on registration/bed allocation, Pop to undo</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleUndo}
                    disabled={loading || undoStack.size === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-fuchsia-600 text-white rounded-xl text-sm font-semibold hover:bg-fuchsia-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Undo Last Action
                  </button>
                  <button
                    onClick={fetchData}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
              </div>

              {undoResult && (
                <div className={`rounded-xl p-4 border flex items-center gap-2 text-sm ${
                  undoResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-amber-50 border-amber-200 text-amber-700'
                }`}>
                  {undoResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {undoResult.success ? `Undone: ${undoResult.undoneAction}` : undoResult.message}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-fuchsia-50 to-purple-50 rounded-xl p-4 border border-fuchsia-100">
                  <div className="flex items-center gap-2 text-fuchsia-700 mb-1">
                    <Layers className="w-4 h-4" />
                    <span className="text-sm font-semibold">Stack Size</span>
                  </div>
                  <p className="text-3xl font-bold text-fuchsia-800">{undoStack.size}</p>
                  <p className="text-xs text-fuchsia-500 mt-1">Actions stored</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center gap-2 text-blue-700 mb-1">
                    <Maximize2 className="w-4 h-4" />
                    <span className="text-sm font-semibold">Max Capacity</span>
                  </div>
                  <p className="text-3xl font-bold text-blue-800">50</p>
                  <p className="text-xs text-blue-500 mt-1">Oldest auto-removed</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                  <div className="flex items-center gap-2 text-emerald-700 mb-1">
                    <Activity className="w-4 h-4" />
                    <span className="text-sm font-semibold">Operations</span>
                  </div>
                  <p className="text-3xl font-bold text-emerald-800">O(1)</p>
                  <p className="text-xs text-emerald-500 mt-1">Push / Pop / Peek</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                  <Undo2 className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-700">Stack Contents (Top = Most Recent)</span>
                </div>
                <div className="p-4 max-h-80 overflow-y-auto">
                  {undoStack.actions.length === 0 ? (
                    <p className="text-center text-slate-400 text-sm py-8">No actions in stack. Register a patient or allocate a bed to see entries.</p>
                  ) : (
                    <div className="space-y-2">
                      {[...undoStack.actions].reverse().map((action, i) => (
                        <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                          i === 0 ? 'bg-fuchsia-50 border border-fuchsia-200 text-fuchsia-800' : 'bg-slate-50 border border-slate-100 text-slate-600'
                        }`}>
                          <span className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                            {undoStack.actions.length - i}
                          </span>
                          <span className="flex-1 font-mono text-xs">{action}</span>
                          {i === 0 && (
                            <span className="text-[10px] font-bold uppercase bg-fuchsia-500 text-white px-2 py-0.5 rounded-full">Top</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h4 className="text-sm font-bold text-slate-700 mb-2">How Undo Stack Works</h4>
                <ol className="text-sm text-slate-600 space-y-1 list-decimal list-inside">
                  <li>Every <strong>patient registration</strong> pushes <code>REGISTER_PATIENT:&lt;id&gt;</code> onto the stack</li>
                  <li>Every <strong>bed allocation</strong> pushes <code>ALLOCATE_BED:&lt;hospitalId&gt;:&lt;type&gt;</code></li>
                  <li>Undo pops the top action and reverses it (e.g., removes the patient)</li>
                  <li>Stack is capped at 50 entries; oldest is removed when full</li>
                </ol>
              </div>
            </div>
          )}

          {/* AVL TREE TAB */}
          {activeTab === 'avl' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">AVL Tree (Self-Balancing BST)</h3>
                  <p className="text-sm text-slate-500">Medications stored in a self-balancing binary search tree for O(log n) operations</p>
                </div>
                <button
                  onClick={fetchData}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-100">
                  <div className="flex items-center gap-2 text-emerald-700 mb-1">
                    <Hash className="w-4 h-4" />
                    <span className="text-sm font-semibold">Tree Size</span>
                  </div>
                  <p className="text-3xl font-bold text-emerald-800">{avlStats.size}</p>
                  <p className="text-xs text-emerald-500 mt-1">Nodes</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center gap-2 text-blue-700 mb-1">
                    <Maximize2 className="w-4 h-4" />
                    <span className="text-sm font-semibold">Tree Height</span>
                  </div>
                  <p className="text-3xl font-bold text-blue-800">{avlStats.height}</p>
                  <p className="text-xs text-blue-500 mt-1">Log₂(n) balanced</p>
                </div>
                <div className="bg-gradient-to-br from-fuchsia-50 to-purple-50 rounded-xl p-4 border border-fuchsia-100">
                  <div className="flex items-center gap-2 text-fuchsia-700 mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm font-semibold">Balanced</span>
                  </div>
                  <p className="text-3xl font-bold text-fuchsia-800">{avlStats.isBalanced ? 'Yes' : 'No'}</p>
                  <p className="text-xs text-fuchsia-500 mt-1">|BF| ≤ 1 for all nodes</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
                  <div className="flex items-center gap-2 text-amber-700 mb-1">
                    <Activity className="w-4 h-4" />
                    <span className="text-sm font-semibold">Root Balance</span>
                  </div>
                  <p className="text-3xl font-bold text-amber-800">{avlStats.rootBalanceFactor}</p>
                  <p className="text-xs text-amber-500 mt-1">Balance factor</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                  <TreePine className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-700">Medications (In-Order Traversal)</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold">ID</th>
                        <th className="px-4 py-2 text-left font-semibold">Name</th>
                        <th className="px-4 py-2 text-left font-semibold">Category</th>
                        <th className="px-4 py-2 text-right font-semibold">Stock</th>
                        <th className="px-4 py-2 text-right font-semibold">Price</th>
                        <th className="px-4 py-2 text-left font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {avlMedications.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-2 font-mono text-xs text-slate-500">{m.id.slice(0, 8)}...</td>
                          <td className="px-4 py-2 font-semibold text-slate-700">{m.name}</td>
                          <td className="px-4 py-2 text-slate-500">{m.category}</td>
                          <td className="px-4 py-2 text-right font-semibold text-slate-700">{m.stock}</td>
                          <td className="px-4 py-2 text-right text-slate-500">${m.pricePerUnit?.toFixed(2)}</td>
                          <td className="px-4 py-2">
                            {m.isLowStock && (
                              <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Low Stock</span>
                            )}
                            {m.isExpired && (
                              <span className="text-[10px] font-bold uppercase bg-red-100 text-red-700 px-2 py-0.5 rounded-full ml-1">Expired</span>
                            )}
                            {!m.isLowStock && !m.isExpired && (
                              <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">OK</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h4 className="text-sm font-bold text-slate-700 mb-2">How AVL Tree Works</h4>
                <ol className="text-sm text-slate-600 space-y-1 list-decimal list-inside">
                  <li>Each node stores a <strong>Medication</strong> keyed by ID</li>
                  <li>After every insertion, the <strong>balance factor</strong> (height(left) − height(right)) is checked</li>
                  <li>If |BF| &gt; 1, <strong>rotations</strong> (left/right) restore balance</li>
                  <li>This guarantees O(log n) search, insert, and delete</li>
                </ol>
              </div>
            </div>
          )}

          {/* SORTING TAB */}
          {activeTab === 'sort' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Sorting Algorithms</h3>
                  <p className="text-sm text-slate-500">Compare Bubble Sort and Selection Sort with live comparison counts</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 cursor-pointer"
                  >
                    <option value="severity">Sort by Severity</option>
                    <option value="name">Sort by Name</option>
                    <option value="age">Sort by Age</option>
                    <option value="registration">Sort by Registration Time</option>
                  </select>
                  <select
                    value={sortAlgorithm}
                    onChange={(e) => setSortAlgorithm(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 cursor-pointer"
                  >
                    <option value="bubble">Bubble Sort</option>
                    <option value="selection">Selection Sort</option>
                  </select>
                  <button
                    onClick={fetchData}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-fuchsia-600 text-white rounded-xl text-sm font-semibold hover:bg-fuchsia-700 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Run Sort
                  </button>
                </div>
              </div>

              {sortResult && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-fuchsia-50 to-purple-50 rounded-xl p-4 border border-fuchsia-100">
                    <div className="flex items-center gap-2 text-fuchsia-700 mb-1">
                      <ArrowUpDown className="w-4 h-4" />
                      <span className="text-sm font-semibold">Algorithm</span>
                    </div>
                    <p className="text-xl font-bold text-fuchsia-800 capitalize">{sortResult.algorithm}</p>
                    <p className="text-xs text-fuchsia-500 mt-1">Sort by {sortResult.sortBy}</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
                    <div className="flex items-center gap-2 text-blue-700 mb-1">
                      <Hash className="w-4 h-4" />
                      <span className="text-sm font-semibold">Comparisons</span>
                    </div>
                    <p className="text-3xl font-bold text-blue-800">{sortResult.comparisons}</p>
                    <p className="text-xs text-blue-500 mt-1">Element comparisons</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                    <div className="flex items-center gap-2 text-emerald-700 mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-semibold">Duration</span>
                    </div>
                    <p className="text-3xl font-bold text-emerald-800">{sortResult.durationMs}<span className="text-lg">ms</span></p>
                    <p className="text-xs text-emerald-500 mt-1">Execution time</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
                    <div className="flex items-center gap-2 text-amber-700 mb-1">
                      <Users className="w-4 h-4" />
                      <span className="text-sm font-semibold">Count</span>
                    </div>
                    <p className="text-3xl font-bold text-amber-800">{sortResult.count}</p>
                    <p className="text-xs text-amber-500 mt-1">Patients sorted</p>
                  </div>
                </div>
              )}

              {sortResult && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-semibold text-slate-700">Sorted Patient List</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold">#</th>
                          <th className="px-4 py-2 text-left font-semibold">Name</th>
                          <th className="px-4 py-2 text-right font-semibold">Age</th>
                          <th className="px-4 py-2 text-left font-semibold">Severity</th>
                          <th className="px-4 py-2 text-left font-semibold">Status</th>
                          <th className="px-4 py-2 text-left font-semibold">Registered</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sortResult.patients?.map((p, i) => (
                          <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-2 text-slate-400 font-mono text-xs">{i + 1}</td>
                            <td className="px-4 py-2 font-semibold text-slate-700">{p.name}</td>
                            <td className="px-4 py-2 text-right text-slate-600">{p.age}</td>
                            <td className="px-4 py-2">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                p.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                                p.severity === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                                p.severity === 'MODERATE' ? 'bg-cyan-100 text-cyan-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {p.severity}
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                p.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-slate-500 text-xs">{p.registrationTime}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h4 className="text-sm font-bold text-slate-700 mb-2">How Sorting Works</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                  <div>
                    <p className="font-semibold text-slate-800 mb-1">Bubble Sort</p>
                    <ol className="space-y-0.5 list-decimal list-inside">
                      <li>Iterate through array multiple times</li>
                      <li>Compare adjacent elements</li>
                      <li>Swap if in wrong order</li>
                      <li>Stop early if no swaps (optimized)</li>
                      <li><strong>O(n²)</strong> average, <strong>O(n)</strong> best</li>
                    </ol>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 mb-1">Selection Sort</p>
                    <ol className="space-y-0.5 list-decimal list-inside">
                      <li>Divide array into sorted/unsorted</li>
                      <li>Find minimum in unsorted portion</li>
                      <li>Swap with first unsorted element</li>
                      <li>Expand sorted boundary by one</li>
                      <li><strong>O(n²)</strong> for all cases</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* KRUSKAL MST TAB */}
          {activeTab === 'mst' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Kruskal's Minimum Spanning Tree</h3>
                  <p className="text-sm text-slate-500">Finds optimal road network connecting all hospitals with minimum total distance</p>
                </div>
                <button
                  onClick={fetchData}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {mstResult && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-fuchsia-50 to-purple-50 rounded-xl p-4 border border-fuchsia-100">
                    <div className="flex items-center gap-2 text-fuchsia-700 mb-1">
                      <Network className="w-4 h-4" />
                      <span className="text-sm font-semibold">Total Distance</span>
                    </div>
                    <p className="text-3xl font-bold text-fuchsia-800">{mstResult.totalDistance?.toFixed(1)}<span className="text-lg">km</span></p>
                    <p className="text-xs text-fuchsia-500 mt-1">Sum of MST edges</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
                    <div className="flex items-center gap-2 text-blue-700 mb-1">
                      <Hash className="w-4 h-4" />
                      <span className="text-sm font-semibold">Edges</span>
                    </div>
                    <p className="text-3xl font-bold text-blue-800">{mstResult.edgeCount}</p>
                    <p className="text-xs text-blue-500 mt-1">Roads in MST</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                    <div className="flex items-center gap-2 text-emerald-700 mb-1">
                      <Zap className="w-4 h-4" />
                      <span className="text-sm font-semibold">Comparisons</span>
                    </div>
                    <p className="text-3xl font-bold text-emerald-800">{mstResult.comparisons}</p>
                    <p className="text-xs text-emerald-500 mt-1">Union-Find checks</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
                    <div className="flex items-center gap-2 text-amber-700 mb-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm font-semibold">Connected</span>
                    </div>
                    <p className="text-3xl font-bold text-amber-800">{mstResult.isConnected ? 'Yes' : 'No'}</p>
                    <p className="text-xs text-amber-500 mt-1">All hospitals linked</p>
                  </div>
                </div>
              )}

              {mstResult && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-semibold text-slate-700">MST Edges (Sorted by Distance)</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold">#</th>
                          <th className="px-4 py-2 text-left font-semibold">From</th>
                          <th className="px-4 py-2 text-left font-semibold">To</th>
                          <th className="px-4 py-2 text-right font-semibold">Distance (km)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {mstResult.edges?.map((edge, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-2 text-slate-400 font-mono text-xs">{i + 1}</td>
                            <td className="px-4 py-2 font-semibold text-slate-700">{edge.fromName}</td>
                            <td className="px-4 py-2 font-semibold text-slate-700">{edge.toName}</td>
                            <td className="px-4 py-2 text-right font-bold text-slate-700">{edge.distance.toFixed(1)} km</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h4 className="text-sm font-bold text-slate-700 mb-2">How Kruskal's MST Works</h4>
                <ol className="text-sm text-slate-600 space-y-1 list-decimal list-inside">
                  <li><strong>Sort all edges</strong> (roads) by distance in ascending order</li>
                  <li>Initialize <strong>Union-Find</strong> (Disjoint Set Union) for all hospitals</li>
                  <li>For each edge in sorted order:
                    <ul className="ml-6 list-disc list-inside text-slate-500 mt-0.5">
                      <li>If hospitals are in different sets → add edge to MST and union</li>
                      <li>If same set → skip (would form a cycle)</li>
                    </ul>
                  </li>
                  <li>Stop when all hospitals are connected (V-1 edges)</li>
                  <li><strong>Time:</strong> O(E log E), <strong>Space:</strong> O(V + E)</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
