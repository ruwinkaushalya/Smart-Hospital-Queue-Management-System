package com.hospital.db;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

public class DatabaseManager {
    private static final String URL = "jdbc:h2:file:./hospital_db;DB_CLOSE_DELAY=-1;AUTO_SERVER=TRUE";
    private static final String USER = "sa";
    private static final String PASS = "";
    private static volatile boolean schemaInitialized = false;
    static {
        try {
            Class.forName("org.h2.Driver");
        } catch (ClassNotFoundException e) {
            throw new RuntimeException("H2 Driver not found. Ensure lib/h2.jar is in classpath.", e);
        }
    }

    public static Connection getConnection() throws SQLException {
        Connection conn = DriverManager.getConnection(URL, USER, PASS);
        if (!schemaInitialized) {
            synchronized (DatabaseManager.class) {
                if (!schemaInitialized) {
                    initSchema(conn);
                    schemaInitialized = true;
                }
            }
        }
        return conn;
    }

    private static void initSchema(Connection conn) throws SQLException {
        try (Statement stmt = conn.createStatement()) {
            stmt.execute(
                "CREATE TABLE IF NOT EXISTS hospitals (" +
                "  id VARCHAR(50) PRIMARY KEY," +
                "  name VARCHAR(255)," +
                "  address VARCHAR(255)," +
                "  latitude DOUBLE," +
                "  longitude DOUBLE," +
                "  total_beds INT," +
                "  available_beds INT," +
                "  total_icu INT," +
                "  available_icu INT," +
                "  emergency_doctors INT," +
                "  available_doctors INT," +
                "  has_emergency_unit BOOLEAN," +
                "  avg_treatment_time DOUBLE DEFAULT 45.0" +
                ")"
            );

            stmt.execute(
                "CREATE TABLE IF NOT EXISTS patients (" +
                "  id VARCHAR(50) PRIMARY KEY," +
                "  name VARCHAR(255)," +
                "  age INT," +
                "  contact_number VARCHAR(50)," +
                "  symptoms VARCHAR(500)," +
                "  severity VARCHAR(20)," +
                "  registration_time TIMESTAMP," +
                "  treatment_start_time TIMESTAMP," +
                "  assigned_hospital VARCHAR(255)," +
                "  treated BOOLEAN DEFAULT FALSE," +
                "  estimated_wait_time INT DEFAULT 0," +
                "  ai_priority_score DOUBLE DEFAULT 0.0" +
                ")"
            );
            // Add missing columns for older database files
            stmt.execute("ALTER TABLE patients ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'WAITING'");
            stmt.execute("ALTER TABLE patients ADD COLUMN IF NOT EXISTS assigned_doctor_id VARCHAR(50)");
            stmt.execute("ALTER TABLE patients ADD COLUMN IF NOT EXISTS assigned_doctor_name VARCHAR(255)");
            stmt.execute("ALTER TABLE patients ADD COLUMN IF NOT EXISTS preferred_doctor_id VARCHAR(50)");

            stmt.execute(
                "CREATE TABLE IF NOT EXISTS ambulances (" +
                "  id VARCHAR(50) PRIMARY KEY," +
                "  driver_name VARCHAR(255)," +
                "  contact_number VARCHAR(50)," +
                "  latitude DOUBLE," +
                "  longitude DOUBLE," +
                "  status VARCHAR(50) DEFAULT 'AVAILABLE'," +
                "  assigned_patient_id VARCHAR(50)," +
                "  destination_hospital_id VARCHAR(50)," +
                "  dispatch_time TIMESTAMP," +
                "  estimated_arrival_minutes DOUBLE DEFAULT 0.0," +
                "  distance_km DOUBLE DEFAULT 0.0" +
                ")"
            );

            stmt.execute(
                "CREATE TABLE IF NOT EXISTS roads (" +
                "  from_hospital_id VARCHAR(50)," +
                "  to_hospital_id VARCHAR(50)," +
                "  distance_km DOUBLE," +
                "  PRIMARY KEY (from_hospital_id, to_hospital_id)" +
                ")"
            );

            stmt.execute(
                "CREATE TABLE IF NOT EXISTS doctors (" +
                "  id VARCHAR(50) PRIMARY KEY," +
                "  name VARCHAR(255)," +
                "  specialty VARCHAR(100)," +
                "  phone VARCHAR(50)," +
                "  hospital_id VARCHAR(50)," +
                "  on_duty BOOLEAN DEFAULT TRUE," +
                "  current_patient_id VARCHAR(50)," +
                "  patients_today INT DEFAULT 0," +
                "  max_patients_per_day INT DEFAULT 10" +
                ")"
            );

            stmt.execute(
                "CREATE TABLE IF NOT EXISTS notifications (" +
                "  id VARCHAR(50) PRIMARY KEY," +
                "  recipient VARCHAR(100)," +
                "  recipient_type VARCHAR(20)," +
                "  message VARCHAR(500)," +
                "  type VARCHAR(20)," +
                "  status VARCHAR(20)," +
                "  timestamp TIMESTAMP" +
                ")"
            );

            stmt.execute(
                "CREATE TABLE IF NOT EXISTS medications (" +
                "  id VARCHAR(50) PRIMARY KEY," +
                "  name VARCHAR(255)," +
                "  category VARCHAR(100)," +
                "  description VARCHAR(500)," +
                "  stock INT DEFAULT 0," +
                "  reorder_threshold INT DEFAULT 10," +
                "  price_per_unit DOUBLE DEFAULT 0.0," +
                "  expiry_date DATE," +
                "  supplier VARCHAR(255)," +
                "  dosage VARCHAR(100)," +
                "  unit VARCHAR(50)" +
                ")"
            );

            stmt.execute(
                "CREATE TABLE IF NOT EXISTS visit_records (" +
                "  id VARCHAR(50) PRIMARY KEY," +
                "  patient_id VARCHAR(50)," +
                "  patient_name VARCHAR(255)," +
                "  visit_date DATE," +
                "  type VARCHAR(20)," +
                "  diagnosis VARCHAR(500)," +
                "  treatment VARCHAR(500)," +
                "  doctor_name VARCHAR(255)," +
                "  hospital_name VARCHAR(255)," +
                "  medication_cost DOUBLE DEFAULT 0.0," +
                "  procedure_cost DOUBLE DEFAULT 0.0," +
                "  bed_cost DOUBLE DEFAULT 0.0," +
                "  total_cost DOUBLE DEFAULT 0.0," +
                "  notes VARCHAR(1000)," +
                "  created_at TIMESTAMP" +
                ")"
            );

            stmt.execute(
                "CREATE TABLE IF NOT EXISTS invoices (" +
                "  id VARCHAR(50) PRIMARY KEY," +
                "  patient_id VARCHAR(50)," +
                "  patient_name VARCHAR(255)," +
                "  invoice_number VARCHAR(100)," +
                "  type VARCHAR(20)," +
                "  base_amount DOUBLE DEFAULT 0.0," +
                "  discount DOUBLE DEFAULT 0.0," +
                "  tax DOUBLE DEFAULT 0.0," +
                "  total_amount DOUBLE DEFAULT 0.0," +
                "  description VARCHAR(500)," +
                "  hospital_name VARCHAR(255)," +
                "  doctor_name VARCHAR(255)," +
                "  status VARCHAR(20)," +
                "  created_at TIMESTAMP," +
                "  paid_at TIMESTAMP" +
                ")"
            );

            stmt.execute(
                "CREATE TABLE IF NOT EXISTS users (" +
                "  id VARCHAR(50) PRIMARY KEY," +
                "  username VARCHAR(100) UNIQUE NOT NULL," +
                "  password_hash VARCHAR(255) NOT NULL," +
                "  name VARCHAR(255)," +
                "  role VARCHAR(20) DEFAULT 'RECEPTIONIST'," +
                "  email VARCHAR(255)," +
                "  active BOOLEAN DEFAULT TRUE," +
                "  created_at TIMESTAMP," +
                "  last_login TIMESTAMP," +
                "  auth_token VARCHAR(255)" +
                ")"
            );

            stmt.execute(
                "CREATE TABLE IF NOT EXISTS reports (" +
                "  id VARCHAR(50) PRIMARY KEY," +
                "  patient_id VARCHAR(50)," +
                "  patient_name VARCHAR(255)," +
                "  file_name VARCHAR(255)," +
                "  mime_type VARCHAR(100)," +
                "  file_size BIGINT," +
                "  base64_content CLOB," +
                "  description VARCHAR(500)," +
                "  doctor_name VARCHAR(255)," +
                "  status VARCHAR(20) DEFAULT 'PENDING'," +
                "  uploaded_at TIMESTAMP" +
                ")"
            );
        }
    }

    public static void resetSchema() {
        schemaInitialized = false;
    }
}
