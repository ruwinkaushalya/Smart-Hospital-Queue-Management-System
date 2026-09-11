package com.hospital.db;

import com.hospital.model.Ambulance;
import com.hospital.model.Hospital;
import com.hospital.model.Patient;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class AmbulanceRepository {

    public void save(Ambulance a) {
        String sql = "MERGE INTO ambulances (id, driver_name, contact_number, latitude, longitude, status, assigned_patient_id, destination_hospital_id, dispatch_time, estimated_arrival_minutes, distance_km) " +
                     "KEY (id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            setAmbulanceParams(ps, a);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to save ambulance: " + e.getMessage(), e);
        }
    }

    public void updateStatus(Ambulance a) {
        String sql = "UPDATE ambulances SET status=?, assigned_patient_id=?, destination_hospital_id=?, dispatch_time=?, estimated_arrival_minutes=?, distance_km=?, latitude=?, longitude=? WHERE id=?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, a.getStatus().name());
            String assignedId = a.getAssignedPatient() != null ? a.getAssignedPatient().getId() : a.getAssignedPatientId();
            ps.setString(2, assignedId);
            String destId = a.getDestinationHospital() != null ? a.getDestinationHospital().getId() : a.getDestinationHospitalId();
            ps.setString(3, destId);
            if (a.getDispatchTime() != null) {
                ps.setTimestamp(4, Timestamp.valueOf(a.getDispatchTime()));
            } else {
                ps.setNull(4, Types.TIMESTAMP);
            }
            ps.setDouble(5, a.getEstimatedArrivalMinutes());
            ps.setDouble(6, a.getDistanceKm());
            ps.setDouble(7, a.getCurrentLatitude());
            ps.setDouble(8, a.getCurrentLongitude());
            ps.setString(9, a.getId());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to update ambulance status: " + e.getMessage(), e);
        }
    }

    public List<Ambulance> findAll() {
        List<Ambulance> list = new ArrayList<>();
        String sql = "SELECT * FROM ambulances";
        try (Connection conn = DatabaseManager.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                list.add(mapRow(rs));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to load ambulances: " + e.getMessage(), e);
        }
        return list;
    }

    private void setAmbulanceParams(PreparedStatement ps, Ambulance a) throws SQLException {
        ps.setString(1, a.getId());
        ps.setString(2, a.getDriverName());
        ps.setString(3, a.getContactNumber());
        ps.setDouble(4, a.getCurrentLatitude());
        ps.setDouble(5, a.getCurrentLongitude());
        ps.setString(6, a.getStatus().name());
        String assignedId = a.getAssignedPatient() != null ? a.getAssignedPatient().getId() : a.getAssignedPatientId();
        ps.setString(7, assignedId);
        String destId = a.getDestinationHospital() != null ? a.getDestinationHospital().getId() : a.getDestinationHospitalId();
        ps.setString(8, destId);
        if (a.getDispatchTime() != null) {
            ps.setTimestamp(9, Timestamp.valueOf(a.getDispatchTime()));
        } else {
            ps.setNull(9, Types.TIMESTAMP);
        }
        ps.setDouble(10, a.getEstimatedArrivalMinutes());
        ps.setDouble(11, a.getDistanceKm());
    }

    private Ambulance mapRow(ResultSet rs) throws SQLException {
        Ambulance a = new Ambulance(
            rs.getString("id"),
            rs.getString("driver_name"),
            rs.getString("contact_number"),
            rs.getDouble("latitude"),
            rs.getDouble("longitude")
        );
        Ambulance.Status status = Ambulance.Status.AVAILABLE;
        try {
            status = Ambulance.Status.valueOf(rs.getString("status"));
        } catch (IllegalArgumentException ignored) {}
        a.setStatus(status);
        a.setAssignedPatientId(rs.getString("assigned_patient_id"));
        a.setDestinationHospitalId(rs.getString("destination_hospital_id"));
        a.setEstimatedArrivalMinutes(rs.getDouble("estimated_arrival_minutes"));
        a.setDistanceKm(rs.getDouble("distance_km"));
        Timestamp dispatchTime = rs.getTimestamp("dispatch_time");
        if (dispatchTime != null) {
            a.setDispatchTime(dispatchTime.toLocalDateTime());
        }
        return a;
    }
}
