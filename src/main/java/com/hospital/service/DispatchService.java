package com.hospital.service;

import com.hospital.ai.AIDecisionSupport;
import com.hospital.datastructures.DijkstraAlgorithm;
import com.hospital.datastructures.HospitalGraph;
import com.hospital.db.AmbulanceRepository;
import com.hospital.db.HospitalRepository;
import com.hospital.db.RoadRepository;
import com.hospital.model.Ambulance;
import com.hospital.model.Hospital;
import com.hospital.model.Patient;

import java.time.LocalDateTime;
import java.util.*;

public class DispatchService {
    private final HospitalGraph hospitalGraph;
    private final List<Ambulance> ambulances;
    private final List<DispatchListener> listeners;
    private final AIDecisionSupport aiSupport;
    private final HospitalRepository hospitalRepo;
    private final AmbulanceRepository ambulanceRepo;
    private final RoadRepository roadRepo;

    public DispatchService() {
        this.hospitalGraph = new HospitalGraph();
        this.ambulances = new ArrayList<>();
        this.listeners = new ArrayList<>();
        this.aiSupport = new AIDecisionSupport();
        this.hospitalRepo = new HospitalRepository();
        this.ambulanceRepo = new AmbulanceRepository();
        this.roadRepo = new RoadRepository();
    }

    public void addListener(DispatchListener listener) {
        listeners.add(listener);
    }

    private void notifyListeners() {
        for (DispatchListener listener : listeners) {
            listener.onDispatchChanged();
        }
    }

    public void addHospital(Hospital hospital) {
        hospitalGraph.addHospital(hospital);
        hospitalRepo.save(hospital);
        notifyListeners();
    }

    public void addRoad(String id1, String id2, double distanceKm) {
        hospitalGraph.addRoad(id1, id2, distanceKm);
        roadRepo.save(id1, id2, distanceKm);
        notifyListeners();
    }

    public void addAmbulance(Ambulance ambulance) {
        ambulances.add(ambulance);
        ambulanceRepo.save(ambulance);
        notifyListeners();
    }

    public DispatchResult dispatchAmbulance(Patient patient, double ambulanceLat, double ambulanceLon) {
        Ambulance available = findAvailableAmbulance();
        if (available == null) {
            return new DispatchResult(false, "No ambulances available", null, null, 0, 0);
        }

        AIDecisionSupport.HospitalRecommendation recommendation =
                aiSupport.recommendHospital(patient, hospitalGraph, ambulanceLat, ambulanceLon,
                        new ArrayList<>(hospitalGraph.getAllHospitals()));

        if (recommendation == null || recommendation.getTopRecommendation() == null) {
            return new DispatchResult(false, "No suitable hospital found", null, null, 0, 0);
        }

        AIDecisionSupport.HospitalScore topScore = recommendation.getTopRecommendation();
        Hospital destination = topScore.hospital;

        DijkstraAlgorithm.PathResult path = null;
        Hospital nearestStart = findNearestHospitalToAmbulance(available);
        if (nearestStart != null) {
            path = DijkstraAlgorithm.findShortestPath(hospitalGraph, nearestStart.getId(), destination.getId());
        }

        double distance = path != null ? path.getTotalDistance() : topScore.distance;
        double time = path != null ? path.getEstimatedTimeMinutes() : topScore.estimatedTime;

        available.dispatch(patient, destination, distance, time);
        try {
            ambulanceRepo.updateStatus(available);
        } catch (Exception e) {
            available.reset();
            return new DispatchResult(false, "Failed to persist dispatch: " + e.getMessage(), null, null, 0, 0);
        }

        notifyListeners();

        return new DispatchResult(true, "Dispatch successful",
                available, destination, distance, time);
    }

    public void completeDispatch(String ambulanceId) {
        for (Ambulance a : ambulances) {
            if (a.getId().equals(ambulanceId)) {
                Ambulance.Status oldStatus = a.getStatus();
                Patient oldPatient = a.getAssignedPatient();
                Hospital oldDest = a.getDestinationHospital();
                String oldPatientId = a.getAssignedPatientId();
                String oldDestId = a.getDestinationHospitalId();
                double oldDistance = a.getDistanceKm();
                double oldTime = a.getEstimatedArrivalMinutes();
                LocalDateTime oldDispatchTime = a.getDispatchTime();
                a.reset();
                try {
                    ambulanceRepo.updateStatus(a);
                } catch (Exception e) {
                    a.setStatus(oldStatus);
                    a.setAssignedPatient(oldPatient);
                    a.setDestinationHospital(oldDest);
                    a.setAssignedPatientId(oldPatientId);
                    a.setDestinationHospitalId(oldDestId);
                    a.setDistanceKm(oldDistance);
                    a.setEstimatedArrivalMinutes(oldTime);
                    a.setDispatchTime(oldDispatchTime);
                    throw new RuntimeException("Failed to persist dispatch completion", e);
                }
                notifyListeners();
                break;
            }
        }
    }

    public DispatchResult dispatchEmergency(String hospitalId) {
        Ambulance available = findAvailableAmbulance();
        if (available == null) {
            return new DispatchResult(false, "No ambulances available", null, null, 0, 0);
        }
        Hospital destination = null;
        for (Hospital h : hospitalGraph.getAllHospitals()) {
            if (h.getId().equals(hospitalId)) {
                destination = h;
                break;
            }
        }
        if (destination == null) {
            return new DispatchResult(false, "Hospital not found", null, null, 0, 0);
        }
        double distance = haversine(available.getCurrentLatitude(), available.getCurrentLongitude(),
                destination.getLatitude(), destination.getLongitude());
        double time = (distance / 40.0) * 60.0;
        Patient dummy = new Patient("Emergency Call", 0, "000", "Emergency dispatch", Patient.Severity.CRITICAL);
        available.dispatch(dummy, destination, distance, time);
        try {
            ambulanceRepo.updateStatus(available);
        } catch (Exception e) {
            available.reset();
            return new DispatchResult(false, "Failed to persist dispatch: " + e.getMessage(), null, null, 0, 0);
        }
        notifyListeners();
        return new DispatchResult(true, "Emergency dispatch initiated", available, destination, distance, time);
    }

    public DispatchResult dispatchTransport(String hospitalId) {
        Ambulance available = findAvailableAmbulance();
        if (available == null) {
            return new DispatchResult(false, "No ambulances available", null, null, 0, 0);
        }
        Hospital destination = null;
        for (Hospital h : hospitalGraph.getAllHospitals()) {
            if (h.getId().equals(hospitalId)) {
                destination = h;
                break;
            }
        }
        if (destination == null) {
            return new DispatchResult(false, "Hospital not found", null, null, 0, 0);
        }
        double distance = haversine(available.getCurrentLatitude(), available.getCurrentLongitude(),
                destination.getLatitude(), destination.getLongitude());
        double time = (distance / 40.0) * 60.0;
        Ambulance.Status oldStatus = available.getStatus();
        Patient oldPatient = available.getAssignedPatient();
        Hospital oldDest = available.getDestinationHospital();
        String oldPatientId = available.getAssignedPatientId();
        String oldDestId = available.getDestinationHospitalId();
        double oldDistance = available.getDistanceKm();
        double oldTime = available.getEstimatedArrivalMinutes();
        LocalDateTime oldDispatchTime = available.getDispatchTime();
        available.setStatus(Ambulance.Status.TRANSPORTING);
        available.setDestinationHospital(destination);
        available.setDestinationHospitalId(destination.getId());
        available.setDistanceKm(distance);
        available.setEstimatedArrivalMinutes(time);
        try {
            ambulanceRepo.updateStatus(available);
        } catch (Exception e) {
            available.setStatus(oldStatus);
            available.setAssignedPatient(oldPatient);
            available.setDestinationHospital(oldDest);
            available.setAssignedPatientId(oldPatientId);
            available.setDestinationHospitalId(oldDestId);
            available.setDistanceKm(oldDistance);
            available.setEstimatedArrivalMinutes(oldTime);
            available.setDispatchTime(oldDispatchTime);
            return new DispatchResult(false, "Failed to persist dispatch: " + e.getMessage(), null, null, 0, 0);
        }
        notifyListeners();
        return new DispatchResult(true, "Transport dispatch initiated", available, destination, distance, time);
    }

    private Ambulance findAvailableAmbulance() {
        for (Ambulance a : ambulances) {
            if (a.getStatus() == Ambulance.Status.AVAILABLE) {
                return a;
            }
        }
        return null;
    }

    private Hospital findNearestHospitalToAmbulance(Ambulance ambulance) {
        Hospital nearest = null;
        double minDist = Double.MAX_VALUE;
        for (Hospital h : hospitalGraph.getAllHospitals()) {
            double dist = haversine(ambulance.getCurrentLatitude(), ambulance.getCurrentLongitude(),
                    h.getLatitude(), h.getLongitude());
            if (dist < minDist) {
                minDist = dist;
                nearest = h;
            }
        }
        return nearest;
    }

    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                 + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                 * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    public List<Ambulance> getAllAmbulances() {
        return new ArrayList<>(ambulances);
    }

    public List<Ambulance> getAvailableAmbulances() {
        List<Ambulance> available = new ArrayList<>();
        for (Ambulance a : ambulances) {
            if (a.getStatus() == Ambulance.Status.AVAILABLE) {
                available.add(a);
            }
        }
        return available;
    }

    public List<Ambulance> getActiveAmbulances() {
        List<Ambulance> active = new ArrayList<>();
        for (Ambulance a : ambulances) {
            if (a.getStatus() != Ambulance.Status.AVAILABLE) {
                active.add(a);
            }
        }
        return active;
    }

    public HospitalGraph getHospitalGraph() {
        return hospitalGraph;
    }

    /** Resolve ambulance patient/hospital references after loading from database */
    public void resolveAmbulanceRelationships(List<Patient> patients) {
        List<Hospital> hospitals = new ArrayList<>(hospitalGraph.getAllHospitals());
        for (Ambulance a : ambulances) {
            if (a.getAssignedPatientId() != null) {
                for (Patient p : patients) {
                    if (p.getId().equals(a.getAssignedPatientId())) {
                        a.setAssignedPatient(p);
                        break;
                    }
                }
            }
            if (a.getDestinationHospitalId() != null) {
                for (Hospital h : hospitals) {
                    if (h.getId().equals(a.getDestinationHospitalId())) {
                        a.setDestinationHospital(h);
                        break;
                    }
                }
            }
        }
    }

    public AIDecisionSupport.HospitalRecommendation getRecommendations(Patient patient,
                                                                        double ambulanceLat, double ambulanceLon) {
        return aiSupport.recommendHospital(patient, hospitalGraph, ambulanceLat, ambulanceLon,
                new ArrayList<>(hospitalGraph.getAllHospitals()));
    }

    public interface DispatchListener {
        void onDispatchChanged();
    }

    public static class DispatchResult {
        public final boolean success;
        public final String message;
        public final Ambulance ambulance;
        public final Hospital hospital;
        public final double distanceKm;
        public final double estimatedTimeMinutes;

        public DispatchResult(boolean success, String message, Ambulance ambulance,
                              Hospital hospital, double distanceKm, double estimatedTimeMinutes) {
            this.success = success;
            this.message = message;
            this.ambulance = ambulance;
            this.hospital = hospital;
            this.distanceKm = distanceKm;
            this.estimatedTimeMinutes = estimatedTimeMinutes;
        }
    }
}
