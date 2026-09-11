package com.hospital.ai;

import com.hospital.model.Hospital;
import com.hospital.model.Patient;
import com.hospital.datastructures.HospitalGraph;
import com.hospital.datastructures.DijkstraAlgorithm;

import java.time.LocalDateTime;
import java.util.*;

public class AIDecisionSupport {

    private static final double SEVERITY_WEIGHT = 0.40;
    private static final double WAIT_TIME_WEIGHT = 0.25;
    private static final double AGE_WEIGHT = 0.20;
    private static final double LOAD_WEIGHT = 0.15;

    public double calculatePriorityScore(Patient patient, int queuePosition, int totalQueueSize) {
        double severityScore = normalizeSeverity(patient.getSeverity().getPriorityValue());
        double waitTimeScore = Math.min(queuePosition / Math.max(totalQueueSize, 1.0), 1.0);
        double ageScore = normalizeAge(patient.getAge());
        double loadScore = 1.0 - (queuePosition / Math.max(totalQueueSize, 1.0));

        return (severityScore * SEVERITY_WEIGHT)
             + (waitTimeScore * WAIT_TIME_WEIGHT)
             + (ageScore * AGE_WEIGHT)
             + (loadScore * LOAD_WEIGHT);
    }

    public int predictWaitTimeMinutes(Patient patient, int patientsAhead, Hospital hospital) {
        double baseTimePerPatient = hospital != null ? hospital.getAverageTreatmentTimeMinutes() : 30.0;
        double severityMultiplier = 1.0;

        switch (patient.getSeverity()) {
            case CRITICAL: severityMultiplier = 0.1; break;
            case HIGH: severityMultiplier = 0.5; break;
            case MODERATE: severityMultiplier = 1.0; break;
            case LOW: severityMultiplier = 1.5; break;
            case ROUTINE: severityMultiplier = 2.0; break;
        }

        double estimatedWait = patientsAhead * baseTimePerPatient * severityMultiplier;

        if (hospital != null) {
            double loadFactor = hospital.getLoadFactor();
            estimatedWait *= (1.0 + loadFactor);
        }

        return (int) Math.max(estimatedWait, 1);
    }

    public HospitalRecommendation recommendHospital(Patient patient, HospitalGraph graph,
                                                     double ambulanceLat, double ambulanceLon,
                                                     List<Hospital> allHospitals) {
        List<HospitalScore> scores = new ArrayList<>();

        for (Hospital hospital : allHospitals) {
            if (!hospital.canAcceptEmergency() && patient.getSeverity().getPriorityValue() >= 4) {
                continue;
            }
            if (!hospital.canAcceptNormal() && patient.getSeverity().getPriorityValue() < 4) {
                continue;
            }

            double distance = haversineDistance(ambulanceLat, ambulanceLon,
                    hospital.getLatitude(), hospital.getLongitude());
            double estimatedTime = graph.estimateTravelTimeMinutes(distance);

            double capacityScore = 1.0 - hospital.getLoadFactor();
            double distanceScore = Math.max(0, 1.0 - (distance / 50.0));
            double icuScore = hospital.getTotalICU() > 0
                    ? (double) hospital.getAvailableICU() / hospital.getTotalICU()
                    : 0.5;

            double finalScore = (capacityScore * 0.35)
                           + (distanceScore * 0.40)
                           + (icuScore * 0.25);

            scores.add(new HospitalScore(hospital, distance, estimatedTime, finalScore));
        }

        scores.sort((a, b) -> Double.compare(b.score, a.score));
        return scores.isEmpty() ? null : new HospitalRecommendation(scores);
    }

    public String generateTreatmentSuggestion(Patient patient) {
        StringBuilder suggestion = new StringBuilder();
        suggestion.append("AI Analysis for ").append(patient.getName()).append(":\n");
        suggestion.append("Severity: ").append(patient.getSeverity().getDescription()).append("\n");
        suggestion.append("Symptoms: ").append(patient.getSymptoms()).append("\n\n");

        switch (patient.getSeverity()) {
            case CRITICAL:
                suggestion.append("ACTION: Immediate ICU/trauma bay assignment.\n");
                suggestion.append("Prep: Ventilator, cardiac monitors, blood transfusion ready.\n");
                break;
            case HIGH:
                suggestion.append("ACTION: Fast-track to emergency bay within 10 minutes.\n");
                suggestion.append("Prep: IV access, pain management, imaging orders.\n");
                break;
            case MODERATE:
                suggestion.append("ACTION: Standard emergency protocol.\n");
                suggestion.append("Prep: Basic vitals, blood tests, observation bed.\n");
                break;
            case LOW:
                suggestion.append("ACTION: Outpatient or minor injuries unit.\n");
                suggestion.append("Prep: Basic examination, possible discharge.\n");
                break;
            case ROUTINE:
                suggestion.append("ACTION: Schedule appointment or redirect to clinic.\n");
                break;
        }

        if (patient.getAge() > 65) {
            suggestion.append("NOTE: Elderly patient - monitor for complications.\n");
        }
        if (patient.getAge() < 12) {
            suggestion.append("NOTE: Pediatric patient - pediatric specialist recommended.\n");
        }

        return suggestion.toString();
    }

    public QueueAnalytics analyzeQueueState(List<Patient> waitingPatients, List<Patient> treatedPatients) {
        int totalWaiting = waitingPatients.size();
        int criticalCount = 0, highCount = 0, moderateCount = 0, lowCount = 0;
        double totalWaitTime = 0;
        double maxWaitTime = 0;

        for (Patient p : waitingPatients) {
            double waitTime = p.getWaitingTimeMinutes();
            totalWaitTime += waitTime;
            maxWaitTime = Math.max(maxWaitTime, waitTime);

            switch (p.getSeverity()) {
                case CRITICAL: criticalCount++; break;
                case HIGH: highCount++; break;
                case MODERATE: moderateCount++; break;
                case LOW: case ROUTINE: lowCount++; break;
            }
        }

        double avgWaitTime = totalWaiting > 0 ? totalWaitTime / totalWaiting : 0;
        double throughput = treatedPatients.size();
        double criticalRatio = totalWaiting > 0 ? (double) (criticalCount + highCount) / totalWaiting : 0;

        String status;
        if (criticalRatio > 0.5) {
            status = "CRITICAL OVERLOAD";
        } else if (avgWaitTime > 60) {
            status = "HIGH LOAD";
        } else if (avgWaitTime > 30) {
            status = "MODERATE LOAD";
        } else {
            status = "NORMAL";
        }

        return new QueueAnalytics(totalWaiting, criticalCount, highCount, moderateCount, lowCount,
                avgWaitTime, maxWaitTime, throughput, criticalRatio, status);
    }

    private double normalizeSeverity(int value) {
        return value / 5.0;
    }

    private double normalizeAge(int age) {
        if (age < 18) return 0.8;
        if (age < 40) return 0.4;
        if (age < 65) return 0.6;
        return 1.0;
    }

    private double haversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                 + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                 * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    public static class HospitalScore {
        public final Hospital hospital;
        public final double distance;
        public final double estimatedTime;
        public final double score;

        public HospitalScore(Hospital hospital, double distance, double estimatedTime, double score) {
            this.hospital = hospital;
            this.distance = distance;
            this.estimatedTime = estimatedTime;
            this.score = score;
        }
    }

    public static class HospitalRecommendation {
        private final List<HospitalScore> rankedHospitals;

        public HospitalRecommendation(List<HospitalScore> rankedHospitals) {
            this.rankedHospitals = rankedHospitals;
        }

        public List<HospitalScore> getRankedHospitals() { return rankedHospitals; }
        public HospitalScore getTopRecommendation() {
            return rankedHospitals.isEmpty() ? null : rankedHospitals.get(0);
        }
    }

    public static class QueueAnalytics {
        public final int totalWaiting;
        public final int criticalCount;
        public final int highCount;
        public final int moderateCount;
        public final int lowCount;
        public final double avgWaitTime;
        public final double maxWaitTime;
        public final double throughput;
        public final double criticalRatio;
        public final String status;

        public QueueAnalytics(int totalWaiting, int criticalCount, int highCount, int moderateCount,
                              int lowCount, double avgWaitTime, double maxWaitTime, double throughput,
                              double criticalRatio, String status) {
            this.totalWaiting = totalWaiting;
            this.criticalCount = criticalCount;
            this.highCount = highCount;
            this.moderateCount = moderateCount;
            this.lowCount = lowCount;
            this.avgWaitTime = avgWaitTime;
            this.maxWaitTime = maxWaitTime;
            this.throughput = throughput;
            this.criticalRatio = criticalRatio;
            this.status = status;
        }
    }
}
