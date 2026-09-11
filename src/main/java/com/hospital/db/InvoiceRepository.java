package com.hospital.db;

import com.hospital.model.Invoice;

import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class InvoiceRepository {

    public void save(Invoice i) {
        String sql = "MERGE INTO invoices (id, patient_id, patient_name, invoice_number, type, base_amount, discount, tax, total_amount, description, hospital_name, doctor_name, status, created_at, paid_at) " +
                     "KEY (id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            setParams(ps, i);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to save invoice: " + e.getMessage(), e);
        }
    }

    public void update(Invoice i) {
        String sql = "UPDATE invoices SET status = ?, paid_at = ? WHERE id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, i.getStatus().name());
            if (i.getPaidAt() != null) {
                ps.setTimestamp(2, Timestamp.valueOf(i.getPaidAt()));
            } else {
                ps.setNull(2, Types.TIMESTAMP);
            }
            ps.setString(3, i.getId());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to update invoice: " + e.getMessage(), e);
        }
    }

    public void deleteAll() {
        String sql = "DELETE FROM invoices";
        try (Connection conn = DatabaseManager.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.executeUpdate(sql);
        } catch (SQLException e) {
            throw new RuntimeException("Failed to delete invoices: " + e.getMessage(), e);
        }
    }

    public List<Invoice> findAll() {
        List<Invoice> list = new ArrayList<>();
        String sql = "SELECT * FROM invoices";
        try (Connection conn = DatabaseManager.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                list.add(mapRow(rs));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to load invoices: " + e.getMessage(), e);
        }
        return list;
    }

    public Invoice findById(String id) {
        String sql = "SELECT * FROM invoices WHERE id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                return mapRow(rs);
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to find invoice: " + e.getMessage(), e);
        }
        return null;
    }

    private void setParams(PreparedStatement ps, Invoice i) throws SQLException {
        ps.setString(1, i.getId());
        ps.setString(2, i.getPatientId());
        ps.setString(3, i.getPatientName());
        ps.setString(4, i.getInvoiceNumber());
        ps.setString(5, i.getType().name());
        ps.setDouble(6, i.getBaseAmount());
        ps.setDouble(7, i.getDiscount());
        ps.setDouble(8, i.getTax());
        ps.setDouble(9, i.getTotalAmount());
        ps.setString(10, i.getDescription());
        ps.setString(11, i.getHospitalName());
        ps.setString(12, i.getDoctorName());
        ps.setString(13, i.getStatus().name());
        ps.setTimestamp(14, Timestamp.valueOf(i.getCreatedAt()));
        if (i.getPaidAt() != null) {
            ps.setTimestamp(15, Timestamp.valueOf(i.getPaidAt()));
        } else {
            ps.setNull(15, Types.TIMESTAMP);
        }
    }

    private Invoice mapRow(ResultSet rs) throws SQLException {
        Invoice.InvoiceType type = Invoice.InvoiceType.CONSULTATION;
        try {
            type = Invoice.InvoiceType.valueOf(rs.getString("type"));
        } catch (IllegalArgumentException ignored) {}

        Invoice.InvoiceStatus status = Invoice.InvoiceStatus.PENDING;
        try {
            status = Invoice.InvoiceStatus.valueOf(rs.getString("status"));
        } catch (IllegalArgumentException ignored) {}

        Timestamp paidAt = rs.getTimestamp("paid_at");
        LocalDateTime paidAtLdt = null;
        if (paidAt != null) {
            paidAtLdt = paidAt.toLocalDateTime();
        }

        Invoice i = new Invoice(
            rs.getString("id"),
            rs.getString("patient_id"),
            rs.getString("patient_name"),
            rs.getString("invoice_number"),
            type,
            rs.getDouble("base_amount"),
            rs.getDouble("discount"),
            rs.getDouble("tax"),
            rs.getDouble("total_amount"),
            rs.getString("description"),
            rs.getString("hospital_name"),
            rs.getString("doctor_name"),
            status,
            rs.getTimestamp("created_at").toLocalDateTime(),
            paidAtLdt
        );
        return i;
    }
}
