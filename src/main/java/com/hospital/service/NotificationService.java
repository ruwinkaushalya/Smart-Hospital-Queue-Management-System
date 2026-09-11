package com.hospital.service;

import com.hospital.model.Notification;
import com.hospital.model.Patient;

import java.util.ArrayList;
import java.util.List;

public class NotificationService {
    private final List<Notification> notifications;
    private int smsCount = 0;
    private int whatsappCount = 0;

    public NotificationService() {
        this.notifications = new ArrayList<>();
    }

    public Notification sendMockSMS(String recipient, String message, Notification.RecipientType type) {
        Notification n = new Notification(recipient, type, message, Notification.NotificationType.SMS);
        // Simulate sending delay
        try {
            Thread.sleep(50);
        } catch (InterruptedException ignored) {}
        n.markSent();
        smsCount++;
        notifications.add(0, n);
        System.out.println("[MOCK SMS] To: " + recipient + " | Message: " + message);
        return n;
    }

    public Notification sendMockWhatsApp(String recipient, String message, Notification.RecipientType type) {
        Notification n = new Notification(recipient, type, message, Notification.NotificationType.WHATSAPP);
        try {
            Thread.sleep(50);
        } catch (InterruptedException ignored) {}
        n.markSent();
        whatsappCount++;
        notifications.add(0, n);
        System.out.println("[MOCK WhatsApp] To: " + recipient + " | Message: " + message);
        return n;
    }

    public void markNotificationRead(String notificationId) {
        for (Notification n : notifications) {
            if (n.getId().equals(notificationId)) {
                n.markDelivered();
                return;
            }
        }
    }

    public void markAllRead() {
        for (Notification n : notifications) {
            n.markDelivered();
        }
    }

    public Notification notifyPatientTurnNear(Patient patient, int position) {
        String message = "Smart Hospital: Hi " + patient.getName() + ", you are now " + position +
                (position == 1 ? "st" : position == 2 ? "nd" : position == 3 ? "rd" : "th") +
                " in line. Please proceed to the waiting area.";
        return sendMockSMS(patient.getContactNumber(), message, Notification.RecipientType.PATIENT);
    }

    public Notification notifyCriticalPatientQueued(Patient patient) {
        String message = "URGENT: CRITICAL patient " + patient.getName() + " (" + patient.getSeverity().name() +
                ") has been queued. Symptoms: " + patient.getSymptoms() + ". Please prepare immediately.";
        return sendMockWhatsApp("077-ADMIN-01", message, Notification.RecipientType.DOCTOR);
    }

    public Notification notifyBedAvailable(Patient patient, String hospitalName) {
        String message = "Smart Hospital: Hi " + patient.getName() + ", a bed is now available at " +
                hospitalName + ". Please proceed to admission.";
        return sendMockSMS(patient.getContactNumber(), message, Notification.RecipientType.PATIENT);
    }

    public Notification notifyDoctorAssigned(Patient patient, String doctorName, String specialty) {
        String message = "Smart Hospital: Hi " + patient.getName() + ", you have been assigned to Dr. " +
                doctorName + " (" + specialty + "). Please proceed to the treatment room.";
        return sendMockSMS(patient.getContactNumber(), message, Notification.RecipientType.PATIENT);
    }

    public Notification notifyBedPending(Patient patient) {
        String message = "Smart Hospital: Hi " + patient.getName() + ", you are in the bed waiting list. " +
                "We will notify you as soon as a bed becomes available.";
        return sendMockSMS(patient.getContactNumber(), message, Notification.RecipientType.PATIENT);
    }

    public List<Notification> getAllNotifications() {
        return new ArrayList<>(notifications);
    }

    public List<Notification> getNotificationsByType(Notification.RecipientType type) {
        List<Notification> result = new ArrayList<>();
        for (Notification n : notifications) {
            if (n.getRecipientType() == type) {
                result.add(n);
            }
        }
        return result;
    }

    public int getUnreadCount() {
        int count = 0;
        for (Notification n : notifications) {
            if (n.getStatus() == Notification.Status.SENT) {
                count++;
            }
        }
        return count;
    }

    public int getTotalSent() {
        return smsCount + whatsappCount;
    }

    public void clear() {
        notifications.clear();
        smsCount = 0;
        whatsappCount = 0;
    }
}
