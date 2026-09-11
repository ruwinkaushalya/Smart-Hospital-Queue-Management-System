package com.hospital.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public class VisitRecord {
    private final String id;
    private String patientId;
    private String patientName;
    private LocalDate visitDate;
    private VisitType type;
    private String diagnosis;
    private String treatment;
    private String doctorName;
    private String hospitalName;
    private double medicationCost;
    private double procedureCost;
    private double bedCost;
    private double totalCost;
    private String notes;
    private LocalDateTime createdAt;

    public enum VisitType {
        EMERGENCY("Emergency Visit"),
        OUTPATIENT("Outpatient Visit"),
        INPATIENT("Inpatient Visit"),
        SURGERY("Surgery"),
        CONSULTATION("Consultation"),
        FOLLOW_UP("Follow-up"),
        CHECKUP("Routine Checkup");

        private final String label;
        VisitType(String label) { this.label = label; }
        public String getLabel() { return label; }
    }

    public VisitRecord(String patientId, String patientName, VisitType type,
                       String diagnosis, String treatment, String doctorName,
                       String hospitalName, double medicationCost, double procedureCost,
                       double bedCost, String notes) {
        this.id = "VIS-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        this.patientId = patientId;
        this.patientName = patientName;
        this.visitDate = LocalDate.now();
        this.type = type;
        this.diagnosis = diagnosis;
        this.treatment = treatment;
        this.doctorName = doctorName;
        this.hospitalName = hospitalName;
        this.medicationCost = medicationCost;
        this.procedureCost = procedureCost;
        this.bedCost = bedCost;
        this.totalCost = medicationCost + procedureCost + bedCost;
        this.notes = notes;
        this.createdAt = LocalDateTime.now();
    }

    public VisitRecord(String id, String patientId, String patientName, LocalDate visitDate,
                       VisitType type, String diagnosis, String treatment, String doctorName,
                       String hospitalName, double medicationCost, double procedureCost,
                       double bedCost, double totalCost, String notes, LocalDateTime createdAt) {
        this.id = id;
        this.patientId = patientId;
        this.patientName = patientName;
        this.visitDate = visitDate;
        this.type = type;
        this.diagnosis = diagnosis;
        this.treatment = treatment;
        this.doctorName = doctorName;
        this.hospitalName = hospitalName;
        this.medicationCost = medicationCost;
        this.procedureCost = procedureCost;
        this.bedCost = bedCost;
        this.totalCost = totalCost;
        this.notes = notes;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public String getId() { return id; }
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }
    public LocalDate getVisitDate() { return visitDate; }
    public void setVisitDate(LocalDate visitDate) { this.visitDate = visitDate; }
    public VisitType getType() { return type; }
    public void setType(VisitType type) { this.type = type; }
    public String getDiagnosis() { return diagnosis; }
    public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }
    public String getTreatment() { return treatment; }
    public void setTreatment(String treatment) { this.treatment = treatment; }
    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }
    public String getHospitalName() { return hospitalName; }
    public void setHospitalName(String hospitalName) { this.hospitalName = hospitalName; }
    public double getMedicationCost() { return medicationCost; }
    public void setMedicationCost(double medicationCost) { this.medicationCost = medicationCost; }
    public double getProcedureCost() { return procedureCost; }
    public void setProcedureCost(double procedureCost) { this.procedureCost = procedureCost; }
    public double getBedCost() { return bedCost; }
    public void setBedCost(double bedCost) { this.bedCost = bedCost; }
    public double getTotalCost() { return totalCost; }
    public void setTotalCost(double totalCost) { this.totalCost = totalCost; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    @Override
    public String toString() {
        return String.format("VisitRecord[%s | %s | %s | %s | $%.2f]",
                id, patientName, type.getLabel(), visitDate, totalCost);
    }
}
