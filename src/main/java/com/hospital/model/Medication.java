package com.hospital.model;

import java.time.LocalDate;
import java.util.UUID;

public class Medication implements Comparable<Medication> {
    private final String id;
    private String name;
    private String category;
    private String description;
    private int stock;
    private int reorderThreshold;
    private double pricePerUnit;
    private LocalDate expiryDate;
    private String supplier;
    private String dosage;
    private String unit;

    public Medication(String name, String category, String description, int stock,
                      int reorderThreshold, double pricePerUnit, LocalDate expiryDate,
                      String supplier, String dosage, String unit) {
        this.id = "MED-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        this.name = name;
        this.category = category;
        this.description = description;
        this.stock = stock;
        this.reorderThreshold = reorderThreshold;
        this.pricePerUnit = pricePerUnit;
        this.expiryDate = expiryDate;
        this.supplier = supplier;
        this.dosage = dosage;
        this.unit = unit;
    }

    public Medication(String id, String name, String category, String description, int stock,
                      int reorderThreshold, double pricePerUnit, LocalDate expiryDate,
                      String supplier, String dosage, String unit) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.description = description;
        this.stock = stock;
        this.reorderThreshold = reorderThreshold;
        this.pricePerUnit = pricePerUnit;
        this.expiryDate = expiryDate;
        this.supplier = supplier;
        this.dosage = dosage;
        this.unit = unit;
    }

    public boolean isExpired() {
        return expiryDate != null && expiryDate.isBefore(LocalDate.now());
    }

    public boolean isLowStock() {
        return stock <= reorderThreshold;
    }

    public double getInventoryValue() {
        return stock * pricePerUnit;
    }

    @Override
    public int compareTo(Medication other) {
        return this.id.compareTo(other.id);
    }

    // Getters and Setters
    public String getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public int getStock() { return stock; }
    public void setStock(int stock) { this.stock = stock; }
    public int getReorderThreshold() { return reorderThreshold; }
    public void setReorderThreshold(int reorderThreshold) { this.reorderThreshold = reorderThreshold; }
    public double getPricePerUnit() { return pricePerUnit; }
    public void setPricePerUnit(double pricePerUnit) { this.pricePerUnit = pricePerUnit; }
    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }
    public String getSupplier() { return supplier; }
    public void setSupplier(String supplier) { this.supplier = supplier; }
    public String getDosage() { return dosage; }
    public void setDosage(String dosage) { this.dosage = dosage; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    @Override
    public String toString() {
        return String.format("Medication[%s | %s | %s | Stock: %d | $%.2f | %s]",
                id, name, category, stock, pricePerUnit,
                isExpired() ? "EXPIRED" : (isLowStock() ? "LOW STOCK" : "OK"));
    }
}
