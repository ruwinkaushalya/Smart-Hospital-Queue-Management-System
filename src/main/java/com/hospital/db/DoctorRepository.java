package com.hospital.db;

import com.hospital.model.Doctor;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class DoctorRepository {

    public void save(Doctor d) {
        String sql = "MERGE INTO doctors (id, name, specialty, phone, hospital_id, on_duty, current_patient_id, patients_today, max_patients_per_day) " +
                     "KEY (id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            setDoctorParams(ps, d);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to save doctor: " + e.getMessage(), e);
        }
    }

    public void update(Doctor d) {
        String sql = "UPDATE doctors SET name=?, specialty=?, phone=?, hospital_id=?, on_duty=?, current_patient_id=?, patients_today=?, max_patients_per_day=? WHERE id=?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, d.getName());
            ps.setString(2, d.getSpecialty());
            ps.setString(3, d.getPhone());
            ps.setString(4, d.getHospitalId());
            ps.setBoolean(5, d.isOnDuty());
            ps.setString(6, d.getCurrentPatientId());
            ps.setInt(7, d.getPatientsToday());
            ps.setInt(8, d.getMaxPatientsPerDay());
            ps.setString(9, d.getId());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to update doctor: " + e.getMessage(), e);
        }
    }

    public void deleteAll() {
        String sql = "DELETE FROM doctors";
        try (Connection conn = DatabaseManager.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.executeUpdate(sql);
        } catch (SQLException e) {
            throw new RuntimeException("Failed to delete doctors: " + e.getMessage(), e);
        }
    }

    public List<Doctor> findAll() {
        List<Doctor> list = new ArrayList<>();
        String sql = "SELECT * FROM doctors";
        try (Connection conn = DatabaseManager.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                list.add(mapRow(rs));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to load doctors: " + e.getMessage(), e);
        }
        return list;
    }

    public Doctor findById(String id) {
        String sql = "SELECT * FROM doctors WHERE id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                return mapRow(rs);
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to find doctor: " + e.getMessage(), e);
        }
        return null;
    }

    public List<Doctor> findByHospitalId(String hospitalId) {
        List<Doctor> list = new ArrayList<>();
        String sql = "SELECT * FROM doctors WHERE hospital_id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, hospitalId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                list.add(mapRow(rs));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to find doctors by hospital: " + e.getMessage(), e);
        }
        return list;
    }

    public List<Doctor> findAvailable() {
        List<Doctor> list = new ArrayList<>();
        String sql = "SELECT * FROM doctors WHERE on_duty = TRUE AND (current_patient_id IS NULL OR current_patient_id = '') AND patients_today < max_patients_per_day";
        try (Connection conn = DatabaseManager.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                list.add(mapRow(rs));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to find available doctors: " + e.getMessage(), e);
        }
        return list;
    }

    private void setDoctorParams(PreparedStatement ps, Doctor d) throws SQLException {
        ps.setString(1, d.getId());
        ps.setString(2, d.getName());
        ps.setString(3, d.getSpecialty());
        ps.setString(4, d.getPhone());
        ps.setString(5, d.getHospitalId());
        ps.setBoolean(6, d.isOnDuty());
        ps.setString(7, d.getCurrentPatientId());
        ps.setInt(8, d.getPatientsToday());
        ps.setInt(9, d.getMaxPatientsPerDay());
    }

    private Doctor mapRow(ResultSet rs) throws SQLException {
        Doctor d = new Doctor(
            rs.getString("id"),
            rs.getString("name"),
            rs.getString("specialty"),
            rs.getString("phone"),
            rs.getString("hospital_id"),
            rs.getBoolean("on_duty"),
            rs.getInt("max_patients_per_day")
        );
        d.setCurrentPatientId(rs.getString("current_patient_id"));
        d.setPatientsToday(rs.getInt("patients_today"));
        return d;
    }
}
