package com.hospital.model;

import java.time.LocalDateTime;
import java.util.UUID;

public class Report {
    private final String id;
    private String patientId;
    private String patientName;
    private String fileName;
    private String mimeType;
    private long fileSize;
    private String base64Content;
    private String description;
    private String doctorName;
    private String status;
    private LocalDateTime uploadedAt;

    public Report(String patientId, String patientName, String fileName, String mimeType,
                  long fileSize, String base64Content, String description) {
        this.id = "RPT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        this.patientId = patientId;
        this.patientName = patientName;
        this.fileName = fileName;
        this.mimeType = mimeType;
        this.fileSize = fileSize;
        this.base64Content = base64Content;
        this.description = description;
        this.status = "PENDING";
        this.uploadedAt = LocalDateTime.now();
    }

    public Report(String id, String patientId, String patientName, String fileName,
                  String mimeType, long fileSize, String base64Content, String description,
                  String doctorName, String status, LocalDateTime uploadedAt) {
        this.id = id;
        this.patientId = patientId;
        this.patientName = patientName;
        this.fileName = fileName;
        this.mimeType = mimeType;
        this.fileSize = fileSize;
        this.base64Content = base64Content;
        this.description = description;
        this.doctorName = doctorName;
        this.status = status;
        this.uploadedAt = uploadedAt;
    }

    public String getFormattedSize() {
        if (fileSize < 1024) return fileSize + " B";
        if (fileSize < 1024 * 1024) return String.format("%.1f KB", fileSize / 1024.0);
        return String.format("%.1f MB", fileSize / (1024.0 * 1024.0));
    }

    public String getFileExtension() {
        if (fileName == null || !fileName.contains(".")) return "";
        return fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
    }

    // Getters and Setters
    public String getId() { return id; }
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public String getMimeType() { return mimeType; }
    public void setMimeType(String mimeType) { this.mimeType = mimeType; }
    public long getFileSize() { return fileSize; }
    public void setFileSize(long fileSize) { this.fileSize = fileSize; }
    public String getBase64Content() { return base64Content; }
    public void setBase64Content(String base64Content) { this.base64Content = base64Content; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(LocalDateTime uploadedAt) { this.uploadedAt = uploadedAt; }

    @Override
    public String toString() {
        return String.format("Report[%s | %s | %s | %s | %s]",
                id, patientName, fileName, getFormattedSize(), status);
    }
}
