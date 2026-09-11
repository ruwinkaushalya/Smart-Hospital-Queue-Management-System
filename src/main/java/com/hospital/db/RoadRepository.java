package com.hospital.db;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class RoadRepository {

    public void save(String fromId, String toId, double distanceKm) {
        String sql = "MERGE INTO roads (from_hospital_id, to_hospital_id, distance_km) " +
                     "KEY (from_hospital_id, to_hospital_id) VALUES (?, ?, ?)";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, fromId);
            ps.setString(2, toId);
            ps.setDouble(3, distanceKm);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to save road: " + e.getMessage(), e);
        }
    }

    public void deleteAll() {
        String sql = "DELETE FROM roads";
        try (Connection conn = DatabaseManager.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.executeUpdate(sql);
        } catch (SQLException e) {
            throw new RuntimeException("Failed to delete roads: " + e.getMessage(), e);
        }
    }

    public List<RoadRecord> findAll() {
        List<RoadRecord> list = new ArrayList<>();
        String sql = "SELECT * FROM roads";
        try (Connection conn = DatabaseManager.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                list.add(new RoadRecord(
                    rs.getString("from_hospital_id"),
                    rs.getString("to_hospital_id"),
                    rs.getDouble("distance_km")
                ));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to load roads: " + e.getMessage(), e);
        }
        return list;
    }

    public static class RoadRecord {
        public final String fromId;
        public final String toId;
        public final double distanceKm;

        public RoadRecord(String fromId, String toId, double distanceKm) {
            this.fromId = fromId;
            this.toId = toId;
            this.distanceKm = distanceKm;
        }
    }
}
