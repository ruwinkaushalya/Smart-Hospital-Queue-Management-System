package com.hospital.db;

import com.hospital.model.Report;

import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class ReportRepository {

    public void save(Report r) {
        String sql = "MERGE INTO reports (id, patient_id, patient_name, file_name, mime_type, file_size, base64_content, description, doctor_name, status, uploaded_at) " +
                     "KEY (id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            setParams(ps, r);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to save report: " + e.getMessage(), e);
        }
    }

    public void updateStatus(String id, String status, String doctorName) {
        String sql = "UPDATE reports SET status = ?, doctor_name = ? WHERE id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, status);
            ps.setString(2, doctorName);
            ps.setString(3, id);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to update report status: " + e.getMessage(), e);
        }
    }

    public void delete(String id) {
        String sql = "DELETE FROM reports WHERE id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to delete report: " + e.getMessage(), e);
        }
    }

    public void deleteAll() {
        String sql = "DELETE FROM reports";
        try (Connection conn = DatabaseManager.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.executeUpdate(sql);
        } catch (SQLException e) {
            throw new RuntimeException("Failed to delete reports: " + e.getMessage(), e);
        }
    }

    public List<Report> findAll() {
        List<Report> list = new ArrayList<>();
        String sql = "SELECT * FROM reports ORDER BY uploaded_at DESC";
        try (Connection conn = DatabaseManager.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                list.add(mapRow(rs));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to load reports: " + e.getMessage(), e);
        }
        return list;
    }

    public List<Report> findByPatientId(String patientId) {
        List<Report> list = new ArrayList<>();
        String sql = "SELECT * FROM reports WHERE patient_id = ? ORDER BY uploaded_at DESC";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, patientId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                list.add(mapRow(rs));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to find reports by patient: " + e.getMessage(), e);
        }
        return list;
    }

    public Report findById(String id) {
        String sql = "SELECT * FROM reports WHERE id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                return mapRow(rs);
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to find report: " + e.getMessage(), e);
        }
        return null;
    }

    private void setParams(PreparedStatement ps, Report r) throws SQLException {
        ps.setString(1, r.getId());
        ps.setString(2, r.getPatientId());
        ps.setString(3, r.getPatientName());
        ps.setString(4, r.getFileName());
        ps.setString(5, r.getMimeType());
        ps.setLong(6, r.getFileSize());
        ps.setString(7, r.getBase64Content());
        ps.setString(8, r.getDescription());
        ps.setString(9, r.getDoctorName());
        ps.setString(10, r.getStatus());
        ps.setTimestamp(11, Timestamp.valueOf(r.getUploadedAt()));
    }

    private Report mapRow(ResultSet rs) throws SQLException {
        LocalDateTime uploadedAt = null;
        Timestamp ts = rs.getTimestamp("uploaded_at");
        if (ts != null) uploadedAt = ts.toLocalDateTime();
        return new Report(
            rs.getString("id"),
            rs.getString("patient_id"),
            rs.getString("patient_name"),
            rs.getString("file_name"),
            rs.getString("mime_type"),
            rs.getLong("file_size"),
            rs.getString("base64_content"),
            rs.getString("description"),
            rs.getString("doctor_name"),
            rs.getString("status"),
            uploadedAt
        );
    }
}
