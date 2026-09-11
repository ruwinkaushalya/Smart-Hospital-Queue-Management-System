package com.hospital.datastructures;

import com.hospital.model.Patient;

import java.util.*;

public class PatientPriorityQueue {
    private final MinHeapPriorityQueue emergencyQueue;
    private final CircularQueue<Patient> normalQueue;
    private final Map<String, Patient> allPatients;
    private final List<Patient> treatedPatients;

    public PatientPriorityQueue() {
        this.emergencyQueue = new MinHeapPriorityQueue();
        this.normalQueue = new CircularQueue<>(512);
        this.allPatients = new HashMap<>();
        this.treatedPatients = new ArrayList<>();
    }

    public synchronized boolean addPatient(Patient patient) {
        if (patient == null || allPatients.containsKey(patient.getId())) {
            return false;
        }

        allPatients.put(patient.getId(), patient);

        if (patient.getSeverity().getPriorityValue() >= 4) {
            return emergencyQueue.add(patient);
        } else {
            return normalQueue.enqueue(patient);
        }
    }

    public synchronized Patient processNextPatient() {
        Patient next = null;

        if (!emergencyQueue.isEmpty()) {
            next = emergencyQueue.poll();
        } else if (!normalQueue.isEmpty()) {
            next = normalQueue.dequeue();
        }

        if (next != null) {
            next.setTreatmentStartTime(java.time.LocalDateTime.now());
            next.setTreated(true);
            treatedPatients.add(next);
        }

        return next;
    }

    public synchronized Patient peekNextPatient() {
        if (!emergencyQueue.isEmpty()) {
            return emergencyQueue.peek();
        } else if (!normalQueue.isEmpty()) {
            return normalQueue.peek();
        }
        return null;
    }

    public synchronized boolean removePatient(String patientId) {
        Patient patient = allPatients.get(patientId);
        if (patient == null) return false;

        boolean removed = false;
        if (patient.getSeverity().getPriorityValue() >= 4) {
            removed = emergencyQueue.remove(patient);
        } else {
            removed = normalQueue.remove(patient);
        }

        if (removed) {
            allPatients.remove(patientId);
        }
        return removed;
    }

    public synchronized List<Patient> getEmergencyQueue() {
        return emergencyQueue.toSortedList();
    }

    public synchronized List<Patient> getNormalQueue() {
        return normalQueue.toList();
    }

    public synchronized List<Patient> getAllWaitingPatients() {
        List<Patient> all = new ArrayList<>();
        all.addAll(getEmergencyQueue());
        all.addAll(getNormalQueue());
        return all;
    }

    public synchronized List<Patient> getTreatedPatients() {
        return new ArrayList<>(treatedPatients);
    }

    public synchronized Patient getPatient(String id) {
        return allPatients.get(id);
    }

    public synchronized int getEmergencyCount() {
        return emergencyQueue.size();
    }

    public synchronized int getNormalCount() {
        return normalQueue.size();
    }

    public synchronized int getTotalWaitingCount() {
        return emergencyQueue.size() + normalQueue.size();
    }

    public synchronized int getTreatedCount() {
        return treatedPatients.size();
    }

    public synchronized double getAverageWaitTime() {
        if (treatedPatients.isEmpty()) return 0.0;
        long totalWait = 0;
        for (Patient p : treatedPatients) {
            totalWait += p.getWaitingTimeMinutes();
        }
        return (double) totalWait / treatedPatients.size();
    }

    public synchronized void clear() {
        emergencyQueue.clear();
        normalQueue.clear();
        allPatients.clear();
        treatedPatients.clear();
    }
}
