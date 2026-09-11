package com.hospital.db;

import com.hospital.model.Patient;

import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class PatientRepository {

    public void save(Patient p) {
        String sql = "MERGE INTO patients (id, name, age, contact_number, symptoms, severity, registration_time, treatment_start_time, assigned_hospital, treated, estimated_wait_time, ai_priority_score, status, assigned_doctor_id, assigned_doctor_name, preferred_doctor_id) " +
                     "KEY (id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            setPatientParams(ps, p);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to save patient: " + e.getMessage(), e);
        }
    }

    public void update(Patient p) {
        String sql = "UPDATE patients SET treatment_start_time=?, assigned_hospital=?, treated=?, estimated_wait_time=?, ai_priority_score=?, status=?, assigned_doctor_id=?, assigned_doctor_name=?, preferred_doctor_id=? WHERE id=?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            if (p.getTreatmentStartTime() != null) {
                ps.setTimestamp(1, Timestamp.valueOf(p.getTreatmentStartTime()));
            } else {
                ps.setNull(1, Types.TIMESTAMP);
            }
            ps.setString(2, p.getAssignedHospital());
            ps.setBoolean(3, p.isTreated());
            ps.setInt(4, p.getEstimatedWaitTimeMinutes());
            ps.setDouble(5, p.getAiPriorityScore());
            ps.setString(6, p.getStatus() != null ? p.getStatus().name() : Patient.PatientStatus.WAITING.name());
            ps.setString(7, p.getAssignedDoctorId());
            ps.setString(8, p.getAssignedDoctorName());
            ps.setString(9, p.getPreferredDoctorId());
            ps.setString(10, p.getId());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to update patient: " + e.getMessage(), e);
        }
    }

    public void deleteAll() {
        String sql = "DELETE FROM patients";
        try (Connection conn = DatabaseManager.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.executeUpdate(sql);
        } catch (SQLException e) {
            throw new RuntimeException("Failed to delete patients: " + e.getMessage(), e);
        }
    }

    public List<Patient> findAll() {
        List<Patient> list = new ArrayList<>();
        String sql = "SELECT * FROM patients";
        try (Connection conn = DatabaseManager.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                list.add(mapRow(rs));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to load patients: " + e.getMessage(), e);
        }
        return list;
    }

    private void setPatientParams(PreparedStatement ps, Patient p) throws SQLException {
        ps.setString(1, p.getId());
        ps.setString(2, p.getName());
        ps.setInt(3, p.getAge());
        ps.setString(4, p.getContactNumber());
        ps.setString(5, p.getSymptoms());
        ps.setString(6, p.getSeverity().name());
        ps.setTimestamp(7, Timestamp.valueOf(p.getRegistrationTime()));
        if (p.getTreatmentStartTime() != null) {
            ps.setTimestamp(8, Timestamp.valueOf(p.getTreatmentStartTime()));
        } else {
            ps.setNull(8, Types.TIMESTAMP);
        }
        ps.setString(9, p.getAssignedHospital());
        ps.setBoolean(10, p.isTreated());
        ps.setInt(11, p.getEstimatedWaitTimeMinutes());
        ps.setDouble(12, p.getAiPriorityScore());
        ps.setString(13, p.getStatus() != null ? p.getStatus().name() : Patient.PatientStatus.WAITING.name());
        ps.setString(14, p.getAssignedDoctorId());
        ps.setString(15, p.getAssignedDoctorName());
        ps.setString(16, p.getPreferredDoctorId());
    }

    private Patient mapRow(ResultSet rs) throws SQLException {
        Patient.Severity severity = Patient.Severity.LOW;
        try {
            severity = Patient.Severity.valueOf(rs.getString("severity"));
        } catch (IllegalArgumentException ignored) {}

        Patient p = new Patient(
            rs.getString("id"),
            rs.getString("name"),
            rs.getInt("age"),
            rs.getString("contact_number"),
            rs.getString("symptoms"),
            severity
        );
        p.setRegistrationTime(rs.getTimestamp("registration_time").toLocalDateTime());
        Timestamp treatmentTime = rs.getTimestamp("treatment_start_time");
        if (treatmentTime != null) {
            p.setTreatmentStartTime(treatmentTime.toLocalDateTime());
        }
        p.setAssignedHospital(rs.getString("assigned_hospital"));
        p.setTreated(rs.getBoolean("treated"));
        p.setEstimatedWaitTimeMinutes(rs.getInt("estimated_wait_time"));
        p.setAiPriorityScore(rs.getDouble("ai_priority_score"));
        Patient.PatientStatus status = Patient.PatientStatus.WAITING;
        try {
            status = Patient.PatientStatus.valueOf(rs.getString("status"));
        } catch (IllegalArgumentException | NullPointerException ignored) {}
        p.setStatus(status);
        p.setAssignedDoctorId(rs.getString("assigned_doctor_id"));
        p.setAssignedDoctorName(rs.getString("assigned_doctor_name"));
        p.setPreferredDoctorId(rs.getString("preferred_doctor_id"));
        return p;
    }
}
