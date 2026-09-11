package com.hospital.db;

import com.hospital.model.Hospital;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class HospitalRepository {

    public void save(Hospital h) {
        String sql = "MERGE INTO hospitals (id, name, address, latitude, longitude, total_beds, available_beds, total_icu, available_icu, emergency_doctors, available_doctors, has_emergency_unit, avg_treatment_time) " +
                     "KEY (id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            setHospitalParams(ps, h);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to save hospital: " + e.getMessage(), e);
        }
    }

    public void updateResources(Hospital h) {
        String sql = "UPDATE hospitals SET available_beds=?, available_icu=?, available_doctors=? WHERE id=?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, h.getAvailableBeds());
            ps.setInt(2, h.getAvailableICU());
            ps.setInt(3, h.getAvailableDoctors());
            ps.setString(4, h.getId());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to update hospital resources: " + e.getMessage(), e);
        }
    }

    public List<Hospital> findAll() {
        List<Hospital> list = new ArrayList<>();
        String sql = "SELECT * FROM hospitals";
        try (Connection conn = DatabaseManager.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                list.add(mapRow(rs));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to load hospitals: " + e.getMessage(), e);
        }
        return list;
    }

    private void setHospitalParams(PreparedStatement ps, Hospital h) throws SQLException {
        ps.setString(1, h.getId());
        ps.setString(2, h.getName());
        ps.setString(3, h.getAddress());
        ps.setDouble(4, h.getLatitude());
        ps.setDouble(5, h.getLongitude());
        ps.setInt(6, h.getTotalBeds());
        ps.setInt(7, h.getAvailableBeds());
        ps.setInt(8, h.getTotalICU());
        ps.setInt(9, h.getAvailableICU());
        ps.setInt(10, h.getEmergencyDoctors());
        ps.setInt(11, h.getAvailableDoctors());
        ps.setBoolean(12, h.isHasEmergencyUnit());
        ps.setDouble(13, h.getAverageTreatmentTimeMinutes());
    }

    private Hospital mapRow(ResultSet rs) throws SQLException {
        Hospital h = new Hospital(
            rs.getString("id"),
            rs.getString("name"),
            rs.getString("address"),
            rs.getDouble("latitude"),
            rs.getDouble("longitude"),
            rs.getInt("total_beds"),
            rs.getInt("total_icu"),
            rs.getInt("emergency_doctors"),
            rs.getBoolean("has_emergency_unit")
        );
        h.setAvailableBeds(rs.getInt("available_beds"));
        h.setAvailableICU(rs.getInt("available_icu"));
        h.setAvailableDoctors(rs.getInt("available_doctors"));
        h.setAverageTreatmentTimeMinutes(rs.getDouble("avg_treatment_time"));
        return h;
    }
}
