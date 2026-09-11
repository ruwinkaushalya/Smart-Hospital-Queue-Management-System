package com.hospital.model;

import java.time.LocalDateTime;
import java.util.UUID;

public class Ambulance {
    private final String id;
    private String driverName;
    private String contactNumber;
    private double currentLatitude;
    private double currentLongitude;
    private Status status;
    private Patient assignedPatient;
    private Hospital destinationHospital;
    private String assignedPatientId;
    private String destinationHospitalId;
    private LocalDateTime dispatchTime;
    private double estimatedArrivalMinutes;
    private double distanceKm;

    public enum Status {
        AVAILABLE("Available"),
        DISPATCHED("Dispatched"),
        EN_ROUTE("En Route"),
        AT_SCENE("At Scene"),
        TRANSPORTING("Transporting Patient"),
        AT_HOSPITAL("At Hospital"),
        RETURNING("Returning to Base");

        private final String label;

        Status(String label) { this.label = label; }
        public String getLabel() { return label; }
    }

    public Ambulance(String driverName, String contactNumber, double latitude, double longitude) {
        this.id = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        this.driverName = driverName;
        this.contactNumber = contactNumber;
        this.currentLatitude = latitude;
        this.currentLongitude = longitude;
        this.status = Status.AVAILABLE;
    }

    /** Constructor for database restore (preserves existing ID) */
    public Ambulance(String id, String driverName, String contactNumber, double latitude, double longitude) {
        this.id = id;
        this.driverName = driverName;
        this.contactNumber = contactNumber;
        this.currentLatitude = latitude;
        this.currentLongitude = longitude;
        this.status = Status.AVAILABLE;
    }

    // Getters and Setters
    public String getId() { return id; }
    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }
    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }
    public double getCurrentLatitude() { return currentLatitude; }
    public void setCurrentLatitude(double currentLatitude) { this.currentLatitude = currentLatitude; }
    public double getCurrentLongitude() { return currentLongitude; }
    public void setCurrentLongitude(double currentLongitude) { this.currentLongitude = currentLongitude; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public Patient getAssignedPatient() { return assignedPatient; }
    public void setAssignedPatient(Patient assignedPatient) { this.assignedPatient = assignedPatient; }
    public Hospital getDestinationHospital() { return destinationHospital; }
    public void setDestinationHospital(Hospital destinationHospital) { this.destinationHospital = destinationHospital; }
    public String getAssignedPatientId() { return assignedPatientId; }
    public void setAssignedPatientId(String assignedPatientId) { this.assignedPatientId = assignedPatientId; }
    public String getDestinationHospitalId() { return destinationHospitalId; }
    public void setDestinationHospitalId(String destinationHospitalId) { this.destinationHospitalId = destinationHospitalId; }
    public LocalDateTime getDispatchTime() { return dispatchTime; }
    public void setDispatchTime(LocalDateTime dispatchTime) { this.dispatchTime = dispatchTime; }
    public double getEstimatedArrivalMinutes() { return estimatedArrivalMinutes; }
    public void setEstimatedArrivalMinutes(double estimatedArrivalMinutes) { this.estimatedArrivalMinutes = estimatedArrivalMinutes; }
    public double getDistanceKm() { return distanceKm; }
    public void setDistanceKm(double distanceKm) { this.distanceKm = distanceKm; }

    public void dispatch(Patient patient, Hospital hospital, double distanceKm, double estimatedMinutes) {
        this.assignedPatient = patient;
        this.assignedPatientId = patient != null ? patient.getId() : null;
        this.destinationHospital = hospital;
        this.destinationHospitalId = hospital != null ? hospital.getId() : null;
        this.distanceKm = distanceKm;
        this.estimatedArrivalMinutes = estimatedMinutes;
        this.dispatchTime = LocalDateTime.now();
        this.status = Status.DISPATCHED;
    }

    public void reset() {
        this.assignedPatient = null;
        this.assignedPatientId = null;
        this.destinationHospital = null;
        this.destinationHospitalId = null;
        this.dispatchTime = null;
        this.estimatedArrivalMinutes = 0;
        this.distanceKm = 0;
        this.status = Status.AVAILABLE;
    }

    @Override
    public String toString() {
        return String.format("Ambulance[%s | %s | %s | %.1f km | %.0f min ETA]",
                id, driverName, status.getLabel(), distanceKm, estimatedArrivalMinutes);
    }
}
