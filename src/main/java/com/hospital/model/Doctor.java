package com.hospital.model;

import java.util.UUID;

public class Doctor {
    private final String id;
    private String name;
    private String specialty;
    private String phone;
    private String hospitalId;
    private boolean onDuty;
    private String currentPatientId;
    private int patientsToday;
    private int maxPatientsPerDay;

    public static final String[] SPECIALTIES = {
        "Emergency Medicine", "Cardiology", "Orthopedics", "Pediatrics",
        "General Surgery", "Neurology", "Oncology", "Radiology"
    };

    public Doctor(String name, String specialty, String phone, String hospitalId, int maxPatientsPerDay) {
        this.id = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        this.name = name;
        this.specialty = specialty;
        this.phone = phone;
        this.hospitalId = hospitalId;
        this.onDuty = true;
        this.currentPatientId = null;
        this.patientsToday = 0;
        this.maxPatientsPerDay = maxPatientsPerDay;
    }

    public Doctor(String id, String name, String specialty, String phone, String hospitalId, boolean onDuty, int maxPatientsPerDay) {
        this.id = id;
        this.name = name;
        this.specialty = specialty;
        this.phone = phone;
        this.hospitalId = hospitalId;
        this.onDuty = onDuty;
        this.currentPatientId = null;
        this.patientsToday = 0;
        this.maxPatientsPerDay = maxPatientsPerDay;
    }

    public boolean isAvailable() {
        return onDuty && (currentPatientId == null || currentPatientId.isEmpty()) && patientsToday < maxPatientsPerDay;
    }

    public void assignPatient(String patientId) {
        this.currentPatientId = patientId;
        this.patientsToday++;
    }

    public void releasePatient() {
        this.currentPatientId = null;
    }

    public void endShift() {
        this.onDuty = false;
        this.currentPatientId = null;
    }

    public void startShift() {
        this.onDuty = true;
        this.patientsToday = 0;
    }

    // Getters and Setters
    public String getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSpecialty() { return specialty; }
    public void setSpecialty(String specialty) { this.specialty = specialty; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getHospitalId() { return hospitalId; }
    public void setHospitalId(String hospitalId) { this.hospitalId = hospitalId; }
    public boolean isOnDuty() { return onDuty; }
    public void setOnDuty(boolean onDuty) { this.onDuty = onDuty; }
    public String getCurrentPatientId() { return currentPatientId; }
    public void setCurrentPatientId(String currentPatientId) { this.currentPatientId = currentPatientId; }
    public int getPatientsToday() { return patientsToday; }
    public void setPatientsToday(int patientsToday) { this.patientsToday = patientsToday; }
    public int getMaxPatientsPerDay() { return maxPatientsPerDay; }
    public void setMaxPatientsPerDay(int maxPatientsPerDay) { this.maxPatientsPerDay = maxPatientsPerDay; }

    @Override
    public String toString() {
        return String.format("Doctor[%s | %s | %s | %s | %s]",
                id, name, specialty, onDuty ? "ON DUTY" : "OFF DUTY",
                isAvailable() ? "AVAILABLE" : "BUSY");
    }
}
