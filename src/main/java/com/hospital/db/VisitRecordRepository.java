package com.hospital.db;

import com.hospital.model.VisitRecord;

import java.sql.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class VisitRecordRepository {

    public void save(VisitRecord v) {
        String sql = "MERGE INTO visit_records (id, patient_id, patient_name, visit_date, type, diagnosis, treatment, doctor_name, hospital_name, medication_cost, procedure_cost, bed_cost, total_cost, notes, created_at) " +
                     "KEY (id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            setParams(ps, v);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to save visit record: " + e.getMessage(), e);
        }
    }

    public void deleteAll() {
        String sql = "DELETE FROM visit_records";
        try (Connection conn = DatabaseManager.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.executeUpdate(sql);
        } catch (SQLException e) {
            throw new RuntimeException("Failed to delete visit records: " + e.getMessage(), e);
        }
    }

    public List<VisitRecord> findAll() {
        List<VisitRecord> list = new ArrayList<>();
        String sql = "SELECT * FROM visit_records";
        try (Connection conn = DatabaseManager.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                list.add(mapRow(rs));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to load visit records: " + e.getMessage(), e);
        }
        return list;
    }

    public List<VisitRecord> findByPatientId(String patientId) {
        List<VisitRecord> list = new ArrayList<>();
        String sql = "SELECT * FROM visit_records WHERE patient_id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, patientId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                list.add(mapRow(rs));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to find visit records by patient: " + e.getMessage(), e);
        }
        return list;
    }

    public VisitRecord findById(String id) {
        String sql = "SELECT * FROM visit_records WHERE id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                return mapRow(rs);
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to find visit record: " + e.getMessage(), e);
        }
        return null;
    }

    private void setParams(PreparedStatement ps, VisitRecord v) throws SQLException {
        ps.setString(1, v.getId());
        ps.setString(2, v.getPatientId());
        ps.setString(3, v.getPatientName());
        ps.setDate(4, Date.valueOf(v.getVisitDate()));
        ps.setString(5, v.getType().name());
        ps.setString(6, v.getDiagnosis());
        ps.setString(7, v.getTreatment());
        ps.setString(8, v.getDoctorName());
        ps.setString(9, v.getHospitalName());
        ps.setDouble(10, v.getMedicationCost());
        ps.setDouble(11, v.getProcedureCost());
        ps.setDouble(12, v.getBedCost());
        ps.setDouble(13, v.getTotalCost());
        ps.setString(14, v.getNotes());
        ps.setTimestamp(15, Timestamp.valueOf(v.getCreatedAt()));
    }

    private VisitRecord mapRow(ResultSet rs) throws SQLException {
        VisitRecord.VisitType type = VisitRecord.VisitType.OUTPATIENT;
        try {
            type = VisitRecord.VisitType.valueOf(rs.getString("type"));
        } catch (IllegalArgumentException ignored) {}

        VisitRecord v = new VisitRecord(
            rs.getString("id"),
            rs.getString("patient_id"),
            rs.getString("patient_name"),
            rs.getDate("visit_date").toLocalDate(),
            type,
            rs.getString("diagnosis"),
            rs.getString("treatment"),
            rs.getString("doctor_name"),
            rs.getString("hospital_name"),
            rs.getDouble("medication_cost"),
            rs.getDouble("procedure_cost"),
            rs.getDouble("bed_cost"),
            rs.getDouble("total_cost"),
            rs.getString("notes"),
            rs.getTimestamp("created_at").toLocalDateTime()
        );
        return v;
    }
}
