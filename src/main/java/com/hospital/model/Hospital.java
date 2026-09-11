package com.hospital.model;

import java.util.Objects;

public class Hospital {
    private final String id;
    private String name;
    private String address;
    private double latitude;
    private double longitude;
    private int totalBeds;
    private int availableBeds;
    private int totalICU;
    private int availableICU;
    private int emergencyDoctors;
    private int availableDoctors;
    private boolean hasEmergencyUnit;
    private double averageTreatmentTimeMinutes;

    public Hospital(String id, String name, String address, double latitude, double longitude,
                    int totalBeds, int totalICU, int emergencyDoctors, boolean hasEmergencyUnit) {
        this.id = id;
        this.name = name;
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude;
        this.totalBeds = totalBeds;
        this.availableBeds = totalBeds;
        this.totalICU = totalICU;
        this.availableICU = totalICU;
        this.emergencyDoctors = emergencyDoctors;
        this.availableDoctors = emergencyDoctors;
        this.hasEmergencyUnit = hasEmergencyUnit;
        this.averageTreatmentTimeMinutes = 45.0;
    }

    public double getLoadFactor() {
        if (totalBeds == 0) return 1.0;
        return (double) (totalBeds - availableBeds) / totalBeds;
    }

    public boolean canAcceptEmergency() {
        return hasEmergencyUnit && availableDoctors > 0 && (availableBeds > 0 || availableICU > 0);
    }

    public boolean canAcceptNormal() {
        return availableBeds > 0 && availableDoctors > 0;
    }

    public void allocateResources(Patient patient) {
        if (patient.getSeverity() == Patient.Severity.CRITICAL && availableICU > 0) {
            availableICU--;
        } else if (availableBeds > 0) {
            availableBeds--;
        }
        if (availableDoctors > 0) {
            availableDoctors--;
        }
    }

    public void releaseResources(Patient patient) {
        if (patient.getSeverity() == Patient.Severity.CRITICAL && availableICU < totalICU) {
            availableICU++;
        } else if (availableBeds < totalBeds) {
            availableBeds++;
        }
        if (availableDoctors < emergencyDoctors) {
            availableDoctors++;
        }
    }

    // Getters and Setters
    public String getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }
    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }
    public int getTotalBeds() { return totalBeds; }
    public int getAvailableBeds() { return availableBeds; }
    public int getTotalICU() { return totalICU; }
    public int getAvailableICU() { return availableICU; }
    public int getEmergencyDoctors() { return emergencyDoctors; }
    public int getAvailableDoctors() { return availableDoctors; }
    public boolean isHasEmergencyUnit() { return hasEmergencyUnit; }
    public double getAverageTreatmentTimeMinutes() { return averageTreatmentTimeMinutes; }
    public void setAverageTreatmentTimeMinutes(double averageTreatmentTimeMinutes) { this.averageTreatmentTimeMinutes = averageTreatmentTimeMinutes; }

    public void setAvailableBeds(int availableBeds) { this.availableBeds = availableBeds; }
    public void setAvailableICU(int availableICU) { this.availableICU = availableICU; }
    public void setAvailableDoctors(int availableDoctors) { this.availableDoctors = availableDoctors; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Hospital hospital = (Hospital) o;
        return Objects.equals(id, hospital.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return String.format("Hospital[%s | Beds: %d/%d | ICU: %d/%d | Doctors: %d/%d | Load: %.1f%%]",
                name, availableBeds, totalBeds, availableICU, totalICU, availableDoctors, emergencyDoctors,
                getLoadFactor() * 100);
    }
}
