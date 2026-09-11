package com.hospital.api;

import com.hospital.ai.AIDecisionSupport;
import com.hospital.datastructures.DijkstraAlgorithm;
import com.hospital.datastructures.HospitalGraph;
import com.hospital.db.DatabaseManager;
import com.hospital.db.HospitalRepository;
import com.hospital.db.PatientRepository;
import com.hospital.db.AmbulanceRepository;
import com.hospital.db.RoadRepository;
import com.hospital.model.Ambulance;
import com.hospital.model.Doctor;
import com.hospital.model.Hospital;
import com.hospital.model.Notification;
import com.hospital.model.Patient;
import com.hospital.model.Medication;
import com.hospital.model.VisitRecord;
import com.hospital.model.Invoice;
import com.hospital.model.Report;
import com.hospital.model.User;
import com.hospital.db.UserRepository;
import com.hospital.service.DispatchService;
import com.hospital.service.NotificationService;
import com.hospital.service.QueueManager;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.OutputStream;
import java.io.InputStreamReader;
import java.io.BufferedReader;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class RestApiServer {

    private static final int PORT = 8080;
    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    private static QueueManager queueManager;
    private static DispatchService dispatchService;
    private static RealtimeBroadcaster broadcaster;
    private static UserRepository userRepo;

    public static void main(String[] args) throws IOException {
        initData();

        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);

        // API Routes
        server.createContext("/api/patients", new PatientsHandler());
        server.createContext("/api/patients/emergency", new EmergencyQueueHandler());
        server.createContext("/api/patients/normal", new NormalQueueHandler());
        server.createContext("/api/patients/queue-position", new QueuePositionHandler());
        server.createContext("/api/queues/status", new QueueStatusHandler());
        server.createContext("/api/hospitals", new HospitalsHandler());
        server.createContext("/api/roads", new RoadsHandler());
        server.createContext("/api/ambulances", new AmbulancesHandler());
        server.createContext("/api/dispatch/shortest-path", new ShortestPathHandler());
        server.createContext("/api/analytics", new AnalyticsHandler());
        server.createContext("/api/ai/suggestions", new AISuggestionsHandler());
        server.createContext("/api/events", new SSEHandler());
        server.createContext("/api/queues/process-next", new ProcessNextHandler());
        server.createContext("/api/queues/simulate-emergency", new SimulateEmergencyHandler());
        server.createContext("/api/queues/clear", new ClearQueueHandler());
        server.createContext("/api/queues/emergency-icu", new EmergencyICUHandler());
        server.createContext("/api/beds/allocate", new AllocateBedHandler());
        server.createContext("/api/beds/discharge", new DischargeBedHandler());
        server.createContext("/api/ambulance/dispatch", new DispatchAmbulanceHandler());
        server.createContext("/api/doctors", new DoctorsHandler());
        server.createContext("/api/pending-beds", new PendingBedsHandler());
        server.createContext("/api/notifications", new NotificationsHandler());
        // AUTH ENDPOINTS
        server.createContext("/api/auth/login", new LoginHandler());
        server.createContext("/api/auth/register", new RegisterHandler());
        server.createContext("/api/auth/logout", new LogoutHandler());
        server.createContext("/api/auth/me", new MeHandler());
        server.createContext("/api/auth/users", new UsersHandler());
        // ADMIN USER MANAGEMENT
        server.createContext("/api/admin/users", new AdminUsersHandler());
        server.createContext("/api/admin/users/detail", new AdminUserDetailHandler());
        // NEW FEATURES
        server.createContext("/api/medications", new MedicationsHandler());
        server.createContext("/api/medications/low-stock", new LowStockHandler());
        server.createContext("/api/medications/expired", new ExpiredHandler());
        server.createContext("/api/medications/search", new MedicationSearchHandler());
        server.createContext("/api/medications/stock", new UpdateStockHandler());
        server.createContext("/api/visit-records", new VisitRecordsHandler());
        server.createContext("/api/visit-records/patient", new PatientHistoryHandler());
        server.createContext("/api/invoices", new InvoicesHandler());
        server.createContext("/api/invoices/generate", new GenerateInvoiceHandler());
        server.createContext("/api/invoices/generate-from-visit", new GenerateInvoiceFromVisitHandler());
        server.createContext("/api/invoices/pay", new PayInvoiceHandler());
        server.createContext("/api/invoices/revenue", new RevenueAnalyticsHandler());
        // CW SCOPE FEATURES
        server.createContext("/api/undo", new UndoHandler());
        server.createContext("/api/undo/stack", new UndoStackHandler());
        server.createContext("/api/avl/medications", new AVLMedicationsHandler());
        server.createContext("/api/avl/stats", new AVLStatsHandler());
        server.createContext("/api/sort/patients", new SortPatientsHandler());
        server.createContext("/api/mst/roads", new KruskalMSTHandler());
        // REPORT FEATURES
        server.createContext("/api/reports", new ReportsHandler());
        server.createContext("/api/reports/patient", new PatientReportsHandler());
        server.createContext("/api/reports/download", new ReportDownloadHandler());

        server.setExecutor(Executors.newCachedThreadPool());
        server.start();

        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            System.out.println("Shutting down server...");
            broadcaster.shutdown();
            DatabaseManager.resetSchema();
            server.stop(0);
        }));

        System.out.println("Smart Hospital REST API Server running on http://localhost:" + PORT);
        System.out.println("Available endpoints:");
        System.out.println("  GET  /api/patients");
        System.out.println("  POST /api/patients");
        System.out.println("  GET  /api/patients/emergency");
        System.out.println("  GET  /api/patients/normal");
        System.out.println("  GET  /api/queues/status");
        System.out.println("  GET  /api/hospitals");
        System.out.println("  GET  /api/roads");
        System.out.println("  GET  /api/ambulances");
        System.out.println("  GET  /api/dispatch/shortest-path?from=H1&to=H2");
        System.out.println("  GET  /api/analytics");
        System.out.println("  GET  /api/ai/suggestions");
        System.out.println("  GET  /api/events          (SSE real-time stream)");
        System.out.println("  POST /api/queues/process-next");
        System.out.println("  POST /api/queues/simulate-emergency");
        System.out.println("  POST /api/queues/clear");
        System.out.println("  POST /api/queues/emergency-icu");
        System.out.println("  POST /api/beds/allocate");
        System.out.println("  POST /api/beds/discharge");
        System.out.println("  POST /api/ambulance/dispatch");
        System.out.println("  GET  /api/doctors");
        System.out.println("  GET  /api/pending-beds");
        System.out.println("  GET  /api/notifications");
        System.out.println("  POST /api/auth/login");
        System.out.println("  POST /api/auth/register");
        System.out.println("  POST /api/auth/logout");
        System.out.println("  GET  /api/auth/me");
        System.out.println("  GET  /api/auth/users");
        System.out.println("  POST /api/admin/users");
        System.out.println("  PUT  /api/admin/users/detail?id=...");
        System.out.println("  DELETE /api/admin/users/detail?id=...");
        System.out.println("  GET  /api/admin/users/detail?id=...");
        // NEW FEATURES
        System.out.println("  GET  /api/medications");
        System.out.println("  POST /api/medications");
        System.out.println("  GET  /api/medications/low-stock");
        System.out.println("  GET  /api/medications/expired");
        System.out.println("  GET  /api/medications/search?name=...");
        System.out.println("  POST /api/medications/stock");
        System.out.println("  GET  /api/visit-records");
        System.out.println("  POST /api/visit-records");
        System.out.println("  GET  /api/visit-records/patient?patientId=...");
        System.out.println("  GET  /api/invoices");
        System.out.println("  POST /api/invoices/generate");
        System.out.println("  POST /api/invoices/generate-from-visit");
        System.out.println("  POST /api/invoices/pay");
        System.out.println("  GET  /api/invoices/revenue");
        // CW SCOPE FEATURES
        System.out.println("  POST /api/undo");
        System.out.println("  GET  /api/undo/stack");
        System.out.println("  GET  /api/avl/medications");
        System.out.println("  GET  /api/avl/stats");
        System.out.println("  GET  /api/sort/patients");
        System.out.println("  GET  /api/mst/roads");
        // REPORT FEATURES
        System.out.println("  GET  /api/reports");
        System.out.println("  POST /api/reports");
        System.out.println("  GET  /api/reports/patient?patientId=...");
        System.out.println("  GET  /api/reports/download?reportId=...");
    }

    private static void initData() {
        queueManager = new QueueManager();
        dispatchService = new DispatchService();

        broadcaster = new RealtimeBroadcaster();
        queueManager.addListener(broadcaster);
        dispatchService.addListener(broadcaster);

        HospitalRepository hospitalRepo = new HospitalRepository();
        PatientRepository patientRepo = new PatientRepository();
        AmbulanceRepository ambulanceRepo = new AmbulanceRepository();
        RoadRepository roadRepo = new RoadRepository();
        com.hospital.db.DoctorRepository doctorRepo = new com.hospital.db.DoctorRepository();
        com.hospital.db.MedicationRepository medicationRepo = new com.hospital.db.MedicationRepository();
        com.hospital.db.VisitRecordRepository visitRecordRepo = new com.hospital.db.VisitRecordRepository();
        com.hospital.db.InvoiceRepository invoiceRepo = new com.hospital.db.InvoiceRepository();
        com.hospital.db.ReportRepository reportRepo = new com.hospital.db.ReportRepository();
        userRepo = new UserRepository();

        List<Hospital> dbHospitals;
        try {
            dbHospitals = hospitalRepo.findAll();
        } catch (Exception e) {
            System.err.println("Failed to load hospitals from H2: " + e.getMessage());
            System.out.println("H2 database load failed. Seeding with default data...");
            seedDefaultData();
            return;
        }

        if (!dbHospitals.isEmpty()) {
            System.out.println("Loading data from H2 database...");
            for (Hospital h : dbHospitals) {
                queueManager.addHospital(h);
                dispatchService.addHospital(h);
            }
            List<RoadRepository.RoadRecord> dbRoads;
            List<Ambulance> dbAmbulances;
            List<Patient> dbPatients;
            List<com.hospital.model.Doctor> dbDoctors;
            try {
                dbRoads = roadRepo.findAll();
                dbAmbulances = ambulanceRepo.findAll();
                dbPatients = patientRepo.findAll();
                dbDoctors = doctorRepo.findAll();
            } catch (Exception e) {
                System.err.println("Failed to load data from H2: " + e.getMessage());
                System.out.println("H2 database load incomplete. Seeding with default data...");
                seedDefaultData();
                return;
            }
            for (RoadRepository.RoadRecord r : dbRoads) {
                dispatchService.addRoad(r.fromId, r.toId, r.distanceKm);
            }
            for (Ambulance a : dbAmbulances) {
                dispatchService.addAmbulance(a);
            }
            for (com.hospital.model.Doctor d : dbDoctors) {
                queueManager.addDoctor(d);
            }
            for (Patient p : dbPatients) {
                if (!p.isTreated()) {
                    queueManager.registerPatient(p, false);
                } else if (p.getStatus() == Patient.PatientStatus.PENDING_BED) {
                    queueManager.addPendingBedPatient(p);
                }
            }
            dispatchService.resolveAmbulanceRelationships(dbPatients);

            // Load new features from DB
            List<Medication> dbMedications;
            List<VisitRecord> dbVisitRecords;
            List<Invoice> dbInvoices;
            try {
                dbMedications = medicationRepo.findAll();
                dbVisitRecords = visitRecordRepo.findAll();
                dbInvoices = invoiceRepo.findAll();
            } catch (Exception e) {
                System.err.println("Failed to load new features from H2: " + e.getMessage());
                dbMedications = new java.util.ArrayList<>();
                dbVisitRecords = new java.util.ArrayList<>();
                dbInvoices = new java.util.ArrayList<>();
            }
            for (Medication m : dbMedications) {
                queueManager.loadMedication(m);
            }
            for (VisitRecord v : dbVisitRecords) {
                queueManager.loadVisitRecord(v);
            }
            for (Invoice i : dbInvoices) {
                queueManager.loadInvoice(i);
            }
            // Load reports from DB
            List<Report> dbReports;
            try {
                dbReports = reportRepo.findAll();
            } catch (Exception e) {
                System.err.println("Failed to load reports from H2: " + e.getMessage());
                dbReports = new java.util.ArrayList<>();
            }
            for (Report r : dbReports) {
                queueManager.loadReport(r);
            }
            // Reconstruct auto-generated visit IDs from invoice descriptions
            for (Invoice i : dbInvoices) {
                String desc = i.getDescription();
                if (desc != null && desc.startsWith("Auto-generated from visit ")) {
                    String afterPrefix = desc.replace("Auto-generated from visit ", "");
                    String[] parts = afterPrefix.split(":");
                    if (parts.length > 0) {
                        String visitId = parts[0].trim();
                        if (!visitId.isEmpty()) {
                            queueManager.getAutoGeneratedVisitIds().add(visitId);
                        }
                    }
                }
            }
            System.out.println("Loaded " + dbHospitals.size() + " hospitals, " + dbRoads.size() + " roads, " + dbAmbulances.size() + " ambulances, " + dbPatients.size() + " patients, " + dbDoctors.size() + " doctors, " + dbMedications.size() + " medications, " + dbVisitRecords.size() + " visit records, " + dbInvoices.size() + " invoices, " + dbReports.size() + " reports from H2.");

            // Seed new features if their tables are empty
            if (dbMedications.isEmpty()) {
                System.out.println("Seeding default medications...");
                seedMedications();
            }
            if (dbVisitRecords.isEmpty()) {
                System.out.println("Seeding default visit records...");
                seedVisitRecords(dbPatients);
            }
            if (dbInvoices.isEmpty()) {
                System.out.println("Seeding default invoices...");
                seedInvoices(dbPatients);
            }
            // Seed default admin user if no users exist
            if (userRepo.count() == 0) {
                System.out.println("Seeding default admin user...");
                seedDefaultUsers();
            }
        } else {
            System.out.println("H2 database is empty. Seeding with default data...");
            seedDefaultData();
        }
    }

    private static void seedDefaultData() {
        Hospital h1 = new Hospital("H1", "City General Hospital", "123 Main St", 6.9271, 79.8612, 200, 20, 15, true);
        Hospital h2 = new Hospital("H2", "Metro Medical Center", "456 Park Ave", 6.8500, 79.9000, 150, 15, 10, true);
        Hospital h3 = new Hospital("H3", "St. Mary's Hospital", "789 Hill Rd", 6.9500, 79.8200, 100, 10, 8, true);
        Hospital h4 = new Hospital("H4", "Northside Clinic", "321 North Blvd", 7.0000, 79.8800, 80, 5, 5, false);
        Hospital h5 = new Hospital("H5", "Emergency Care Unit", "555 Rapid Ln", 6.8800, 79.9500, 50, 25, 12, true);
        Hospital h6 = new Hospital("H6", "Dehiwala General Hospital", "22 Galle Rd", 6.8650, 79.8650, 120, 8, 6, true);
        Hospital h7 = new Hospital("H7", "Maharagama Cancer Hospital", "100 Hospital Rd", 6.8450, 79.9200, 180, 12, 9, true);
        Hospital h8 = new Hospital("H8", "Ratmalana District Hospital", "45 Beach Rd", 6.8300, 79.8800, 90, 6, 4, false);
        Hospital h9 = new Hospital("H9", "Kalubowila Teaching Hospital", "77 Hospital Rd", 6.8950, 79.8750, 250, 30, 18, true);
        Hospital h10 = new Hospital("H10", "Nawaloka Hospital", "66 Nawala Rd", 6.9100, 79.8550, 160, 14, 11, true);

        queueManager.addHospital(h1);
        queueManager.addHospital(h2);
        queueManager.addHospital(h3);
        queueManager.addHospital(h4);
        queueManager.addHospital(h5);
        queueManager.addHospital(h6);
        queueManager.addHospital(h7);
        queueManager.addHospital(h8);
        queueManager.addHospital(h9);
        queueManager.addHospital(h10);

        dispatchService.addHospital(h1);
        dispatchService.addHospital(h2);
        dispatchService.addHospital(h3);
        dispatchService.addHospital(h4);
        dispatchService.addHospital(h5);
        dispatchService.addHospital(h6);
        dispatchService.addHospital(h7);
        dispatchService.addHospital(h8);
        dispatchService.addHospital(h9);
        dispatchService.addHospital(h10);

        dispatchService.addRoad("H1", "H2", 8.5);
        dispatchService.addRoad("H1", "H3", 5.2);
        dispatchService.addRoad("H1", "H4", 12.0);
        dispatchService.addRoad("H1", "H6", 6.2);
        dispatchService.addRoad("H1", "H9", 4.1);
        dispatchService.addRoad("H1", "H10", 3.5);
        dispatchService.addRoad("H2", "H3", 9.8);
        dispatchService.addRoad("H2", "H5", 4.3);
        dispatchService.addRoad("H2", "H6", 5.8);
        dispatchService.addRoad("H2", "H7", 3.2);
        dispatchService.addRoad("H2", "H8", 4.5);
        dispatchService.addRoad("H3", "H4", 7.1);
        dispatchService.addRoad("H3", "H5", 11.2);
        dispatchService.addRoad("H3", "H7", 8.0);
        dispatchService.addRoad("H3", "H9", 5.5);
        dispatchService.addRoad("H4", "H5", 15.5);
        dispatchService.addRoad("H4", "H9", 6.3);
        dispatchService.addRoad("H5", "H7", 5.0);
        dispatchService.addRoad("H5", "H8", 7.2);
        dispatchService.addRoad("H5", "H9", 6.8);
        dispatchService.addRoad("H6", "H8", 5.1);
        dispatchService.addRoad("H6", "H9", 2.8);
        dispatchService.addRoad("H6", "H10", 2.1);
        dispatchService.addRoad("H7", "H8", 3.8);
        dispatchService.addRoad("H8", "H9", 4.0);
        dispatchService.addRoad("H9", "H10", 1.9);

        dispatchService.addAmbulance(new Ambulance("John Smith", "077-1234567", 6.9000, 79.8700));
        dispatchService.addAmbulance(new Ambulance("Sarah Johnson", "077-2345678", 6.9400, 79.8500));
        dispatchService.addAmbulance(new Ambulance("Michael Brown", "077-3456789", 6.8600, 79.9200));
        dispatchService.addAmbulance(new Ambulance("Emily Davis", "077-4567890", 6.9800, 79.8900));
        dispatchService.addAmbulance(new Ambulance("Robert Wilson", "077-5678901", 6.8700, 79.8900));
        dispatchService.addAmbulance(new Ambulance("Lisa Chen", "077-6789012", 6.8400, 79.9100));
        dispatchService.addAmbulance(new Ambulance("James Miller", "077-7890123", 6.9200, 79.8400));

        Patient p1 = new Patient("Alice Cooper", 45, "071-1111111", "Chest pain, difficulty breathing", Patient.Severity.CRITICAL);
        Patient p2 = new Patient("Bob Martin", 32, "071-2222222", "Broken leg from accident", Patient.Severity.HIGH);
        Patient p3 = new Patient("Carol White", 67, "071-3333333", "High fever, dehydration", Patient.Severity.MODERATE);
        Patient p4 = new Patient("David Lee", 28, "071-4444444", "Severe allergic reaction", Patient.Severity.HIGH);
        Patient p5 = new Patient("Emma Wilson", 55, "071-5555555", "Migraine, dizziness", Patient.Severity.LOW);
        Patient p6 = new Patient("Frank Harris", 72, "071-6666666", "Chest tightness", Patient.Severity.CRITICAL);
        Patient p7 = new Patient("Grace Taylor", 19, "071-7777777", "Sprained ankle", Patient.Severity.LOW);
        Patient p8 = new Patient("Henry Clark", 41, "071-8888888", "Abdominal pain", Patient.Severity.MODERATE);

        for (Patient p : Arrays.asList(p1, p2, p3, p4, p5, p6, p7, p8)) {
            queueManager.registerPatient(p);
        }

        queueManager.addDoctor(new Doctor("Dr. Sarah Chen", "Emergency Medicine", "077-1111111", "H1", 12));
        queueManager.addDoctor(new Doctor("Dr. Michael Ross", "Cardiology", "077-2222222", "H1", 8));
        queueManager.addDoctor(new Doctor("Dr. Emily Watson", "Orthopedics", "077-3333333", "H2", 10));
        queueManager.addDoctor(new Doctor("Dr. James Patel", "Pediatrics", "077-4444444", "H3", 10));
        queueManager.addDoctor(new Doctor("Dr. Lisa Nguyen", "General Surgery", "077-5555555", "H5", 12));
        queueManager.addDoctor(new Doctor("Dr. Robert Kim", "Emergency Medicine", "077-6666666", "H9", 15));
        queueManager.addDoctor(new Doctor("Dr. Anna Martinez", "Neurology", "077-7777777", "H10", 8));
        queueManager.addDoctor(new Doctor("Dr. David Park", "Cardiology", "077-8888888", "H9", 10));

        seedMedications();
        seedVisitRecords(Arrays.asList(p1, p2, p3, p4, p5));
        seedInvoices(Arrays.asList(p1, p2, p3, p4, p5, p6, p7, p8));
        seedDefaultUsers();
    }

    private static void seedDefaultUsers() {
        User admin = new User("admin", UserRepository.hashPassword("admin123"), "System Administrator", User.Role.ADMIN, "admin@hospital.com");
        userRepo.save(admin);
        User doctor = new User("doctor", UserRepository.hashPassword("doctor123"), "Dr. Demo User", User.Role.DOCTOR, "doctor@hospital.com");
        userRepo.save(doctor);
        User receptionist = new User("reception", UserRepository.hashPassword("reception123"), "Reception Desk", User.Role.RECEPTIONIST, "reception@hospital.com");
        userRepo.save(receptionist);
        User nurse = new User("nurse", UserRepository.hashPassword("nurse123"), "Nurse Demo", User.Role.NURSE, "nurse@hospital.com");
        userRepo.save(nurse);
        User patient = new User("patient", UserRepository.hashPassword("patient123"), "Alice Cooper", User.Role.PATIENT, "alice@email.com");
        userRepo.save(patient);
        System.out.println("Seeded default users: admin, doctor, reception, nurse, patient");
    }

    private static void seedMedications() {
        Medication[] meds = {
            new Medication("Paracetamol", "Pain Relief", "Tablet for fever and mild pain", 500, 50, 2.50, LocalDate.now().plusMonths(12), "PharmaCorp", "500mg", "Tablet"),
            new Medication("Amoxicillin", "Antibiotic", "Broad-spectrum antibiotic", 200, 30, 15.00, LocalDate.now().plusMonths(6), "MediSupply", "250mg", "Capsule"),
            new Medication("Insulin", "Diabetes", "Rapid-acting insulin injection", 80, 20, 120.00, LocalDate.now().plusMonths(3), "BioPharma", "100 units/ml", "Vial"),
            new Medication("Morphine", "Analgesic", "Pain management for severe cases", 40, 10, 85.00, LocalDate.now().plusMonths(4), "PainRelief Ltd", "10mg/ml", "Ampoule"),
            new Medication("Saline", "IV Fluid", "Intravenous fluid for hydration", 1000, 100, 5.00, LocalDate.now().plusMonths(18), "AquaMed", "0.9%", "Bag"),
            new Medication("Adrenaline", "Emergency", "Emergency cardiac stimulant", 25, 5, 45.00, LocalDate.now().plusMonths(2), "EmergencyPharm", "1mg/ml", "Ampoule"),
            new Medication("Aspirin", "Blood Thinner", "Antiplatelet medication", 300, 40, 3.50, LocalDate.now().plusMonths(10), "PharmaCorp", "75mg", "Tablet"),
            new Medication("Ciprofloxacin", "Antibiotic", "Fluoroquinolone antibiotic", 150, 25, 22.00, LocalDate.now().plusMonths(8), "MediSupply", "500mg", "Tablet")
        };
        for (Medication m : meds) {
            queueManager.addMedication(m);
            queueManager.loadAVLMedication(m);
        }
    }

    private static void seedVisitRecords(List<Patient> patients) {
        if (patients.size() >= 1) {
            queueManager.addVisitRecord(new VisitRecord(patients.get(0).getId(), patients.get(0).getName(), VisitRecord.VisitType.EMERGENCY, "Acute myocardial infarction", "Angioplasty, medication", "Dr. Michael Ross", "City General Hospital", 450.00, 2500.00, 800.00, "Critical patient stabilized"));
        }
        if (patients.size() >= 2) {
            queueManager.addVisitRecord(new VisitRecord(patients.get(1).getId(), patients.get(1).getName(), VisitRecord.VisitType.INPATIENT, "Compound fracture tibia", "Surgical fixation, casting", "Dr. Emily Watson", "Metro Medical Center", 320.00, 1800.00, 600.00, "Patient recovering well"));
        }
        if (patients.size() >= 3) {
            queueManager.addVisitRecord(new VisitRecord(patients.get(2).getId(), patients.get(2).getName(), VisitRecord.VisitType.OUTPATIENT, "Viral fever with dehydration", "IV fluids, antipyretics", "Dr. James Patel", "St. Mary's Hospital", 85.00, 120.00, 0.00, "Discharged after observation"));
        }
        if (patients.size() >= 4) {
            queueManager.addVisitRecord(new VisitRecord(patients.get(3).getId(), patients.get(3).getName(), VisitRecord.VisitType.EMERGENCY, "Anaphylactic shock", "Epinephrine, antihistamines", "Dr. Sarah Chen", "City General Hospital", 180.00, 800.00, 400.00, "Allergic reaction controlled"));
        }
        if (patients.size() >= 5) {
            queueManager.addVisitRecord(new VisitRecord(patients.get(4).getId(), patients.get(4).getName(), VisitRecord.VisitType.CONSULTATION, "Chronic migraine", "Pain management, lifestyle advice", "Dr. Anna Martinez", "Nawaloka Hospital", 45.00, 150.00, 0.00, "Follow-up in 2 weeks"));
        }
    }

    private static void seedInvoices(List<Patient> patients) {
        if (patients.size() >= 1) {
            queueManager.addInvoice(new Invoice(patients.get(0).getId(), patients.get(0).getName(), Invoice.InvoiceType.EMERGENCY, 3750.00, "Emergency cardiac treatment package", "City General Hospital", "Dr. Michael Ross"));
        }
        if (patients.size() >= 2) {
            queueManager.addInvoice(new Invoice(patients.get(1).getId(), patients.get(1).getName(), Invoice.InvoiceType.SURGERY, 2720.00, "Orthopedic surgery and hospitalization", "Metro Medical Center", "Dr. Emily Watson"));
        }
        if (patients.size() >= 3) {
            queueManager.addInvoice(new Invoice(patients.get(2).getId(), patients.get(2).getName(), Invoice.InvoiceType.CONSULTATION, 205.00, "Outpatient consultation and medication", "St. Mary's Hospital", "Dr. James Patel"));
        }
        if (patients.size() >= 4) {
            queueManager.addInvoice(new Invoice(patients.get(3).getId(), patients.get(3).getName(), Invoice.InvoiceType.EMERGENCY, 1380.00, "Emergency allergy treatment", "City General Hospital", "Dr. Sarah Chen"));
        }
        if (patients.size() >= 5) {
            queueManager.addInvoice(new Invoice(patients.get(4).getId(), patients.get(4).getName(), Invoice.InvoiceType.CONSULTATION, 195.00, "Neurology consultation", "Nawaloka Hospital", "Dr. Anna Martinez"));
        }
        if (patients.size() >= 6) {
            queueManager.addInvoice(new Invoice(patients.get(5).getId(), patients.get(5).getName(), Invoice.InvoiceType.EMERGENCY, 2100.00, "Critical cardiac monitoring and treatment", "City General Hospital", "Dr. Michael Ross"));
        }
        if (patients.size() >= 7) {
            queueManager.addInvoice(new Invoice(patients.get(6).getId(), patients.get(6).getName(), Invoice.InvoiceType.CONSULTATION, 85.00, "Minor injury treatment", "Dehiwala General Hospital", "Dr. David Park"));
        }
        if (patients.size() >= 8) {
            queueManager.addInvoice(new Invoice(patients.get(7).getId(), patients.get(7).getName(), Invoice.InvoiceType.LAB_TEST, 450.00, "Abdominal ultrasound and blood tests", "Kalubowila Teaching Hospital", "Dr. Robert Kim"));
        }
    }

    // ==================== Realtime SSE Broadcaster ====================
    static class RealtimeBroadcaster implements QueueManager.QueueListener, DispatchService.DispatchListener {
        private final List<HttpExchange> clients = new CopyOnWriteArrayList<>();
        private final ScheduledExecutorService heartbeatExecutor = Executors.newScheduledThreadPool(1);

        public RealtimeBroadcaster() {
            heartbeatExecutor.scheduleAtFixedRate(() -> {
                broadcastRaw(":heartbeat\n\n");
            }, 15, 15, TimeUnit.SECONDS);
        }

        public synchronized void addClient(HttpExchange exchange) {
            clients.add(exchange);
            sendToClient(exchange, "{\"type\":\"connected\",\"source\":\"server\"}");
        }

        public synchronized void removeClient(HttpExchange exchange) {
            clients.remove(exchange);
            try { exchange.close(); } catch (Exception ignored) {}
        }

        public void broadcastRefresh(String source) {
            String payload = "{\"type\":\"refresh\",\"source\":\"" + escapeJson(source) + "\",\"timestamp\":" + System.currentTimeMillis() + "}";
            broadcastRaw("data: " + payload + "\n\n");
        }

        private void broadcastRaw(String rawEvent) {
            for (HttpExchange client : clients) {
                sendRawToClient(client, rawEvent);
            }
        }

        private void sendToClient(HttpExchange client, String payload) {
            sendRawToClient(client, "data: " + payload + "\n\n");
        }

        private void sendRawToClient(HttpExchange client, String rawEvent) {
            try {
                OutputStream os = client.getResponseBody();
                os.write(rawEvent.getBytes(StandardCharsets.UTF_8));
                os.flush();
            } catch (IOException e) {
                removeClient(client);
            }
        }

        @Override
        public void onQueueChanged() {
            broadcastRefresh("queue");
        }

        @Override
        public void onDispatchChanged() {
            broadcastRefresh("dispatch");
        }

        public void shutdown() {
            heartbeatExecutor.shutdown();
            for (HttpExchange client : clients) {
                try { client.close(); } catch (Exception ignored) {}
            }
            clients.clear();
        }
    }

    // ==================== CORS + Response Helpers ====================
    private static void sendJson(HttpExchange ex, int status, String json) throws IOException {
        byte[] body = json.getBytes(StandardCharsets.UTF_8);
        ex.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        ex.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        ex.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        ex.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        ex.sendResponseHeaders(status, body.length);
        try (OutputStream os = ex.getResponseBody()) {
            os.write(body);
        }
    }

    private static void sendOptions(HttpExchange ex) throws IOException {
        ex.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        ex.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        ex.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        ex.sendResponseHeaders(204, -1);
    }

    private static String readBody(HttpExchange ex) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(ex.getRequestBody(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) sb.append(line);
        }
        return sb.toString();
    }

    // ==================== JSON Serializers ====================
    private static String patientToJson(Patient p) {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"id\":\"").append(escapeJson(p.getId())).append("\",");
        sb.append("\"name\":\"").append(escapeJson(p.getName())).append("\",");
        sb.append("\"age\":").append(p.getAge()).append(",");
        sb.append("\"contact\":\"").append(escapeJson(p.getContactNumber())).append("\",");
        sb.append("\"symptoms\":\"").append(escapeJson(p.getSymptoms())).append("\",");
        sb.append("\"severity\":\"").append(p.getSeverity().name()).append("\",");
        sb.append("\"status\":\"").append(p.isTreated() ? "completed" : "waiting").append("\",");
        sb.append("\"patientStatus\":\"").append(escapeJson(p.getStatus() != null ? p.getStatus().name() : (p.isTreated() ? "TREATED" : "WAITING"))).append("\",");
        sb.append("\"registrationTime\":\"").append(p.getRegistrationTime().format(ISO_FMT)).append("\",");
        sb.append("\"estimatedWait\":").append(p.getEstimatedWaitTimeMinutes()).append(",");
        sb.append("\"aiScore\":").append(String.format("%.2f", p.getAiPriorityScore())).append(",");
        sb.append("\"assignedHospital\":").append(p.getAssignedHospital() == null ? "null" : "\"" + escapeJson(p.getAssignedHospital()) + "\"").append(",");
        sb.append("\"assignedDoctorId\":").append(p.getAssignedDoctorId() == null ? "null" : "\"" + escapeJson(p.getAssignedDoctorId()) + "\"").append(",");
        sb.append("\"assignedDoctorName\":").append(p.getAssignedDoctorName() == null ? "null" : "\"" + escapeJson(p.getAssignedDoctorName()) + "\"").append(",");
        sb.append("\"preferredDoctorId\":").append(p.getPreferredDoctorId() == null ? "null" : "\"" + escapeJson(p.getPreferredDoctorId()) + "\"");
        sb.append("}");
        return sb.toString();
    }

    private static String hospitalToJson(Hospital h) {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"id\":\"").append(escapeJson(h.getId())).append("\",");
        sb.append("\"name\":\"").append(escapeJson(h.getName())).append("\",");
        sb.append("\"address\":\"").append(escapeJson(h.getAddress())).append("\",");
        sb.append("\"lat\":").append(h.getLatitude()).append(",");
        sb.append("\"lng\":").append(h.getLongitude()).append(",");
        sb.append("\"totalBeds\":").append(h.getTotalBeds()).append(",");
        sb.append("\"availableBeds\":").append(h.getAvailableBeds()).append(",");
        sb.append("\"totalICU\":").append(h.getTotalICU()).append(",");
        sb.append("\"availableICU\":").append(h.getAvailableICU()).append(",");
        sb.append("\"doctors\":").append(h.getEmergencyDoctors()).append(",");
        sb.append("\"availableDoctors\":").append(h.getAvailableDoctors()).append(",");
        sb.append("\"hasEmergency\":").append(h.isHasEmergencyUnit()).append(",");
        sb.append("\"loadFactor\":").append(String.format("%.2f", h.getLoadFactor()));
        sb.append("}");
        return sb.toString();
    }

    private static String ambulanceToJson(Ambulance a) {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"id\":\"").append(escapeJson(a.getId())).append("\",");
        sb.append("\"driver\":\"").append(escapeJson(a.getDriverName())).append("\",");
        sb.append("\"contact\":\"").append(escapeJson(a.getContactNumber())).append("\",");
        sb.append("\"status\":\"").append(a.getStatus().name()).append("\",");
        sb.append("\"lat\":").append(a.getCurrentLatitude()).append(",");
        sb.append("\"lng\":").append(a.getCurrentLongitude()).append(",");
        sb.append("\"patient\":").append(a.getAssignedPatient() == null ? "null" : "\"" + escapeJson(a.getAssignedPatient().getName()) + "\"").append(",");
        sb.append("\"destination\":").append(a.getDestinationHospital() == null ? "null" : "\"" + escapeJson(a.getDestinationHospital().getName()) + "\"").append(",");
        sb.append("\"distance\":").append(String.format("%.1f", a.getDistanceKm())).append(",");
        sb.append("\"eta\":").append(String.format("%.0f", a.getEstimatedArrivalMinutes()));
        sb.append("}");
        return sb.toString();
    }

    private static String doctorToJson(Doctor d) {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"id\":\"").append(escapeJson(d.getId())).append("\",");
        sb.append("\"name\":\"").append(escapeJson(d.getName())).append("\",");
        sb.append("\"specialty\":\"").append(escapeJson(d.getSpecialty())).append("\",");
        sb.append("\"phone\":\"").append(escapeJson(d.getPhone())).append("\",");
        sb.append("\"hospitalId\":\"").append(escapeJson(d.getHospitalId())).append("\",");
        sb.append("\"onDuty\":").append(d.isOnDuty()).append(",");
        sb.append("\"available\":").append(d.isAvailable()).append(",");
        sb.append("\"currentPatientId\":").append(d.getCurrentPatientId() == null ? "null" : "\"" + escapeJson(d.getCurrentPatientId()) + "\"").append(",");
        sb.append("\"patientsToday\":").append(d.getPatientsToday()).append(",");
        sb.append("\"maxPatientsPerDay\":").append(d.getMaxPatientsPerDay());
        sb.append("}");
        return sb.toString();
    }

    private static String notificationToJson(Notification n) {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"id\":\"").append(escapeJson(n.getId())).append("\",");
        sb.append("\"recipient\":\"").append(escapeJson(n.getRecipient())).append("\",");
        sb.append("\"recipientType\":\"").append(n.getRecipientType().name()).append("\",");
        sb.append("\"message\":\"").append(escapeJson(n.getMessage())).append("\",");
        sb.append("\"type\":\"").append(n.getType().name()).append("\",");
        sb.append("\"status\":\"").append(n.getStatus().name()).append("\",");
        sb.append("\"timestamp\":\"").append(n.getTimestamp().format(ISO_FMT)).append("\"");
        sb.append("}");
        return sb.toString();
    }

    private static String medicationToJson(Medication m) {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"id\":\"").append(escapeJson(m.getId())).append("\",");
        sb.append("\"name\":\"").append(escapeJson(m.getName())).append("\",");
        sb.append("\"category\":\"").append(escapeJson(m.getCategory())).append("\",");
        sb.append("\"description\":\"").append(escapeJson(m.getDescription())).append("\",");
        sb.append("\"stock\":").append(m.getStock()).append(",");
        sb.append("\"reorderThreshold\":").append(m.getReorderThreshold()).append(",");
        sb.append("\"pricePerUnit\":").append(String.format("%.2f", m.getPricePerUnit())).append(",");
        sb.append("\"expiryDate\":\"").append(m.getExpiryDate() != null ? m.getExpiryDate().format(DATE_FMT) : "").append("\",");
        sb.append("\"supplier\":\"").append(escapeJson(m.getSupplier())).append("\",");
        sb.append("\"dosage\":\"").append(escapeJson(m.getDosage())).append("\",");
        sb.append("\"unit\":\"").append(escapeJson(m.getUnit())).append("\",");
        sb.append("\"isExpired\":").append(m.isExpired()).append(",");
        sb.append("\"isLowStock\":").append(m.isLowStock()).append(",");
        sb.append("\"inventoryValue\":").append(String.format("%.2f", m.getInventoryValue()));
        sb.append("}");
        return sb.toString();
    }

    private static String visitRecordToJson(VisitRecord v) {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"id\":\"").append(escapeJson(v.getId())).append("\",");
        sb.append("\"patientId\":\"").append(escapeJson(v.getPatientId())).append("\",");
        sb.append("\"patientName\":\"").append(escapeJson(v.getPatientName())).append("\",");
        sb.append("\"visitDate\":\"").append(v.getVisitDate().format(DATE_FMT)).append("\",");
        sb.append("\"type\":\"").append(v.getType().name()).append("\",");
        sb.append("\"typeLabel\":\"").append(escapeJson(v.getType().getLabel())).append("\",");
        sb.append("\"diagnosis\":\"").append(escapeJson(v.getDiagnosis())).append("\",");
        sb.append("\"treatment\":\"").append(escapeJson(v.getTreatment())).append("\",");
        sb.append("\"doctorName\":\"").append(escapeJson(v.getDoctorName())).append("\",");
        sb.append("\"hospitalName\":\"").append(escapeJson(v.getHospitalName())).append("\",");
        sb.append("\"medicationCost\":").append(String.format("%.2f", v.getMedicationCost())).append(",");
        sb.append("\"procedureCost\":").append(String.format("%.2f", v.getProcedureCost())).append(",");
        sb.append("\"bedCost\":").append(String.format("%.2f", v.getBedCost())).append(",");
        sb.append("\"totalCost\":").append(String.format("%.2f", v.getTotalCost())).append(",");
        sb.append("\"notes\":\"").append(escapeJson(v.getNotes())).append("\",");
        sb.append("\"createdAt\":\"").append(v.getCreatedAt().format(ISO_FMT)).append("\"");
        sb.append("}");
        return sb.toString();
    }

    private static String invoiceToJson(Invoice i) {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"id\":\"").append(escapeJson(i.getId())).append("\",");
        sb.append("\"patientId\":\"").append(escapeJson(i.getPatientId())).append("\",");
        sb.append("\"patientName\":\"").append(escapeJson(i.getPatientName())).append("\",");
        sb.append("\"invoiceNumber\":\"").append(escapeJson(i.getInvoiceNumber())).append("\",");
        sb.append("\"type\":\"").append(i.getType().name()).append("\",");
        sb.append("\"typeLabel\":\"").append(escapeJson(i.getType().getLabel())).append("\",");
        sb.append("\"baseAmount\":").append(String.format("%.2f", i.getBaseAmount())).append(",");
        sb.append("\"discount\":").append(String.format("%.2f", i.getDiscount())).append(",");
        sb.append("\"tax\":").append(String.format("%.2f", i.getTax())).append(",");
        sb.append("\"totalAmount\":").append(String.format("%.2f", i.getTotalAmount())).append(",");
        sb.append("\"description\":\"").append(escapeJson(i.getDescription())).append("\",");
        sb.append("\"hospitalName\":\"").append(escapeJson(i.getHospitalName())).append("\",");
        sb.append("\"doctorName\":\"").append(escapeJson(i.getDoctorName())).append("\",");
        sb.append("\"status\":\"").append(i.getStatus().name()).append("\",");
        sb.append("\"statusLabel\":\"").append(escapeJson(i.getStatus().getLabel())).append("\",");
        sb.append("\"createdAt\":\"").append(i.getCreatedAt().format(ISO_FMT)).append("\"");
        sb.append("}");
        return sb.toString();
    }

    private static String reportToJson(Report r, boolean includeContent) {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"id\":\"").append(escapeJson(r.getId())).append("\",");
        sb.append("\"patientId\":\"").append(escapeJson(r.getPatientId())).append("\",");
        sb.append("\"patientName\":\"").append(escapeJson(r.getPatientName())).append("\",");
        sb.append("\"fileName\":\"").append(escapeJson(r.getFileName())).append("\",");
        sb.append("\"mimeType\":\"").append(escapeJson(r.getMimeType())).append("\",");
        sb.append("\"fileSize\":").append(r.getFileSize()).append(",");
        sb.append("\"formattedSize\":\"").append(escapeJson(r.getFormattedSize())).append("\",");
        sb.append("\"fileExtension\":\"").append(escapeJson(r.getFileExtension())).append("\",");
        sb.append("\"description\":\"").append(escapeJson(r.getDescription())).append("\",");
        sb.append("\"doctorName\":\"").append(escapeJson(r.getDoctorName() != null ? r.getDoctorName() : "")).append("\",");
        sb.append("\"status\":\"").append(escapeJson(r.getStatus())).append("\",");
        sb.append("\"uploadedAt\":\"").append(r.getUploadedAt() != null ? r.getUploadedAt().format(ISO_FMT) : "").append("\"");
        if (includeContent) {
            sb.append(",");
            sb.append("\"base64Content\":\"").append(escapeJson(r.getBase64Content() != null ? r.getBase64Content() : "")).append("\"");
        }
        sb.append("}");
        return sb.toString();
    }

    private static String userToJson(User u, boolean includeToken) {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"id\":\"").append(escapeJson(u.getId())).append("\",");
        sb.append("\"username\":\"").append(escapeJson(u.getUsername())).append("\",");
        sb.append("\"name\":\"").append(escapeJson(u.getName())).append("\",");
        sb.append("\"role\":\"").append(u.getRole().name()).append("\",");
        sb.append("\"roleDisplay\":\"").append(escapeJson(u.getRole().getDisplayName())).append("\",");
        sb.append("\"roleDescription\":\"").append(escapeJson(u.getRole().getDescription())).append("\",");
        // roleBadgeColor removed - frontend maps roles to colors locally
        sb.append("\"email\":\"").append(escapeJson(u.getEmail())).append("\",");
        sb.append("\"active\":").append(u.isActive()).append(",");
        sb.append("\"createdAt\":\"").append(u.getCreatedAt() != null ? u.getCreatedAt().format(ISO_FMT) : "").append("\",");
        sb.append("\"lastLogin\":\"").append(u.getLastLogin() != null ? u.getLastLogin().format(ISO_FMT) : "").append("\"");
        if (includeToken) {
            sb.append(",");
            sb.append("\"token\":\"").append(escapeJson(u.getAuthToken())).append("\"");
        }
        sb.append("}");
        return sb.toString();
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\b", "\\b")
                .replace("\f", "\\f")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    private static String toJsonArray(List<String> items) {
        return "[" + String.join(",", items) + "]";
    }

    // ==================== Handlers ====================
    static class PatientsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (ex.getRequestMethod().equalsIgnoreCase("GET")) {
                List<String> jsonList = new java.util.ArrayList<>();
                for (Patient p : queueManager.getAllWaitingPatients()) {
                    jsonList.add(patientToJson(p));
                }
                for (Patient p : queueManager.getTreatedPatients()) {
                    jsonList.add(patientToJson(p));
                }
                sendJson(ex, 200, toJsonArray(jsonList));
            } else if (ex.getRequestMethod().equalsIgnoreCase("POST")) {
                String body = readBody(ex);
                String name = extractJsonString(body, "name");
                String ageStr = extractJsonString(body, "age");
                String contact = extractJsonString(body, "contact");
                String symptoms = extractJsonString(body, "symptoms");
                String severityStr = extractJsonString(body, "severity");
                String doctorId = extractJsonString(body, "doctorId");
                if (name == null || name.isEmpty() || ageStr == null || contact == null || symptoms == null) {
                    sendJson(ex, 400, "{\"error\":\"Missing required fields\"}");
                    return;
                }
                int age;
                try { age = Integer.parseInt(ageStr); }
                catch (NumberFormatException e) {
                    sendJson(ex, 400, "{\"error\":\"Invalid age\"}");
                    return;
                }
                Patient.Severity severity = Patient.Severity.LOW;
                try { severity = Patient.Severity.valueOf(severityStr.toUpperCase()); }
                catch (IllegalArgumentException ignored) {}
                Patient patient = new Patient(name, age, contact, symptoms, severity);
                if (doctorId != null && !doctorId.isEmpty()) {
                    patient.setPreferredDoctorId(doctorId);
                }
                boolean added = queueManager.registerPatient(patient);
                if (!added) {
                    sendJson(ex, 503, "{\"error\":\"Failed to register patient - database unavailable\"}");
                    return;
                }
                sendJson(ex, 201, patientToJson(patient));
            } else {
                sendJson(ex, 405, "{\"error\":\"Method not allowed\"}");
            }
        }
    }

    static class EmergencyQueueHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("GET")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            List<String> jsonList = new java.util.ArrayList<>();
            for (Patient p : queueManager.getEmergencyQueue()) {
                jsonList.add(patientToJson(p));
            }
            sendJson(ex, 200, toJsonArray(jsonList));
        }
    }

    static class NormalQueueHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("GET")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            List<String> jsonList = new java.util.ArrayList<>();
            for (Patient p : queueManager.getNormalQueue()) {
                jsonList.add(patientToJson(p));
            }
            sendJson(ex, 200, toJsonArray(jsonList));
        }
    }

    static class QueuePositionHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("GET")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            String query = ex.getRequestURI().getQuery();
            String patientId = extractQueryParam(query, "patientId");
            if (patientId == null || patientId.isEmpty()) {
                sendJson(ex, 400, "{\"error\":\"Missing patientId parameter\"}");
                return;
            }
            Patient patient = queueManager.getPatient(patientId);
            if (patient == null) {
                sendJson(ex, 404, "{\"error\":\"Patient not found\"}");
                return;
            }
            int position = 0;
            int totalWaiting = queueManager.getTotalWaiting();
            List<Patient> emergency = queueManager.getEmergencyQueue();
            for (int i = 0; i < emergency.size(); i++) {
                if (emergency.get(i).getId().equals(patientId)) {
                    position = i + 1;
                    break;
                }
            }
            if (position == 0) {
                List<Patient> normal = queueManager.getNormalQueue();
                for (int i = 0; i < normal.size(); i++) {
                    if (normal.get(i).getId().equals(patientId)) {
                        position = emergency.size() + i + 1;
                        break;
                    }
                }
            }
            if (position == 0 && patient.isTreated()) {
                position = -1;
            }
            StringBuilder sb = new StringBuilder();
            sb.append("{");
            sb.append("\"patientId\":\"").append(escapeJson(patientId)).append("\",");
            sb.append("\"position\":").append(position).append(",");
            sb.append("\"totalWaiting\":").append(totalWaiting).append(",");
            sb.append("\"severity\":\"").append(patient.getSeverity().name()).append("\",");
            sb.append("\"estimatedWait\":").append(patient.getEstimatedWaitTimeMinutes()).append(",");
            sb.append("\"aiScore\":").append(String.format("%.2f", patient.getAiPriorityScore()));
            sb.append("}");
            sendJson(ex, 200, sb.toString());
        }
    }

    static class QueueStatusHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("GET")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            AIDecisionSupport.QueueAnalytics a = queueManager.getAnalytics();
            int pendingBeds = queueManager.getPendingBedPatients().size();
            int availableDoctors = queueManager.getAvailableDoctors().size();
            int totalDoctors = queueManager.getDoctors().size();
            StringBuilder sb = new StringBuilder();
            sb.append("{");
            sb.append("\"totalWaiting\":").append(a.totalWaiting).append(",");
            sb.append("\"emergencyCount\":").append(a.criticalCount + a.highCount).append(",");
            sb.append("\"normalCount\":").append(a.moderateCount + a.lowCount).append(",");
            sb.append("\"treatedCount\":").append(queueManager.getTreatedCount()).append(",");
            sb.append("\"pendingBeds\":").append(pendingBeds).append(",");
            sb.append("\"availableDoctors\":").append(availableDoctors).append(",");
            sb.append("\"totalDoctors\":").append(totalDoctors).append(",");
            sb.append("\"avgWaitTime\":").append(String.format("%.0f", a.avgWaitTime)).append(",");
            sb.append("\"criticalRatio\":").append(String.format("%.2f", a.criticalRatio)).append(",");
            sb.append("\"status\":\"").append(escapeJson(a.status)).append("\",");
            sb.append("\"throughput\":").append(String.format("%.0f", a.throughput));
            sb.append("}");
            sendJson(ex, 200, sb.toString());
        }
    }

    static class HospitalsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("GET")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            List<String> jsonList = new java.util.ArrayList<>();
            for (Hospital h : queueManager.getHospitals()) {
                jsonList.add(hospitalToJson(h));
            }
            sendJson(ex, 200, toJsonArray(jsonList));
        }
    }

    static class RoadsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("GET")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            List<String> jsonList = new java.util.ArrayList<>();
            HospitalGraph graph = dispatchService.getHospitalGraph();
            for (Map.Entry<String, Map<String, Double>> entry : graph.getAdjacencyList().entrySet()) {
                for (Map.Entry<String, Double> conn : entry.getValue().entrySet()) {
                    if (entry.getKey().compareTo(conn.getKey()) < 0) {
                        StringBuilder sb = new StringBuilder();
                        sb.append("{");
                        sb.append("\"from\":\"").append(escapeJson(entry.getKey())).append("\",");
                        sb.append("\"to\":\"").append(escapeJson(conn.getKey())).append("\",");
                        sb.append("\"distance\":").append(conn.getValue());
                        sb.append("}");
                        jsonList.add(sb.toString());
                    }
                }
            }
            sendJson(ex, 200, toJsonArray(jsonList));
        }
    }

    static class AmbulancesHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("GET")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            List<String> jsonList = new java.util.ArrayList<>();
            for (Ambulance a : dispatchService.getAllAmbulances()) {
                jsonList.add(ambulanceToJson(a));
            }
            sendJson(ex, 200, toJsonArray(jsonList));
        }
    }

    static class ShortestPathHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("GET")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            String query = ex.getRequestURI().getQuery();
            String fromId = extractQueryParam(query, "from");
            String toId = extractQueryParam(query, "to");
            if (fromId == null || toId == null) {
                sendJson(ex, 400, "{\"error\":\"Missing from or to parameter\"}");
                return;
            }
            DijkstraAlgorithm.PathResult result = DijkstraAlgorithm.findShortestPath(dispatchService.getHospitalGraph(), fromId, toId);
            if (result == null) {
                sendJson(ex, 404, "{\"error\":\"No path found\"}");
                return;
            }
            StringBuilder pathJson = new StringBuilder("[");
            for (int i = 0; i < result.getPath().size(); i++) {
                if (i > 0) pathJson.append(",");
                pathJson.append("\"").append(escapeJson(result.getPath().get(i))).append("\"");
            }
            pathJson.append("]");
            StringBuilder sb = new StringBuilder();
            sb.append("{");
            sb.append("\"path\":").append(pathJson).append(",");
            sb.append("\"distance\":").append(String.format("%.1f", result.getTotalDistance())).append(",");
            sb.append("\"time\":").append(String.format("%.0f", result.getEstimatedTimeMinutes()));
            sb.append("}");
            sendJson(ex, 200, sb.toString());
        }
    }

    static class AnalyticsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("GET")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            AIDecisionSupport.QueueAnalytics a = queueManager.getAnalytics();
            List<Hospital> hospitals = queueManager.getHospitals();
            StringBuilder severity = new StringBuilder();
            severity.append("[");
            severity.append("{\"name\":\"Critical\",\"value\":").append(a.criticalCount).append(",\"color\":\"#ef4444\"},");
            severity.append("{\"name\":\"High\",\"value\":").append(a.highCount).append(",\"color\":\"#f97316\"},");
            severity.append("{\"name\":\"Moderate\",\"value\":").append(a.moderateCount).append(",\"color\":\"#0891b2\"},");
            severity.append("{\"name\":\"Low\",\"value\":").append(a.lowCount).append(",\"color\":\"#22c55e\"}");
            severity.append("]");
            StringBuilder hospitalPerf = new StringBuilder();
            hospitalPerf.append("[");
            for (int i = 0; i < hospitals.size(); i++) {
                if (i > 0) hospitalPerf.append(",");
                Hospital h = hospitals.get(i);
                hospitalPerf.append("{");
                hospitalPerf.append("\"name\":\"").append(escapeJson(h.getName())).append("\",");
                hospitalPerf.append("\"load\":").append(String.format("%.2f", h.getLoadFactor() * 100)).append(",");
                hospitalPerf.append("\"beds\":").append(h.getAvailableBeds()).append(",");
                hospitalPerf.append("\"icu\":").append(h.getAvailableICU());
                hospitalPerf.append("}");
            }
            hospitalPerf.append("]");
            StringBuilder sb = new StringBuilder();
            sb.append("{");
            sb.append("\"queueStats\":");
            sb.append("{");
            sb.append("\"totalWaiting\":").append(a.totalWaiting).append(",");
            sb.append("\"emergencyCount\":").append(a.criticalCount + a.highCount).append(",");
            sb.append("\"normalCount\":").append(a.moderateCount + a.lowCount).append(",");
            sb.append("\"treatedCount\":").append(queueManager.getTreatedCount()).append(",");
            sb.append("\"pendingBeds\":").append(queueManager.getPendingBedPatients().size()).append(",");
            sb.append("\"availableDoctors\":").append(queueManager.getAvailableDoctors().size()).append(",");
            sb.append("\"totalDoctors\":").append(queueManager.getDoctors().size()).append(",");
            sb.append("\"avgWaitTime\":").append(String.format("%.0f", a.avgWaitTime)).append(",");
            sb.append("\"criticalRatio\":").append(String.format("%.2f", a.criticalRatio)).append(",");
            sb.append("\"status\":\"").append(escapeJson(a.status)).append("\",");
            sb.append("\"throughput\":").append(String.format("%.0f", a.throughput));
            sb.append("},");
            sb.append("\"severityDistribution\":").append(severity).append(",");
            sb.append("\"hospitalPerformance\":").append(hospitalPerf);
            sb.append("}");
            sendJson(ex, 200, sb.toString());
        }
    }

    static class SSEHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("GET")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            ex.getResponseHeaders().set("Content-Type", "text/event-stream; charset=UTF-8");
            ex.getResponseHeaders().set("Cache-Control", "no-cache");
            ex.getResponseHeaders().set("Connection", "keep-alive");
            ex.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            ex.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
            ex.sendResponseHeaders(200, 0);
            broadcaster.addClient(ex);
            try {
                while (true) {
                    Thread.sleep(5000);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            } finally {
                broadcaster.removeClient(ex);
            }
        }
    }

    static class ProcessNextHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("POST")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            Patient processed = queueManager.processNextPatient();
            if (processed == null) {
                sendJson(ex, 200, "{\"success\":false,\"message\":\"No patients in queue\"}");
                return;
            }
            StringBuilder sb = new StringBuilder();
            sb.append("{");
            sb.append("\"success\":true,");
            sb.append("\"message\":\"Patient processed successfully\",");
            sb.append("\"patient\":").append(patientToJson(processed));
            sb.append("}");
            sendJson(ex, 200, sb.toString());
        }
    }

    static class SimulateEmergencyHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("POST")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            String[] names = {"Emergency Patient A", "Emergency Patient B", "Emergency Patient C", "Emergency Patient D", "Emergency Patient E"};
            String[] symptoms = {"Severe chest pain", "Unconscious, trauma", "Massive bleeding", "Stroke symptoms", "Severe allergic reaction", "Difficulty breathing", "Cardiac arrest"};
            String name = names[(int)(Math.random() * names.length)] + " " + System.currentTimeMillis() % 1000;
            String symptom = symptoms[(int)(Math.random() * symptoms.length)];
            int age = 25 + (int)(Math.random() * 60);
            String contact = "077-" + (1000000 + (int)(Math.random() * 8999999));
            Patient patient = new Patient(name, age, contact, symptom, Patient.Severity.CRITICAL);
            boolean added = queueManager.registerPatient(patient);
            if (!added) {
                sendJson(ex, 503, "{\"error\":\"Failed to register patient - database unavailable\"}");
                return;
            }
            sendJson(ex, 201, patientToJson(patient));
        }
    }

    static class ClearQueueHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("POST")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            queueManager.clearPatients();
            sendJson(ex, 200, "{\"success\":true,\"message\":\"All queues cleared\"}");
        }
    }

    static class EmergencyICUHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("POST")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            String name = "ICU Emergency " + System.currentTimeMillis() % 1000;
            String symptom = "Critical condition requiring immediate ICU admission";
            int age = 25 + (int)(Math.random() * 60);
            String contact = "077-" + (1000000 + (int)(Math.random() * 8999999));
            Patient patient = new Patient(name, age, contact, symptom, Patient.Severity.CRITICAL);
            boolean added = queueManager.registerPatient(patient);
            if (!added) {
                sendJson(ex, 503, "{\"error\":\"Failed to register patient - database unavailable\"}");
                return;
            }
            sendJson(ex, 201, patientToJson(patient));
        }
    }

    static class AllocateBedHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("POST")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            String body = readBody(ex);
            String hospitalId = extractJsonString(body, "hospitalId");
            String bedType = extractJsonString(body, "bedType");
            if (hospitalId == null || bedType == null) {
                sendJson(ex, 400, "{\"error\":\"Missing hospitalId or bedType\"}");
                return;
            }
            boolean ok = queueManager.allocateBed(hospitalId, bedType);
            if (ok) {
                sendJson(ex, 200, "{\"success\":true,\"message\":\"Bed allocated\",\"hospitalId\":\"" + escapeJson(hospitalId) + "\",\"bedType\":\"" + escapeJson(bedType) + "\"}");
            } else {
                sendJson(ex, 409, "{\"success\":false,\"message\":\"No available beds of type " + escapeJson(bedType) + "\"}");
            }
        }
    }

    static class DischargeBedHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("POST")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            String body = readBody(ex);
            String hospitalId = extractJsonString(body, "hospitalId");
            String bedType = extractJsonString(body, "bedType");
            if (hospitalId == null || bedType == null) {
                sendJson(ex, 400, "{\"error\":\"Missing hospitalId or bedType\"}");
                return;
            }
            boolean ok = queueManager.dischargeBed(hospitalId, bedType);
            if (ok) {
                sendJson(ex, 200, "{\"success\":true,\"message\":\"Bed discharged\",\"hospitalId\":\"" + escapeJson(hospitalId) + "\",\"bedType\":\"" + escapeJson(bedType) + "\"}");
            } else {
                sendJson(ex, 409, "{\"success\":false,\"message\":\"No beds to discharge of type " + escapeJson(bedType) + "\"}");
            }
        }
    }

    static class DispatchAmbulanceHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("POST")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            String body = readBody(ex);
            String type = extractJsonString(body, "type");
            String hospitalId = extractJsonString(body, "hospitalId");
            if (type == null || hospitalId == null) {
                sendJson(ex, 400, "{\"error\":\"Missing type or hospitalId\"}");
                return;
            }
            DispatchService.DispatchResult result;
            if ("EMERGENCY".equalsIgnoreCase(type)) {
                result = dispatchService.dispatchEmergency(hospitalId);
            } else {
                result = dispatchService.dispatchTransport(hospitalId);
            }
            if (result.success) {
                StringBuilder sb = new StringBuilder();
                sb.append("{");
                sb.append("\"success\":true,");
                sb.append("\"message\":\"").append(escapeJson(result.message)).append("\",");
                sb.append("\"ambulanceId\":\"").append(escapeJson(result.ambulance.getId())).append("\",");
                sb.append("\"driver\":\"").append(escapeJson(result.ambulance.getDriverName())).append("\",");
                sb.append("\"hospital\":\"").append(escapeJson(result.hospital.getName())).append("\",");
                sb.append("\"distance\":").append(String.format("%.1f", result.distanceKm)).append(",");
                sb.append("\"time\":").append(String.format("%.0f", result.estimatedTimeMinutes));
                sb.append("}");
                sendJson(ex, 200, sb.toString());
            } else {
                sendJson(ex, 409, "{\"success\":false,\"message\":\"" + escapeJson(result.message) + "\"}");
            }
        }
    }

    static class AISuggestionsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("GET")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            AIDecisionSupport.QueueAnalytics a = queueManager.getAnalytics();
            List<Patient> waiting = queueManager.getAllWaitingPatients();
            List<Patient> pendingBeds = queueManager.getPendingBedPatients();
            List<Doctor> availableDoctors = queueManager.getAvailableDoctors();
            StringBuilder sb = new StringBuilder();
            sb.append("{");
            sb.append("\"alerts\":");
            sb.append("[");
            if (a.criticalRatio > 0.5) {
                sb.append("\"High critical patient ratio detected\"");
            }
            if (!pendingBeds.isEmpty()) {
                if (a.criticalRatio > 0.5) sb.append(",");
                sb.append("\"").append(escapeJson(pendingBeds.size() + " patients waiting for beds")).append("\"");
            }
            if (availableDoctors.isEmpty()) {
                if (a.criticalRatio > 0.5 || !pendingBeds.isEmpty()) sb.append(",");
                sb.append("\"No available doctors on duty\"");
            }
            sb.append("],");
            sb.append("\"nextPatient\":");
            if (!waiting.isEmpty()) {
                Patient next = waiting.get(0);
                sb.append("{");
                sb.append("\"name\":\"").append(escapeJson(next.getName())).append("\",");
                sb.append("\"severity\":\"").append(next.getSeverity().name()).append("\",");
                sb.append("\"predictedWait\":").append(next.getEstimatedWaitTimeMinutes()).append(",");
                sb.append("\"aiScore\":").append(String.format("%.2f", next.getAiPriorityScore()));
                sb.append("}");
            } else {
                sb.append("null");
            }
            sb.append(",");
            sb.append("\"pendingBeds\":").append(pendingBeds.size()).append(",");
            sb.append("\"availableDoctors\":").append(availableDoctors.size());
            sb.append("}");
            sendJson(ex, 200, sb.toString());
        }
    }

    static class DoctorsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("GET")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            List<String> jsonList = new java.util.ArrayList<>();
            for (Doctor d : queueManager.getDoctors()) {
                jsonList.add(doctorToJson(d));
            }
            sendJson(ex, 200, toJsonArray(jsonList));
        }
    }

    static class PendingBedsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("GET")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            List<String> jsonList = new java.util.ArrayList<>();
            for (Patient p : queueManager.getPendingBedPatients()) {
                jsonList.add(patientToJson(p));
            }
            sendJson(ex, 200, toJsonArray(jsonList));
        }
    }

    static class NotificationsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("GET")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            NotificationService ns = queueManager.getNotificationService();
            List<String> jsonList = new java.util.ArrayList<>();
            for (Notification n : ns.getAllNotifications()) {
                jsonList.add(notificationToJson(n));
            }
            StringBuilder sb = new StringBuilder();
            sb.append("{");
            sb.append("\"notifications\":").append(toJsonArray(jsonList)).append(",");
            sb.append("\"totalSent\":").append(ns.getTotalSent()).append(",");
            sb.append("\"unreadCount\":").append(ns.getUnreadCount());
            sb.append("}");
            sendJson(ex, 200, sb.toString());
        }
    }

    // ==================== NEW FEATURE HANDLERS ====================
    static class MedicationsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (ex.getRequestMethod().equalsIgnoreCase("GET")) {
                List<String> jsonList = new java.util.ArrayList<>();
                for (Medication m : queueManager.getAllMedications()) {
                    jsonList.add(medicationToJson(m));
                }
                sendJson(ex, 200, toJsonArray(jsonList));
            } else if (ex.getRequestMethod().equalsIgnoreCase("POST")) {
                String body = readBody(ex);
                String name = extractJsonString(body, "name");
                String category = extractJsonString(body, "category");
                String description = extractJsonString(body, "description");
                String stockStr = extractJsonString(body, "stock");
                String thresholdStr = extractJsonString(body, "reorderThreshold");
                String priceStr = extractJsonString(body, "pricePerUnit");
                String expiryStr = extractJsonString(body, "expiryDate");
                String supplier = extractJsonString(body, "supplier");
                String dosage = extractJsonString(body, "dosage");
                String unit = extractJsonString(body, "unit");
                if (name == null || category == null || stockStr == null || priceStr == null) {
                    sendJson(ex, 400, "{\"error\":\"Missing required fields\"}");
                    return;
                }
                try {
                    int stock = Integer.parseInt(stockStr);
                    int threshold = thresholdStr != null && !thresholdStr.isEmpty() ? Integer.parseInt(thresholdStr) : 10;
                    double price = Double.parseDouble(priceStr);
                    LocalDate expiry = (expiryStr != null && !expiryStr.isEmpty()) ? LocalDate.parse(expiryStr) : LocalDate.now().plusMonths(6);
                    Medication med = new Medication(name, category, description != null ? description : "", stock, threshold, price, expiry, supplier != null ? supplier : "", dosage != null ? dosage : "", unit != null ? unit : "unit");
                    queueManager.addMedication(med);
                    sendJson(ex, 201, medicationToJson(med));
                } catch (Exception e) {
                    sendJson(ex, 400, "{\"error\":\"Invalid data: " + escapeJson(e.getMessage()) + "\"}");
                }
            } else {
                sendJson(ex, 405, "{\"error\":\"Method not allowed\"}");
            }
        }
    }

    static class LowStockHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("GET")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            List<String> jsonList = new java.util.ArrayList<>();
            for (Medication m : queueManager.getLowStockMedications()) {
                jsonList.add(medicationToJson(m));
            }
            sendJson(ex, 200, toJsonArray(jsonList));
        }
    }

    static class ExpiredHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("GET")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            List<String> jsonList = new java.util.ArrayList<>();
            for (Medication m : queueManager.getExpiredMedications()) {
                jsonList.add(medicationToJson(m));
            }
            sendJson(ex, 200, toJsonArray(jsonList));
        }
    }

    static class MedicationSearchHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("GET")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            String query = ex.getRequestURI().getQuery();
            String name = extractQueryParam(query, "name");
            if (name == null || name.isEmpty()) {
                sendJson(ex, 400, "{\"error\":\"Missing name parameter\"}");
                return;
            }
            List<String> jsonList = new java.util.ArrayList<>();
            for (Medication m : queueManager.searchMedicationsByName(name)) {
                jsonList.add(medicationToJson(m));
            }
            sendJson(ex, 200, toJsonArray(jsonList));
        }
    }

    static class UpdateStockHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("POST")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            String body = readBody(ex);
            String id = extractJsonString(body, "id");
            String deltaStr = extractJsonString(body, "delta");
            if (id == null || deltaStr == null) {
                sendJson(ex, 400, "{\"error\":\"Missing id or delta\"}");
                return;
            }
            try {
                int delta = Integer.parseInt(deltaStr);
                boolean ok = queueManager.updateMedicationStock(id, delta);
                if (ok) {
                    sendJson(ex, 200, "{\"success\":true,\"message\":\"Stock updated\"}");
                } else {
                    sendJson(ex, 404, "{\"error\":\"Medication not found or insufficient stock\"}");
                }
            } catch (NumberFormatException e) {
                sendJson(ex, 400, "{\"error\":\"Invalid delta value\"}");
            }
        }
    }

    static class VisitRecordsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (ex.getRequestMethod().equalsIgnoreCase("GET")) {
                List<String> jsonList = new java.util.ArrayList<>();
                for (VisitRecord v : queueManager.getAllVisitRecords()) {
                    jsonList.add(visitRecordToJson(v));
                }
                sendJson(ex, 200, toJsonArray(jsonList));
            } else if (ex.getRequestMethod().equalsIgnoreCase("POST")) {
                String body = readBody(ex);
                String patientId = extractJsonString(body, "patientId");
                String patientName = extractJsonString(body, "patientName");
                String typeStr = extractJsonString(body, "type");
                String diagnosis = extractJsonString(body, "diagnosis");
                String treatment = extractJsonString(body, "treatment");
                String doctorName = extractJsonString(body, "doctorName");
                String hospitalName = extractJsonString(body, "hospitalName");
                String medCostStr = extractJsonString(body, "medicationCost");
                String procCostStr = extractJsonString(body, "procedureCost");
                String bedCostStr = extractJsonString(body, "bedCost");
                String notes = extractJsonString(body, "notes");
                if (patientId == null || patientName == null || typeStr == null) {
                    sendJson(ex, 400, "{\"error\":\"Missing required fields\"}");
                    return;
                }
                try {
                    VisitRecord.VisitType type = VisitRecord.VisitType.valueOf(typeStr.toUpperCase());
                    double medCost = medCostStr != null ? Double.parseDouble(medCostStr) : 0;
                    double procCost = procCostStr != null ? Double.parseDouble(procCostStr) : 0;
                    double bedCost = bedCostStr != null ? Double.parseDouble(bedCostStr) : 0;
                    VisitRecord record = new VisitRecord(patientId, patientName, type, diagnosis != null ? diagnosis : "", treatment != null ? treatment : "", doctorName != null ? doctorName : "", hospitalName != null ? hospitalName : "", medCost, procCost, bedCost, notes != null ? notes : "");
                    queueManager.addVisitRecord(record);
                    sendJson(ex, 201, visitRecordToJson(record));
                } catch (Exception e) {
                    sendJson(ex, 400, "{\"error\":\"Invalid data: " + escapeJson(e.getMessage()) + "\"}");
                }
            } else {
                sendJson(ex, 405, "{\"error\":\"Method not allowed\"}");
            }
        }
    }

    static class PatientHistoryHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("GET")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            String query = ex.getRequestURI().getQuery();
            String patientId = extractQueryParam(query, "patientId");
            if (patientId == null || patientId.isEmpty()) {
                sendJson(ex, 400, "{\"error\":\"Missing patientId parameter\"}");
                return;
            }
            List<String> jsonList = new java.util.ArrayList<>();
            for (VisitRecord v : queueManager.getVisitRecordsByPatient(patientId)) {
                jsonList.add(visitRecordToJson(v));
            }
            sendJson(ex, 200, toJsonArray(jsonList));
        }
    }

    static class InvoicesHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("GET")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            List<String> jsonList = new java.util.ArrayList<>();
            for (Invoice i : queueManager.getAllInvoices()) {
                jsonList.add(invoiceToJson(i));
            }
            sendJson(ex, 200, toJsonArray(jsonList));
        }
    }

    static class GenerateInvoiceHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("POST")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            String body = readBody(ex);
            String patientId = extractJsonString(body, "patientId");
            String patientName = extractJsonString(body, "patientName");
            String typeStr = extractJsonString(body, "type");
            String amountStr = extractJsonString(body, "baseAmount");
            String description = extractJsonString(body, "description");
            String hospitalName = extractJsonString(body, "hospitalName");
            String doctorName = extractJsonString(body, "doctorName");
            if (patientId == null || patientName == null || typeStr == null || amountStr == null) {
                sendJson(ex, 400, "{\"error\":\"Missing required fields\"}");
                return;
            }
            try {
                Invoice.InvoiceType type = Invoice.InvoiceType.valueOf(typeStr.toUpperCase());
                double amount = Double.parseDouble(amountStr);
                Invoice invoice = new Invoice(patientId, patientName, type, amount, description != null ? description : "", hospitalName != null ? hospitalName : "", doctorName != null ? doctorName : "");
                queueManager.addInvoice(invoice);
                sendJson(ex, 201, invoiceToJson(invoice));
            } catch (Exception e) {
                sendJson(ex, 400, "{\"error\":\"Invalid data: " + escapeJson(e.getMessage()) + "\"}");
            }
        }
    }

    static class GenerateInvoiceFromVisitHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("POST")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            String body = readBody(ex);
            String visitId = extractJsonString(body, "visitId");
            if (visitId == null) {
                sendJson(ex, 400, "{\"error\":\"Missing visitId\"}");
                return;
            }
            try {
                Invoice invoice = queueManager.generateInvoiceFromVisit(visitId);
                if (invoice == null) {
                    sendJson(ex, 404, "{\"error\":\"Visit record not found\"}");
                    return;
                }
                sendJson(ex, 201, invoiceToJson(invoice));
            } catch (IllegalStateException e) {
                sendJson(ex, 409, "{\"error\":\"" + escapeJson(e.getMessage()) + "\"}");
            }
        }
    }

    static class PayInvoiceHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("POST")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            String body = readBody(ex);
            String invoiceId = extractJsonString(body, "invoiceId");
            if (invoiceId == null) {
                sendJson(ex, 400, "{\"error\":\"Missing invoiceId\"}");
                return;
            }
            boolean success = queueManager.payInvoice(invoiceId);
            if (success) {
                sendJson(ex, 200, "{\"success\":true,\"message\":\"Invoice paid successfully\"}");
            } else {
                sendJson(ex, 404, "{\"error\":\"Invoice not found or already paid\"}");
            }
        }
    }

    static class RevenueAnalyticsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("GET")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            double totalRevenue = queueManager.getTotalRevenue();
            double pendingRevenue = queueManager.getPendingRevenue();
            double paidRevenue = queueManager.getPaidRevenue();
            int totalInvoices = queueManager.getTotalInvoiceCount();
            int paidInvoices = queueManager.getPaidInvoiceCount();
            int pendingInvoices = queueManager.getPendingInvoiceCount();
            StringBuilder sb = new StringBuilder();
            sb.append("{");
            sb.append("\"totalRevenue\":").append(String.format("%.2f", totalRevenue)).append(",");
            sb.append("\"pendingRevenue\":").append(String.format("%.2f", pendingRevenue)).append(",");
            sb.append("\"paidRevenue\":").append(String.format("%.2f", paidRevenue)).append(",");
            sb.append("\"totalInvoices\":").append(totalInvoices).append(",");
            sb.append("\"paidInvoices\":").append(paidInvoices).append(",");
            sb.append("\"pendingInvoices\":").append(pendingInvoices);
            sb.append("}");
            sendJson(ex, 200, sb.toString());
        }
    }

    // ==================== REPORT HANDLERS ====================
    static class ReportsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (ex.getRequestMethod().equalsIgnoreCase("GET")) {
                List<String> jsonList = new java.util.ArrayList<>();
                for (Report r : queueManager.getAllReports()) {
                    jsonList.add(reportToJson(r, false));
                }
                sendJson(ex, 200, toJsonArray(jsonList));
            } else if (ex.getRequestMethod().equalsIgnoreCase("POST")) {
                String body = readBody(ex);
                String patientId = extractJsonString(body, "patientId");
                String patientName = extractJsonString(body, "patientName");
                String fileName = extractJsonString(body, "fileName");
                String mimeType = extractJsonString(body, "mimeType");
                String fileSizeStr = extractJsonString(body, "fileSize");
                String base64Content = extractJsonString(body, "base64Content");
                String description = extractJsonString(body, "description");
                if (patientId == null || fileName == null || base64Content == null) {
                    sendJson(ex, 400, "{\"error\":\"Missing required fields: patientId, fileName, base64Content\"}");
                    return;
                }
                // Validate patient exists
                Patient existingPatient = queueManager.getPatient(patientId);
                if (existingPatient == null) {
                    boolean found = false;
                    for (Patient tp : queueManager.getTreatedPatients()) {
                        if (tp.getId().equals(patientId)) { found = true; break; }
                    }
                    if (!found) {
                        for (Patient tp : queueManager.getPendingBedPatients()) {
                            if (tp.getId().equals(patientId)) { found = true; break; }
                        }
                    }
                    if (!found) {
                        sendJson(ex, 404, "{\"error\":\"Patient not found\"}");
                        return;
                    }
                }
                // Enforce max file size (7MB before base64 = ~9.3MB base64 string)
                if (base64Content != null && base64Content.length() > 12 * 1024 * 1024) {
                    sendJson(ex, 413, "{\"error\":\"File too large. Maximum allowed size is 7MB\"}");
                    return;
                }
                long fileSize = 0;
                try { fileSize = Long.parseLong(fileSizeStr); } catch (Exception ignored) {}
                Report report = new Report(patientId, patientName != null ? patientName : "", fileName, mimeType != null ? mimeType : "application/octet-stream", fileSize, base64Content, description != null ? description : "");
                try {
                    queueManager.addReport(report);
                    sendJson(ex, 201, reportToJson(report, false));
                } catch (RuntimeException e) {
                    sendJson(ex, 500, "{\"error\":\"Failed to save report: " + escapeJson(e.getMessage()) + "\"}");
                }
            } else {
                sendJson(ex, 405, "{\"error\":\"Method not allowed\"}");
            }
        }
    }

    static class PatientReportsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("GET")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            String query = ex.getRequestURI().getQuery();
            String patientId = extractQueryParam(query, "patientId");
            if (patientId == null || patientId.isEmpty()) {
                sendJson(ex, 400, "{\"error\":\"Missing patientId parameter\"}");
                return;
            }
            List<String> jsonList = new java.util.ArrayList<>();
            for (Report r : queueManager.getReportsByPatient(patientId)) {
                jsonList.add(reportToJson(r, false));
            }
            sendJson(ex, 200, toJsonArray(jsonList));
        }
    }

    static class ReportDownloadHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("GET")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            String query = ex.getRequestURI().getQuery();
            String reportId = extractQueryParam(query, "reportId");
            if (reportId == null || reportId.isEmpty()) {
                sendJson(ex, 400, "{\"error\":\"Missing reportId parameter\"}");
                return;
            }
            Report report = queueManager.getReport(reportId);
            if (report == null) {
                sendJson(ex, 404, "{\"error\":\"Report not found\"}");
                return;
            }
            sendJson(ex, 200, reportToJson(report, true));
        }
    }

    // ==================== AUTH HANDLERS ====================
    static class LoginHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("POST")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            String body = readBody(ex);
            String username = extractJsonString(body, "username");
            String password = extractJsonString(body, "password");
            if (username == null || password == null) {
                sendJson(ex, 400, "{\"error\":\"Missing username or password\"}");
                return;
            }
            User user = userRepo.findByUsername(username);
            if (user == null || !user.isActive()) {
                sendJson(ex, 401, "{\"error\":\"Invalid username or password\"}");
                return;
            }
            if (!UserRepository.verifyPassword(password, user.getPasswordHash())) {
                sendJson(ex, 401, "{\"error\":\"Invalid username or password\"}");
                return;
            }
            user.generateAuthToken();
            user.updateLastLogin();
            userRepo.updateToken(user);
            StringBuilder sb = new StringBuilder();
            sb.append("{");
            sb.append("\"success\":true,");
            sb.append("\"message\":\"Login successful\",");
            sb.append("\"user\":").append(userToJson(user, true));
            sb.append("}");
            sendJson(ex, 200, sb.toString());
        }
    }

    static class RegisterHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("POST")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            String body = readBody(ex);
            String username = extractJsonString(body, "username");
            String password = extractJsonString(body, "password");
            String name = extractJsonString(body, "name");
            String roleStr = extractJsonString(body, "role");
            String email = extractJsonString(body, "email");
            if (username == null || password == null || name == null) {
                sendJson(ex, 400, "{\"error\":\"Missing required fields\"}");
                return;
            }
            String trimmedUsername = username.trim();
            if (trimmedUsername.isEmpty() || trimmedUsername.length() < 3 || trimmedUsername.length() > 50) {
                sendJson(ex, 400, "{\"error\":\"Username must be between 3 and 50 characters\"}");
                return;
            }
            if (!trimmedUsername.matches("^[a-zA-Z0-9_]+$")) {
                sendJson(ex, 400, "{\"error\":\"Username can only contain letters, numbers, and underscores\"}");
                return;
            }
            if (password.length() < 4) {
                sendJson(ex, 400, "{\"error\":\"Password must be at least 4 characters\"}");
                return;
            }
            if (name.trim().isEmpty() || name.trim().length() < 2) {
                sendJson(ex, 400, "{\"error\":\"Name must be at least 2 characters\"}");
                return;
            }
            User existing = userRepo.findByUsername(trimmedUsername);
            if (existing != null) {
                sendJson(ex, 409, "{\"error\":\"Username already exists\"}");
                return;
            }
            // Allow self-registration for DOCTOR, NURSE, RECEPTIONIST, and PATIENT.
            // Admin accounts must be created via the admin endpoint.
            User.Role role = User.Role.RECEPTIONIST;
            try {
                if (roleStr != null) {
                    User.Role requested = User.Role.valueOf(roleStr.toUpperCase());
                    if (requested == User.Role.ADMIN) {
                        sendJson(ex, 403, "{\"error\":\"Admin accounts cannot be self-registered. Contact admin.\"}");
                        return;
                    }
                    role = requested;
                }
            } catch (IllegalArgumentException e) {
                sendJson(ex, 400, "{\"error\":\"Invalid role\"}");
                return;
            }
            User user = new User(trimmedUsername, UserRepository.hashPassword(password), name.trim(), role, email != null ? email.trim() : "");
            userRepo.save(user);
            sendJson(ex, 201, userToJson(user, false));
        }
    }

    static class LogoutHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("POST")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            String body = readBody(ex);
            String token = extractJsonString(body, "token");
            if (token != null) {
                User user = userRepo.findByToken(token);
                if (user != null) {
                    user.clearAuthToken();
                    userRepo.updateToken(user);
                }
            }
            sendJson(ex, 200, "{\"success\":true,\"message\":\"Logout successful\"}");
        }
    }

    static class MeHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("GET")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            String token = extractAuthToken(ex);
            if (token == null) {
                sendJson(ex, 401, "{\"error\":\"Unauthorized\"}");
                return;
            }
            User user = userRepo.findByToken(token);
            if (user == null || !user.isActive()) {
                sendJson(ex, 401, "{\"error\":\"Unauthorized\"}");
                return;
            }
            sendJson(ex, 200, userToJson(user, false));
        }
    }

    static class UsersHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("GET")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            String token = extractAuthToken(ex);
            if (token == null) {
                sendJson(ex, 401, "{\"error\":\"Unauthorized\"}");
                return;
            }
            User requester = userRepo.findByToken(token);
            if (requester == null || !requester.isActive() || requester.getRole() != User.Role.ADMIN) {
                sendJson(ex, 403, "{\"error\":\"Forbidden - Admin access required\"}");
                return;
            }
            List<String> jsonList = new java.util.ArrayList<>();
            for (User u : userRepo.findAll()) {
                jsonList.add(userToJson(u, false));
            }
            sendJson(ex, 200, toJsonArray(jsonList));
        }
    }

    static class AdminUsersHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("POST")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            User admin = requireAdmin(ex);
            if (admin == null) return;
            String body = readBody(ex);
            String username = extractJsonString(body, "username");
            String password = extractJsonString(body, "password");
            String name = extractJsonString(body, "name");
            String roleStr = extractJsonString(body, "role");
            String email = extractJsonString(body, "email");
            String activeStr = extractJsonString(body, "active");
            if (username == null || password == null || name == null || roleStr == null) {
                sendJson(ex, 400, "{\"error\":\"Missing required fields: username, password, name, role\"}");
                return;
            }
            String trimmedUsername = username.trim();
            if (trimmedUsername.isEmpty() || trimmedUsername.length() < 3 || trimmedUsername.length() > 50) {
                sendJson(ex, 400, "{\"error\":\"Username must be between 3 and 50 characters\"}");
                return;
            }
            if (!trimmedUsername.matches("^[a-zA-Z0-9_]+$")) {
                sendJson(ex, 400, "{\"error\":\"Username can only contain letters, numbers, and underscores\"}");
                return;
            }
            if (password.length() < 4) {
                sendJson(ex, 400, "{\"error\":\"Password must be at least 4 characters\"}");
                return;
            }
            User existing = userRepo.findByUsername(trimmedUsername);
            if (existing != null) {
                sendJson(ex, 409, "{\"error\":\"Username already exists\"}");
                return;
            }
            User.Role role;
            try {
                role = User.Role.valueOf(roleStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                sendJson(ex, 400, "{\"error\":\"Invalid role\"}");
                return;
            }
            boolean active = activeStr == null || activeStr.isEmpty() || Boolean.parseBoolean(activeStr);
            User user = new User(trimmedUsername, UserRepository.hashPassword(password), name, role, email != null ? email : "");
            user.setActive(active);
            userRepo.save(user);
            sendJson(ex, 201, userToJson(user, false));
        }
    }

    static class AdminUserDetailHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            String method = ex.getRequestMethod().toUpperCase();
            User admin = requireAdmin(ex);
            if (admin == null) return;
            String query = ex.getRequestURI().getQuery();
            String id = extractQueryParam(query, "id");
            if (id == null || id.isEmpty()) {
                sendJson(ex, 400, "{\"error\":\"Missing id parameter\"}");
                return;
            }
            User target = userRepo.findById(id);
            if (target == null) {
                sendJson(ex, 404, "{\"error\":\"User not found\"}");
                return;
            }
            if (target.getId().equals(admin.getId())) {
                sendJson(ex, 403, "{\"error\":\"You cannot modify or delete your own account\"}");
                return;
            }
            if (method.equals("GET")) {
                sendJson(ex, 200, userToJson(target, false));
            } else if (method.equals("PUT")) {
                String body = readBody(ex);
                String name = extractJsonString(body, "name");
                String roleStr = extractJsonString(body, "role");
                String email = extractJsonString(body, "email");
                String activeStr = extractJsonString(body, "active");
                String password = extractJsonString(body, "password");
                if (name != null) target.setName(name);
                if (email != null) target.setEmail(email);
                if (activeStr != null) target.setActive(Boolean.parseBoolean(activeStr));
                if (roleStr != null) {
                    try {
                        target.setRole(User.Role.valueOf(roleStr.toUpperCase()));
                    } catch (IllegalArgumentException e) {
                        sendJson(ex, 400, "{\"error\":\"Invalid role\"}");
                        return;
                    }
                }
                if (password != null && !password.isEmpty()) {
                    target.setPasswordHash(UserRepository.hashPassword(password));
                }
                userRepo.save(target);
                sendJson(ex, 200, userToJson(target, false));
            } else if (method.equals("DELETE")) {
                userRepo.deleteById(id);
                sendJson(ex, 200, "{\"success\":true,\"message\":\"User deleted\"}");
            } else {
                sendJson(ex, 405, "{\"error\":\"Method not allowed\"}");
            }
        }
    }

    private static String extractAuthToken(HttpExchange ex) {
        String authHeader = ex.getRequestHeaders().getFirst("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return null;
    }

    private static User requireAdmin(HttpExchange ex) throws IOException {
        String token = extractAuthToken(ex);
        if (token == null) {
            sendJson(ex, 401, "{\"error\":\"Unauthorized\"}");
            return null;
        }
        User requester = userRepo.findByToken(token);
        if (requester == null || !requester.isActive() || requester.getRole() != User.Role.ADMIN) {
            sendJson(ex, 403, "{\"error\":\"Forbidden - Admin access required\"}");
            return null;
        }
        return requester;
    }

    // ==================== Simple JSON/String Helpers ====================
    private static String extractJsonString(String json, String key) {
        String quotedKey = "\"" + key + "\"";
        int keyPos = json.indexOf(quotedKey);
        if (keyPos == -1) return null;
        int colonPos = json.indexOf(':', keyPos + quotedKey.length());
        if (colonPos == -1) return null;
        int start = colonPos + 1;
        while (start < json.length() && Character.isWhitespace(json.charAt(start))) start++;
        if (start >= json.length()) return null;
        char firstChar = json.charAt(start);
        if (firstChar == '"') {
            start++;
            int end = start;
            boolean escaped = false;
            while (end < json.length()) {
                char c = json.charAt(end);
                if (escaped) {
                    escaped = false;
                } else if (c == '\\') {
                    escaped = true;
                } else if (c == '"') {
                    break;
                }
                end++;
            }
            return json.substring(start, end);
        } else {
            int end = start;
            while (end < json.length() && (Character.isLetterOrDigit(json.charAt(end)) || json.charAt(end) == '.' || json.charAt(end) == '-' || json.charAt(end) == '+' || json.charAt(end) == '_')) {
                end++;
            }
            return json.substring(start, end).trim();
        }
    }

    private static String extractQueryParam(String query, String key) {
        if (query == null) return null;
        for (String param : query.split("&")) {
            String[] parts = param.split("=");
            if (parts.length == 2 && parts[0].equals(key)) {
                return java.net.URLDecoder.decode(parts[1], StandardCharsets.UTF_8);
            }
        }
        return null;
    }

    // ==================== CW SCOPE: UNDO STACK HANDLERS ====================
    static class UndoHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("POST")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            String action = queueManager.undoLastAction();
            if (action == null) {
                sendJson(ex, 200, "{\"success\":false,\"message\":\"No actions to undo\"}");
                return;
            }
            StringBuilder sb = new StringBuilder();
            sb.append("{");
            sb.append("\"success\":true,");
            sb.append("\"undoneAction\":\"").append(escapeJson(action)).append("\"");
            sb.append("}");
            sendJson(ex, 200, sb.toString());
        }
    }

    static class UndoStackHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("GET")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            List<String> actions = queueManager.getUndoStack();
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < actions.size(); i++) {
                if (i > 0) sb.append(",");
                sb.append("\"").append(escapeJson(actions.get(i))).append("\"");
            }
            sb.append("]");
            sendJson(ex, 200, "{\"size\":" + queueManager.getUndoStackSize() + ",\"actions\":" + sb.toString() + "}");
        }
    }

    // ==================== CW SCOPE: AVL TREE HANDLERS ====================
    static class AVLMedicationsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("GET")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            List<String> jsonList = new java.util.ArrayList<>();
            for (Medication m : queueManager.getAVLMedications()) {
                jsonList.add(medicationToJson(m));
            }
            sendJson(ex, 200, toJsonArray(jsonList));
        }
    }

    static class AVLStatsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("GET")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            StringBuilder sb = new StringBuilder();
            sb.append("{");
            sb.append("\"size\":").append(queueManager.getAVLTreeSize()).append(",");
            sb.append("\"height\":").append(queueManager.getAVLTreeHeight()).append(",");
            sb.append("\"isBalanced\":").append(queueManager.isAVLTreeBalanced()).append(",");
            sb.append("\"rootBalanceFactor\":").append(queueManager.getAVLTreeBalanceFactor());
            sb.append("}");
            sendJson(ex, 200, sb.toString());
        }
    }

    // ==================== CW SCOPE: SORTING ALGORITHMS HANDLER ====================
    static class SortPatientsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("GET")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            String query = ex.getRequestURI().getQuery();
            String sortBy = extractQueryParam(query, "sortBy");
            String algorithm = extractQueryParam(query, "algorithm");
            if (sortBy == null) sortBy = "severity";
            if (algorithm == null) algorithm = "bubble";

            List<Patient> allPatients = queueManager.getAllWaitingPatients();
            allPatients.addAll(queueManager.getTreatedPatients());
            Patient[] patientArray = allPatients.toArray(new Patient[0]);

            java.util.Comparator<Patient> comparator;
            switch (sortBy.toLowerCase()) {
                case "name": comparator = com.hospital.datastructures.SortingAlgorithms.BY_NAME; break;
                case "age": comparator = com.hospital.datastructures.SortingAlgorithms.BY_AGE; break;
                case "registration": comparator = com.hospital.datastructures.SortingAlgorithms.BY_REGISTRATION_TIME; break;
                case "severity":
                default: comparator = com.hospital.datastructures.SortingAlgorithms.BY_SEVERITY; break;
            }

            int comparisons = 0;
            long startTime = System.nanoTime();
            if ("selection".equalsIgnoreCase(algorithm)) {
                comparisons = com.hospital.datastructures.SortingAlgorithms.selectionSort(patientArray, comparator);
            } else {
                comparisons = com.hospital.datastructures.SortingAlgorithms.bubbleSort(patientArray, comparator);
            }
            long endTime = System.nanoTime();
            long durationMs = (endTime - startTime) / 1_000_000;

            List<String> jsonList = new java.util.ArrayList<>();
            for (Patient p : patientArray) {
                jsonList.add(patientToJson(p));
            }
            StringBuilder sb = new StringBuilder();
            sb.append("{");
            sb.append("\"algorithm\":\"").append(escapeJson(algorithm)).append("\",");
            sb.append("\"sortBy\":\"").append(escapeJson(sortBy)).append("\",");
            sb.append("\"comparisons\":").append(comparisons).append(",");
            sb.append("\"durationMs\":").append(durationMs).append(",");
            sb.append("\"count\":").append(patientArray.length).append(",");
            sb.append("\"patients\":").append(toJsonArray(jsonList));
            sb.append("}");
            sendJson(ex, 200, sb.toString());
        }
    }

    // ==================== CW SCOPE: KRUSKAL MST HANDLER ====================
    static class KruskalMSTHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendOptions(ex); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("GET")) { sendJson(ex, 405, "{\"error\":\"Method not allowed\"}"); return; }
            com.hospital.datastructures.KruskalMST.MSTResult result = com.hospital.datastructures.KruskalMST.findMST(dispatchService.getHospitalGraph());
            StringBuilder edgesJson = new StringBuilder("[");
            for (int i = 0; i < result.getEdges().size(); i++) {
                if (i > 0) edgesJson.append(",");
                com.hospital.datastructures.KruskalMST.RoadEdge edge = result.getEdges().get(i);
                edgesJson.append("{");
                edgesJson.append("\"fromId\":\"").append(escapeJson(edge.fromId)).append("\",");
                edgesJson.append("\"toId\":\"").append(escapeJson(edge.toId)).append("\",");
                edgesJson.append("\"fromName\":\"").append(escapeJson(edge.fromName)).append("\",");
                edgesJson.append("\"toName\":\"").append(escapeJson(edge.toName)).append("\",");
                edgesJson.append("\"distance\":").append(String.format("%.1f", edge.distance));
                edgesJson.append("}");
            }
            edgesJson.append("]");
            StringBuilder sb = new StringBuilder();
            sb.append("{");
            sb.append("\"totalDistance\":").append(String.format("%.1f", result.getTotalDistance())).append(",");
            sb.append("\"edgeCount\":").append(result.getEdgeCount()).append(",");
            sb.append("\"comparisons\":").append(result.getComparisons()).append(",");
            sb.append("\"unions\":").append(result.getUnions()).append(",");
            sb.append("\"isConnected\":").append(result.isConnected(dispatchService.getHospitalGraph().getAllHospitals().size())).append(",");
            sb.append("\"edges\":").append(edgesJson);
            sb.append("}");
            sendJson(ex, 200, sb.toString());
        }
    }
}
