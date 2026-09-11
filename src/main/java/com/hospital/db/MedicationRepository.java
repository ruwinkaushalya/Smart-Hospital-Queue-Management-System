package com.hospital.db;

import com.hospital.model.Medication;

import java.sql.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class MedicationRepository {

    public void save(Medication m) {
        String sql = "MERGE INTO medications (id, name, category, description, stock, reorder_threshold, price_per_unit, expiry_date, supplier, dosage, unit) " +
                     "KEY (id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            setParams(ps, m);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to save medication: " + e.getMessage(), e);
        }
    }

    public void updateStock(String id, int stock) {
        String sql = "UPDATE medications SET stock = ? WHERE id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, stock);
            ps.setString(2, id);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to update medication stock: " + e.getMessage(), e);
        }
    }

    public void delete(String id) {
        String sql = "DELETE FROM medications WHERE id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to delete medication: " + e.getMessage(), e);
        }
    }

    public void deleteAll() {
        String sql = "DELETE FROM medications";
        try (Connection conn = DatabaseManager.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.executeUpdate(sql);
        } catch (SQLException e) {
            throw new RuntimeException("Failed to delete medications: " + e.getMessage(), e);
        }
    }

    public List<Medication> findAll() {
        List<Medication> list = new ArrayList<>();
        String sql = "SELECT * FROM medications";
        try (Connection conn = DatabaseManager.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                list.add(mapRow(rs));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to load medications: " + e.getMessage(), e);
        }
        return list;
    }

    public Medication findById(String id) {
        String sql = "SELECT * FROM medications WHERE id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                return mapRow(rs);
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to find medication: " + e.getMessage(), e);
        }
        return null;
    }

    private void setParams(PreparedStatement ps, Medication m) throws SQLException {
        ps.setString(1, m.getId());
        ps.setString(2, m.getName());
        ps.setString(3, m.getCategory());
        ps.setString(4, m.getDescription());
        ps.setInt(5, m.getStock());
        ps.setInt(6, m.getReorderThreshold());
        ps.setDouble(7, m.getPricePerUnit());
        if (m.getExpiryDate() != null) {
            ps.setDate(8, Date.valueOf(m.getExpiryDate()));
        } else {
            ps.setNull(8, Types.DATE);
        }
        ps.setString(9, m.getSupplier());
        ps.setString(10, m.getDosage());
        ps.setString(11, m.getUnit());
    }

    private Medication mapRow(ResultSet rs) throws SQLException {
        LocalDate expiry = null;
        Date expiryDate = rs.getDate("expiry_date");
        if (expiryDate != null) {
            expiry = expiryDate.toLocalDate();
        }
        return new Medication(
            rs.getString("id"),
            rs.getString("name"),
            rs.getString("category"),
            rs.getString("description"),
            rs.getInt("stock"),
            rs.getInt("reorder_threshold"),
            rs.getDouble("price_per_unit"),
            expiry,
            rs.getString("supplier"),
            rs.getString("dosage"),
            rs.getString("unit")
        );
    }
}
