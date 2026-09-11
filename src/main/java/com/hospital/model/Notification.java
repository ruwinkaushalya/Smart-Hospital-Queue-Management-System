package com.hospital.model;

import java.time.LocalDateTime;
import java.util.UUID;

public class Notification {
    private final String id;
    private String recipient;
    private RecipientType recipientType;
    private String message;
    private NotificationType type;
    private LocalDateTime timestamp;
    private Status status;

    public enum RecipientType {
        PATIENT, DOCTOR, STAFF, ADMIN
    }

    public enum NotificationType {
        SMS, WHATSAPP, EMAIL, IN_APP
    }

    public enum Status {
        PENDING, SENT, DELIVERED, FAILED
    }

    public Notification(String recipient, RecipientType recipientType, String message, NotificationType type) {
        this.id = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        this.recipient = recipient;
        this.recipientType = recipientType;
        this.message = message;
        this.type = type;
        this.timestamp = LocalDateTime.now();
        this.status = Status.PENDING;
    }

    public Notification(String id, String recipient, RecipientType recipientType, String message, NotificationType type, Status status, LocalDateTime timestamp) {
        this.id = id;
        this.recipient = recipient;
        this.recipientType = recipientType;
        this.message = message;
        this.type = type;
        this.status = status;
        this.timestamp = timestamp;
    }

    public void markSent() {
        this.status = Status.SENT;
    }

    public void markDelivered() {
        this.status = Status.DELIVERED;
    }

    public void markFailed() {
        this.status = Status.FAILED;
    }

    // Getters and Setters
    public String getId() { return id; }
    public String getRecipient() { return recipient; }
    public void setRecipient(String recipient) { this.recipient = recipient; }
    public RecipientType getRecipientType() { return recipientType; }
    public void setRecipientType(RecipientType recipientType) { this.recipientType = recipientType; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public NotificationType getType() { return type; }
    public void setType(NotificationType type) { this.type = type; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    @Override
    public String toString() {
        return String.format("Notification[%s | %s | %s | %s | %s]",
                id, recipientType.name(), type.name(), status.name(), recipient);
    }
}
