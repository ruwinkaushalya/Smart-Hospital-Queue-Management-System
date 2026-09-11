package com.hospital.model;

import java.time.LocalDateTime;
import java.util.UUID;

public class Invoice {
    private final String id;
    private String patientId;
    private String patientName;
    private String invoiceNumber;
    private InvoiceType type;
    private double baseAmount;
    private double discount;
    private double tax;
    private double totalAmount;
    private String description;
    private String hospitalName;
    private String doctorName;
    private InvoiceStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;

    public enum InvoiceType {
        CONSULTATION("Doctor Consultation"),
        EMERGENCY("Emergency Treatment"),
        SURGERY("Surgery"),
        MEDICATION("Medication"),
        BED_CHARGE("Bed/ICU Charge"),
        LAB_TEST("Laboratory Test"),
        AMBULANCE("Ambulance Service"),
        PACKAGE("Treatment Package");

        private final String label;
        InvoiceType(String label) { this.label = label; }
        public String getLabel() { return label; }
    }

    public enum InvoiceStatus {
        PENDING("Pending"),
        PAID("Paid"),
        OVERDUE("Overdue"),
        CANCELLED("Cancelled");

        private final String label;
        InvoiceStatus(String label) { this.label = label; }
        public String getLabel() { return label; }
    }

    public Invoice(String patientId, String patientName, InvoiceType type,
                     double baseAmount, String description, String hospitalName,
                     String doctorName) {
        this.id = "INV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        this.patientId = patientId;
        this.patientName = patientName;
        this.invoiceNumber = "INV-" + System.currentTimeMillis();
        this.type = type;
        this.baseAmount = baseAmount;
        this.discount = 0.0;
        this.tax = baseAmount * 0.08;
        this.totalAmount = baseAmount + this.tax - this.discount;
        this.description = description;
        this.hospitalName = hospitalName;
        this.doctorName = doctorName;
        this.status = InvoiceStatus.PENDING;
        this.createdAt = LocalDateTime.now();
    }

    public Invoice(String id, String patientId, String patientName, String invoiceNumber,
                   InvoiceType type, double baseAmount, double discount, double tax,
                   double totalAmount, String description, String hospitalName,
                   String doctorName, InvoiceStatus status, LocalDateTime createdAt,
                   LocalDateTime paidAt) {
        this.id = id;
        this.patientId = patientId;
        this.patientName = patientName;
        this.invoiceNumber = invoiceNumber;
        this.type = type;
        this.baseAmount = baseAmount;
        this.discount = discount;
        this.tax = tax;
        this.totalAmount = totalAmount;
        this.description = description;
        this.hospitalName = hospitalName;
        this.doctorName = doctorName;
        this.status = status;
        this.createdAt = createdAt;
        this.paidAt = paidAt;
    }

    public void applyDiscount(double percentage) {
        this.discount = this.baseAmount * (percentage / 100.0);
        recalculateTotal();
    }

    public void markPaid() {
        this.status = InvoiceStatus.PAID;
        this.paidAt = LocalDateTime.now();
    }

    public void markOverdue() {
        this.status = InvoiceStatus.OVERDUE;
    }

    public void cancel() {
        this.status = InvoiceStatus.CANCELLED;
    }

    private void recalculateTotal() {
        this.totalAmount = this.baseAmount + this.tax - this.discount;
    }

    // Getters and Setters
    public String getId() { return id; }
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }
    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }
    public InvoiceType getType() { return type; }
    public void setType(InvoiceType type) { this.type = type; }
    public double getBaseAmount() { return baseAmount; }
    public void setBaseAmount(double baseAmount) { this.baseAmount = baseAmount; recalculateTotal(); }
    public double getDiscount() { return discount; }
    public void setDiscount(double discount) { this.discount = discount; recalculateTotal(); }
    public double getTax() { return tax; }
    public void setTax(double tax) { this.tax = tax; recalculateTotal(); }
    public double getTotalAmount() { return totalAmount; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getHospitalName() { return hospitalName; }
    public void setHospitalName(String hospitalName) { this.hospitalName = hospitalName; }
    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }
    public InvoiceStatus getStatus() { return status; }
    public void setStatus(InvoiceStatus status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getPaidAt() { return paidAt; }
    public void setPaidAt(LocalDateTime paidAt) { this.paidAt = paidAt; }

    @Override
    public String toString() {
        return String.format("Invoice[%s | %s | %s | $%.2f | %s]",
                invoiceNumber, patientName, type.getLabel(), totalAmount, status.getLabel());
    }
}
