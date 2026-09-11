const API_BASE = 'http://localhost:8080/api';

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

export const getPatients = () => fetchJson(`${API_BASE}/patients`);
export const getEmergencyPatients = () => fetchJson(`${API_BASE}/patients/emergency`);
export const getNormalPatients = () => fetchJson(`${API_BASE}/patients/normal`);
export const getQueueStatus = () => fetchJson(`${API_BASE}/queues/status`);
export const getHospitals = () => fetchJson(`${API_BASE}/hospitals`);
export const getRoads = () => fetchJson(`${API_BASE}/roads`);
export const getAmbulances = () => fetchJson(`${API_BASE}/ambulances`);
export const getShortestPath = (from, to) => fetchJson(`${API_BASE}/dispatch/shortest-path?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
export const getAnalytics = () => fetchJson(`${API_BASE}/analytics`);
export const getAISuggestions = () => fetchJson(`${API_BASE}/ai/suggestions`);
export const getDoctors = () => fetchJson(`${API_BASE}/doctors`);
export const getPendingBeds = () => fetchJson(`${API_BASE}/pending-beds`);
export const getNotifications = () => fetchJson(`${API_BASE}/notifications`);
export const processNextPatient = () => fetchJson(`${API_BASE}/queues/process-next`, { method: 'POST' });
export const simulateEmergency = () => fetchJson(`${API_BASE}/queues/simulate-emergency`, { method: 'POST' });
export const clearQueue = () => fetchJson(`${API_BASE}/queues/clear`, { method: 'POST' });
export const emergencyICURequest = () => fetchJson(`${API_BASE}/queues/emergency-icu`, { method: 'POST' });
export const allocateBed = (hospitalId, bedType) => fetchJson(`${API_BASE}/beds/allocate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hospitalId, bedType }) });
export const dischargeBed = (hospitalId, bedType) => fetchJson(`${API_BASE}/beds/discharge`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hospitalId, bedType }) });
export const dispatchAmbulance = (type, hospitalId) => fetchJson(`${API_BASE}/ambulance/dispatch`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, hospitalId }) });
export const createPatient = (patient) => fetchJson(`${API_BASE}/patients`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patient) });
export const getQueuePosition = (patientId) => fetchJson(`${API_BASE}/patients/queue-position?patientId=${encodeURIComponent(patientId)}`);

// NEW FEATURES
export const getMedications = () => fetchJson(`${API_BASE}/medications`);
export const createMedication = (medication) => fetchJson(`${API_BASE}/medications`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(medication) });
export const getLowStockMedications = () => fetchJson(`${API_BASE}/medications/low-stock`);
export const getExpiredMedications = () => fetchJson(`${API_BASE}/medications/expired`);
export const searchMedications = (name) => fetchJson(`${API_BASE}/medications/search?name=${encodeURIComponent(name)}`);
export const updateMedicationStock = (id, delta) => fetchJson(`${API_BASE}/medications/stock`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, delta }) });
export const getVisitRecords = () => fetchJson(`${API_BASE}/visit-records`);
export const createVisitRecord = (record) => fetchJson(`${API_BASE}/visit-records`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(record) });
export const getPatientHistory = (patientId) => fetchJson(`${API_BASE}/visit-records/patient?patientId=${encodeURIComponent(patientId)}`);
export const getInvoices = () => fetchJson(`${API_BASE}/invoices`);
export const generateInvoice = (invoice) => fetchJson(`${API_BASE}/invoices/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(invoice) });
export const generateInvoiceFromVisit = (visitId) => fetchJson(`${API_BASE}/invoices/generate-from-visit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visitId }) });
export const payInvoice = (invoiceId) => fetchJson(`${API_BASE}/invoices/pay`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ invoiceId }) });
export const getRevenueAnalytics = () => fetchJson(`${API_BASE}/invoices/revenue`);

// REPORT FEATURES
export const getReports = () => fetchJson(`${API_BASE}/reports`);
export const getPatientReports = (patientId) => fetchJson(`${API_BASE}/reports/patient?patientId=${encodeURIComponent(patientId)}`);
export const createReport = (report) => fetchJson(`${API_BASE}/reports`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(report) });
export const downloadReport = (reportId) => fetchJson(`${API_BASE}/reports/download?reportId=${encodeURIComponent(reportId)}`);

// CW SCOPE FEATURES
export const undoLastAction = () => fetchJson(`${API_BASE}/undo`, { method: 'POST' });
export const getUndoStack = () => fetchJson(`${API_BASE}/undo/stack`);
export const getAVLMedications = () => fetchJson(`${API_BASE}/avl/medications`);
export const getAVLStats = () => fetchJson(`${API_BASE}/avl/stats`);
export const sortPatients = (sortBy, algorithm) => fetchJson(`${API_BASE}/sort/patients?sortBy=${encodeURIComponent(sortBy)}&algorithm=${encodeURIComponent(algorithm)}`);
export const getKruskalMST = () => fetchJson(`${API_BASE}/mst/roads`);

// AUTH
export const login = (username, password) => fetchJson(`${API_BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
export const register = (user) => fetchJson(`${API_BASE}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(user) });
export const logout = (token) => fetchJson(`${API_BASE}/auth/logout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
export const getMe = (token) => fetchJson(`${API_BASE}/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } });
export const getUsers = () => fetchJson(`${API_BASE}/auth/users`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } });

// ADMIN USER MANAGEMENT
export const adminCreateUser = (user) => fetchJson(`${API_BASE}/admin/users`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }, body: JSON.stringify(user) });
export const adminUpdateUser = (id, user) => fetchJson(`${API_BASE}/admin/users/detail?id=${encodeURIComponent(id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }, body: JSON.stringify(user) });
export const adminDeleteUser = (id) => fetchJson(`${API_BASE}/admin/users/detail?id=${encodeURIComponent(id)}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } });
export const adminGetUser = (id) => fetchJson(`${API_BASE}/admin/users/detail?id=${encodeURIComponent(id)}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } });

export const getHourlyVolume = () => {
  return Promise.resolve([
    { hour: '00:00', emergency: 2, normal: 1 },
    { hour: '04:00', emergency: 1, normal: 0 },
    { hour: '08:00', emergency: 5, normal: 8 },
    { hour: '12:00', emergency: 4, normal: 12 },
    { hour: '16:00', emergency: 3, normal: 10 },
    { hour: '20:00', emergency: 6, normal: 5 },
  ]);
};

export const getWaitTimeTrend = () => {
  return Promise.resolve([
    { day: 'Mon', avgWait: 45, predicted: 42 },
    { day: 'Tue', avgWait: 38, predicted: 40 },
    { day: 'Wed', avgWait: 52, predicted: 48 },
    { day: 'Thu', avgWait: 41, predicted: 43 },
    { day: 'Fri', avgWait: 35, predicted: 37 },
    { day: 'Sat', avgWait: 28, predicted: 30 },
    { day: 'Sun', avgWait: 25, predicted: 27 },
  ]);
};

export function subscribeToRealtime(callback) {
  const source = new EventSource(`${API_BASE}/events`);
  source.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      callback(data);
    } catch (e) {
      console.error('SSE parse error:', e);
    }
  };
  source.onerror = (e) => {
    console.error('SSE error:', e);
  };
  return () => {
    source.close();
  };
}
