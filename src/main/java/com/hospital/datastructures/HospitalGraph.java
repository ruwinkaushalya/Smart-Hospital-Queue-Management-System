package com.hospital.datastructures;

import com.hospital.model.Hospital;

import java.util.*;

public class HospitalGraph {
    private final Map<String, Hospital> hospitals;
    private final Map<String, Map<String, Double>> adjacencyList;

    public HospitalGraph() {
        this.hospitals = new HashMap<>();
        this.adjacencyList = new HashMap<>();
    }

    public void addHospital(Hospital hospital) {
        hospitals.put(hospital.getId(), hospital);
        adjacencyList.putIfAbsent(hospital.getId(), new HashMap<>());
    }

    public void addRoad(String hospitalId1, String hospitalId2, double distanceKm) {
        if (!hospitals.containsKey(hospitalId1) || !hospitals.containsKey(hospitalId2)) {
            throw new IllegalArgumentException("Both hospitals must be added before connecting them");
        }
        adjacencyList.putIfAbsent(hospitalId1, new HashMap<>());
        adjacencyList.putIfAbsent(hospitalId2, new HashMap<>());
        adjacencyList.get(hospitalId1).put(hospitalId2, distanceKm);
        adjacencyList.get(hospitalId2).put(hospitalId1, distanceKm);
    }

    public void removeRoad(String hospitalId1, String hospitalId2) {
        if (adjacencyList.containsKey(hospitalId1)) {
            adjacencyList.get(hospitalId1).remove(hospitalId2);
        }
        if (adjacencyList.containsKey(hospitalId2)) {
            adjacencyList.get(hospitalId2).remove(hospitalId1);
        }
    }

    public List<Hospital> getNeighbors(String hospitalId) {
        List<Hospital> neighbors = new ArrayList<>();
        Map<String, Double> connections = adjacencyList.get(hospitalId);
        if (connections != null) {
            for (String neighborId : connections.keySet()) {
                neighbors.add(hospitals.get(neighborId));
            }
        }
        return neighbors;
    }

    public Double getDistance(String fromId, String toId) {
        Map<String, Double> connections = adjacencyList.get(fromId);
        if (connections != null) {
            return connections.get(toId);
        }
        return null;
    }

    public Collection<Hospital> getAllHospitals() {
        return hospitals.values();
    }

    public Hospital getHospital(String id) {
        return hospitals.get(id);
    }

    public int getHospitalCount() {
        return hospitals.size();
    }

    public int getRoadCount() {
        int count = 0;
        for (Map<String, Double> connections : adjacencyList.values()) {
            count += connections.size();
        }
        return count / 2;
    }

    public boolean hasHospital(String id) {
        return hospitals.containsKey(id);
    }

    public Map<String, Map<String, Double>> getAdjacencyList() {
        Map<String, Map<String, Double>> copy = new HashMap<>();
        for (Map.Entry<String, Map<String, Double>> entry : adjacencyList.entrySet()) {
            copy.put(entry.getKey(), new HashMap<>(entry.getValue()));
        }
        return copy;
    }

    public void removeHospital(String hospitalId) {
        hospitals.remove(hospitalId);
        adjacencyList.remove(hospitalId);
        for (Map<String, Double> connections : adjacencyList.values()) {
            connections.remove(hospitalId);
        }
    }

    public double estimateTravelTimeMinutes(double distanceKm) {
        double averageSpeedKmh = 40.0;
        return (distanceKm / averageSpeedKmh) * 60.0;
    }
}
