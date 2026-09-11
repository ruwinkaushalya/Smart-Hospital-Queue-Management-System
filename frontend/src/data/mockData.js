// Sample data for Smart Hospital Queue Management System

export const patients = [
  { id: 'P001', name: 'Alice Cooper', age: 45, contact: '071-1111111', symptoms: 'Chest pain, difficulty breathing', severity: 'CRITICAL', status: 'waiting', registrationTime: '2026-06-08T08:30:00', estimatedWait: 5, aiScore: 0.92, assignedHospital: null },
  { id: 'P002', name: 'Bob Martin', age: 32, contact: '071-2222222', symptoms: 'Broken leg from accident', severity: 'HIGH', status: 'waiting', registrationTime: '2026-06-08T08:45:00', estimatedWait: 15, aiScore: 0.78, assignedHospital: null },
  { id: 'P003', name: 'Carol White', age: 67, contact: '071-3333333', symptoms: 'High fever, dehydration', severity: 'MODERATE', status: 'waiting', registrationTime: '2026-06-08T09:00:00', estimatedWait: 35, aiScore: 0.55, assignedHospital: null },
  { id: 'P004', name: 'David Lee', age: 28, contact: '071-4444444', symptoms: 'Severe allergic reaction', severity: 'HIGH', status: 'waiting', registrationTime: '2026-06-08T09:10:00', estimatedWait: 20, aiScore: 0.81, assignedHospital: null },
  { id: 'P005', name: 'Emma Wilson', age: 55, contact: '071-5555555', symptoms: 'Migraine, dizziness', severity: 'LOW', status: 'waiting', registrationTime: '2026-06-08T09:30:00', estimatedWait: 55, aiScore: 0.32, assignedHospital: null },
  { id: 'P006', name: 'Frank Harris', age: 72, contact: '071-6666666', symptoms: 'Chest tightness', severity: 'CRITICAL', status: 'in-progress', registrationTime: '2026-06-08T08:15:00', estimatedWait: 0, aiScore: 0.95, assignedHospital: 'City General Hospital' },
  { id: 'P007', name: 'Grace Taylor', age: 19, contact: '071-7777777', symptoms: 'Sprained ankle', severity: 'LOW', status: 'waiting', registrationTime: '2026-06-08T09:45:00', estimatedWait: 60, aiScore: 0.28, assignedHospital: null },
  { id: 'P008', name: 'Henry Clark', age: 41, contact: '071-8888888', symptoms: 'Abdominal pain', severity: 'MODERATE', status: 'waiting', registrationTime: '2026-06-08T10:00:00', estimatedWait: 40, aiScore: 0.48, assignedHospital: null },
  { id: 'P009', name: 'Irene Scott', age: 33, contact: '071-9999999', symptoms: 'Difficulty breathing, wheezing', severity: 'CRITICAL', status: 'waiting', registrationTime: '2026-06-08T10:15:00', estimatedWait: 8, aiScore: 0.89, assignedHospital: null },
  { id: 'P010', name: 'Jack Brown', age: 60, contact: '071-1010101', symptoms: 'Head injury from fall', severity: 'HIGH', status: 'waiting', registrationTime: '2026-06-08T10:30:00', estimatedWait: 18, aiScore: 0.76, assignedHospital: null },
  { id: 'P011', name: 'Kelly Adams', age: 25, contact: '071-1212121', symptoms: 'Fever, sore throat', severity: 'LOW', status: 'completed', registrationTime: '2026-06-08T07:30:00', estimatedWait: 0, aiScore: 0.25, assignedHospital: 'Metro Medical Center' },
  { id: 'P012', name: 'Liam Turner', age: 50, contact: '071-1313131', symptoms: 'Back pain, numbness', severity: 'MODERATE', status: 'waiting', registrationTime: '2026-06-08T10:45:00', estimatedWait: 42, aiScore: 0.45, assignedHospital: null },
];

export const hospitals = [
  { id: 'H1', name: 'City General Hospital', address: '123 Main St, Colombo', lat: 6.9271, lng: 79.8612, totalBeds: 200, availableBeds: 45, totalICU: 20, availableICU: 8, doctors: 15, availableDoctors: 5, hasEmergency: true, loadFactor: 0.78 },
  { id: 'H2', name: 'Metro Medical Center', address: '456 Park Ave, Colombo', lat: 6.8500, lng: 79.9000, totalBeds: 150, availableBeds: 60, totalICU: 15, availableICU: 10, doctors: 10, availableDoctors: 7, hasEmergency: true, loadFactor: 0.60 },
  { id: 'H3', name: "St. Mary's Hospital", address: '789 Hill Rd, Colombo', lat: 6.9500, lng: 79.8200, totalBeds: 100, availableBeds: 35, totalICU: 10, availableICU: 3, doctors: 8, availableDoctors: 2, hasEmergency: true, loadFactor: 0.65 },
  { id: 'H4', name: 'Northside Clinic', address: '321 North Blvd, Colombo', lat: 7.0000, lng: 79.8800, totalBeds: 80, availableBeds: 50, totalICU: 5, availableICU: 5, doctors: 5, availableDoctors: 4, hasEmergency: false, loadFactor: 0.38 },
  { id: 'H5', name: 'Emergency Care Unit', address: '555 Rapid Ln, Colombo', lat: 6.8800, lng: 79.9500, totalBeds: 50, availableBeds: 15, totalICU: 25, availableICU: 12, doctors: 12, availableDoctors: 3, hasEmergency: true, loadFactor: 0.70 },
  { id: 'H6', name: 'Dehiwala General Hospital', address: '22 Galle Rd, Dehiwala', lat: 6.8650, lng: 79.8650, totalBeds: 120, availableBeds: 55, totalICU: 8, availableICU: 4, doctors: 6, availableDoctors: 3, hasEmergency: true, loadFactor: 0.54 },
  { id: 'H7', name: 'Maharagama Cancer Hospital', address: '100 Hospital Rd, Maharagama', lat: 6.8450, lng: 79.9200, totalBeds: 180, availableBeds: 70, totalICU: 12, availableICU: 7, doctors: 9, availableDoctors: 5, hasEmergency: true, loadFactor: 0.61 },
  { id: 'H8', name: 'Ratmalana District Hospital', address: '45 Beach Rd, Ratmalana', lat: 6.8300, lng: 79.8800, totalBeds: 90, availableBeds: 40, totalICU: 6, availableICU: 3, doctors: 4, availableDoctors: 2, hasEmergency: false, loadFactor: 0.56 },
  { id: 'H9', name: 'Kalubowila Teaching Hospital', address: '77 Hospital Rd, Kalubowila', lat: 6.8950, lng: 79.8750, totalBeds: 250, availableBeds: 80, totalICU: 30, availableICU: 15, doctors: 18, availableDoctors: 8, hasEmergency: true, loadFactor: 0.68 },
  { id: 'H10', name: 'Nawaloka Hospital', address: '66 Nawala Rd, Nawala', lat: 6.9100, lng: 79.8550, totalBeds: 160, availableBeds: 65, totalICU: 14, availableICU: 9, doctors: 11, availableDoctors: 6, hasEmergency: true, loadFactor: 0.59 },
];

export const roads = [
  { from: 'H1', to: 'H2', distance: 8.5 },
  { from: 'H1', to: 'H3', distance: 5.2 },
  { from: 'H1', to: 'H4', distance: 12.0 },
  { from: 'H1', to: 'H6', distance: 6.2 },
  { from: 'H1', to: 'H9', distance: 4.1 },
  { from: 'H1', to: 'H10', distance: 3.5 },
  { from: 'H2', to: 'H3', distance: 9.8 },
  { from: 'H2', to: 'H5', distance: 4.3 },
  { from: 'H2', to: 'H6', distance: 5.8 },
  { from: 'H2', to: 'H7', distance: 3.2 },
  { from: 'H2', to: 'H8', distance: 4.5 },
  { from: 'H3', to: 'H4', distance: 7.1 },
  { from: 'H3', to: 'H5', distance: 11.2 },
  { from: 'H3', to: 'H7', distance: 8.0 },
  { from: 'H3', to: 'H9', distance: 5.5 },
  { from: 'H4', to: 'H5', distance: 15.5 },
  { from: 'H4', to: 'H9', distance: 6.3 },
  { from: 'H5', to: 'H7', distance: 5.0 },
  { from: 'H5', to: 'H8', distance: 7.2 },
  { from: 'H5', to: 'H9', distance: 6.8 },
  { from: 'H6', to: 'H8', distance: 5.1 },
  { from: 'H6', to: 'H9', distance: 2.8 },
  { from: 'H6', to: 'H10', distance: 2.1 },
  { from: 'H7', to: 'H8', distance: 3.8 },
  { from: 'H8', to: 'H9', distance: 4.0 },
  { from: 'H9', to: 'H10', distance: 1.9 },
];

export const ambulances = [
  { id: 'A001', driver: 'John Smith', contact: '077-1234567', status: 'AVAILABLE', lat: 6.9000, lng: 79.8700, patient: null, destination: null, distance: 0, eta: 0 },
  { id: 'A002', driver: 'Sarah Johnson', contact: '077-2345678', status: 'DISPATCHED', lat: 6.9400, lng: 79.8500, patient: 'Frank Harris', destination: 'City General Hospital', distance: 3.2, eta: 8 },
  { id: 'A003', driver: 'Michael Brown', contact: '077-3456789', status: 'AVAILABLE', lat: 6.8600, lng: 79.9200, patient: null, destination: null, distance: 0, eta: 0 },
  { id: 'A004', driver: 'Emily Davis', contact: '077-4567890', status: 'EN_ROUTE', lat: 6.9800, lng: 79.8900, patient: 'Irene Scott', destination: 'Emergency Care Unit', distance: 5.5, eta: 12 },
  { id: 'A005', driver: 'Robert Wilson', contact: '077-5678901', status: 'AVAILABLE', lat: 6.8700, lng: 79.8900, patient: null, destination: null, distance: 0, eta: 0 },
  { id: 'A006', driver: 'Lisa Chen', contact: '077-6789012', status: 'AVAILABLE', lat: 6.8400, lng: 79.9100, patient: null, destination: null, distance: 0, eta: 0 },
  { id: 'A007', driver: 'James Miller', contact: '077-7890123', status: 'EN_ROUTE', lat: 6.9200, lng: 79.8400, patient: 'Jack Brown', destination: 'St. Mary\'s Hospital', distance: 4.8, eta: 10 },
];

export const queueStats = {
  totalWaiting: 9,
  emergencyCount: 3,
  normalCount: 6,
  treatedCount: 2,
  avgWaitTime: 32,
  criticalRatio: 0.33,
  status: 'MODERATE LOAD',
  throughput: 45,
};

export const severityDistribution = [
  { name: 'Critical', value: 3, color: '#ef4444' },
  { name: 'High', value: 3, color: '#f97316' },
  { name: 'Moderate', value: 3, color: '#3b82f6' },
  { name: 'Low', value: 3, color: '#22c55e' },
];

export const hourlyVolume = [
  { hour: '06:00', emergency: 2, normal: 1 },
  { hour: '07:00', emergency: 1, normal: 3 },
  { hour: '08:00', emergency: 3, normal: 2 },
  { hour: '09:00', emergency: 2, normal: 4 },
  { hour: '10:00', emergency: 4, normal: 3 },
  { hour: '11:00', emergency: 1, normal: 2 },
];

export const waitTimeTrend = [
  { day: 'Mon', avgWait: 28, predicted: 30 },
  { day: 'Tue', avgWait: 35, predicted: 32 },
  { day: 'Wed', avgWait: 42, predicted: 38 },
  { day: 'Thu', avgWait: 30, predicted: 33 },
  { day: 'Fri', avgWait: 38, predicted: 36 },
  { day: 'Sat', avgWait: 25, predicted: 28 },
  { day: 'Sun', avgWait: 22, predicted: 25 },
];
