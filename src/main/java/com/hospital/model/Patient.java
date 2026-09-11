package com.hospital.model;

import java.time.LocalDateTime;
import java.util.UUID;

public class Patient implements Comparable<Patient> {
    private final String id;
    private String name;
    private int age;
    private String contactNumber;
    private String symptoms;
    private Severity severity;
    private LocalDateTime registrationTime;
    private LocalDateTime treatmentStartTime;
    private String assignedHospital;
    private boolean treated;
    private int estimatedWaitTimeMinutes;
    private double aiPriorityScore;
    private PatientStatus status;
    private String assignedDoctorId;
    private String assignedDoctorName;
    private String preferredDoctorId;

    public enum PatientStatus {
        WAITING("Waiting in queue"),
        PENDING_BED("Waiting for bed availability"),
        IN_TREATMENT("Currently being treated"),
        TREATED("Treatment completed"),
        DISCHARGED("Discharged");

        private final String description;
        PatientStatus(String description) { this.description = description; }
        public String getDescription() { return description; }
    }

    public enum Severity {
        CRITICAL(5, "Critical - Life Threatening"),
        HIGH(4, "High - Severe Injury/Condition"),
        MODERATE(3, "Moderate - Urgent but Stable"),
        LOW(2, "Low - Minor Issue"),
        ROUTINE(1, "Routine - Checkup/Non-urgent");

        private final int priorityValue;
        private final String description;

        Severity(int priorityValue, String description) {
            this.priorityValue = priorityValue;
            this.description = description;
        }

        public int getPriorityValue() { return priorityValue; }
        public String getDescription() { return description; }
    }

    public Patient(String name, int age, String contactNumber, String symptoms, Severity severity) {
        this.id = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        this.name = name;
        this.age = age;
        this.contactNumber = contactNumber;
        this.symptoms = symptoms;
        this.severity = severity;
        this.registrationTime = LocalDateTime.now();
        this.treated = false;
        this.estimatedWaitTimeMinutes = 0;
        this.aiPriorityScore = 0.0;
        this.status = PatientStatus.WAITING;
    }

    /** Constructor for database restore (preserves existing ID) */
    public Patient(String id, String name, int age, String contactNumber, String symptoms, Severity severity) {
        this.id = id;
        this.name = name;
        this.age = age;
        this.contactNumber = contactNumber;
        this.symptoms = symptoms;
        this.severity = severity;
        this.registrationTime = LocalDateTime.now();
        this.treated = false;
        this.estimatedWaitTimeMinutes = 0;
        this.aiPriorityScore = 0.0;
        this.status = PatientStatus.WAITING;
    }

    @Override
    public int compareTo(Patient other) {
        int severityCompare = Integer.compare(other.severity.getPriorityValue(), this.severity.getPriorityValue());
        if (severityCompare != 0) return severityCompare;
        return this.registrationTime.compareTo(other.registrationTime);
    }

    // Getters and Setters
    public String getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }
    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }
    public String getSymptoms() { return symptoms; }
    public void setSymptoms(String symptoms) { this.symptoms = symptoms; }
    public Severity getSeverity() { return severity; }
    public void setSeverity(Severity severity) { this.severity = severity; }
    public LocalDateTime getRegistrationTime() { return registrationTime; }
    public void setRegistrationTime(LocalDateTime registrationTime) { this.registrationTime = registrationTime; }
    public LocalDateTime getTreatmentStartTime() { return treatmentStartTime; }
    public void setTreatmentStartTime(LocalDateTime treatmentStartTime) { this.treatmentStartTime = treatmentStartTime; }
    public String getAssignedHospital() { return assignedHospital; }
    public void setAssignedHospital(String assignedHospital) { this.assignedHospital = assignedHospital; }
    public boolean isTreated() { return treated; }
    public void setTreated(boolean treated) { this.treated = treated; }
    public int getEstimatedWaitTimeMinutes() { return estimatedWaitTimeMinutes; }
    public void setEstimatedWaitTimeMinutes(int estimatedWaitTimeMinutes) { this.estimatedWaitTimeMinutes = estimatedWaitTimeMinutes; }
    public double getAiPriorityScore() { return aiPriorityScore; }
    public void setAiPriorityScore(double aiPriorityScore) { this.aiPriorityScore = aiPriorityScore; }

    public PatientStatus getStatus() { return status; }
    public void setStatus(PatientStatus status) { this.status = status; }
    public String getAssignedDoctorId() { return assignedDoctorId; }
    public void setAssignedDoctorId(String assignedDoctorId) { this.assignedDoctorId = assignedDoctorId; }
    public String getAssignedDoctorName() { return assignedDoctorName; }
    public void setAssignedDoctorName(String assignedDoctorName) { this.assignedDoctorName = assignedDoctorName; }

    public String getPreferredDoctorId() { return preferredDoctorId; }
    public void setPreferredDoctorId(String preferredDoctorId) { this.preferredDoctorId = preferredDoctorId; }

    public long getWaitingTimeMinutes() {
        if (treatmentStartTime != null) {
            return java.time.Duration.between(registrationTime, treatmentStartTime).toMinutes();
        }
        return java.time.Duration.between(registrationTime, LocalDateTime.now()).toMinutes();
    }

    @Override
    public String toString() {
        return String.format("Patient[%s | %s | %s | %s | Wait: %d min]",
                id, name, severity.name(),
                treated ? "TREATED" : "WAITING",
                getWaitingTimeMinutes());
    }
}
