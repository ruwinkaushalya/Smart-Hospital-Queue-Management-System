package com.hospital.datastructures;

import com.hospital.model.Hospital;

import java.util.*;

public class DijkstraAlgorithm {

    public static class PathResult {
        private final List<String> path;
        private final double totalDistance;
        private final double estimatedTimeMinutes;

        public PathResult(List<String> path, double totalDistance, double estimatedTimeMinutes) {
            this.path = path;
            this.totalDistance = totalDistance;
            this.estimatedTimeMinutes = estimatedTimeMinutes;
        }

        public List<String> getPath() { return path; }
        public double getTotalDistance() { return totalDistance; }
        public double getEstimatedTimeMinutes() { return estimatedTimeMinutes; }

        @Override
        public String toString() {
            return String.format("Path[%s | %.1f km | %.0f min]",
                    String.join(" -> ", path), totalDistance, estimatedTimeMinutes);
        }
    }

    public static PathResult findShortestPath(HospitalGraph graph, String startId, String endId) {
        Map<String, Double> distances = new HashMap<>();
        Map<String, String> previous = new HashMap<>();
        Set<String> visited = new HashSet<>();
        PriorityQueue<Node> pq = new PriorityQueue<>(Comparator.comparingDouble(n -> n.distance));

        for (String hospitalId : graph.getAdjacencyList().keySet()) {
            distances.put(hospitalId, Double.MAX_VALUE);
        }
        distances.put(startId, 0.0);
        pq.add(new Node(startId, 0.0));

        while (!pq.isEmpty()) {
            Node current = pq.poll();

            if (visited.contains(current.id)) continue;
            visited.add(current.id);

            if (current.id.equals(endId)) {
                break;
            }

            Map<String, Double> neighbors = graph.getAdjacencyList().get(current.id);
            if (neighbors == null) continue;

            for (Map.Entry<String, Double> neighbor : neighbors.entrySet()) {
                String neighborId = neighbor.getKey();
                double edgeWeight = neighbor.getValue();
                double newDistance = distances.get(current.id) + edgeWeight;

                if (newDistance < distances.get(neighborId)) {
                    distances.put(neighborId, newDistance);
                    previous.put(neighborId, current.id);
                    pq.add(new Node(neighborId, newDistance));
                }
            }
        }

        if (distances.get(endId) == Double.MAX_VALUE) {
            return null;
        }

        List<String> path = reconstructPath(previous, endId);
        double totalDistance = distances.get(endId);
        double estimatedTime = graph.estimateTravelTimeMinutes(totalDistance);

        return new PathResult(path, totalDistance, estimatedTime);
    }

    public static List<HospitalDistance> findNearestHospitals(HospitalGraph graph, String startId, int limit) {
        Map<String, Double> distances = new HashMap<>();
        Set<String> visited = new HashSet<>();
        PriorityQueue<Node> pq = new PriorityQueue<>(Comparator.comparingDouble(n -> n.distance));

        for (String hospitalId : graph.getAdjacencyList().keySet()) {
            distances.put(hospitalId, Double.MAX_VALUE);
        }
        distances.put(startId, 0.0);
        pq.add(new Node(startId, 0.0));

        while (!pq.isEmpty()) {
            Node current = pq.poll();
            if (visited.contains(current.id)) continue;
            visited.add(current.id);

            Map<String, Double> neighbors = graph.getAdjacencyList().get(current.id);
            if (neighbors == null) continue;

            for (Map.Entry<String, Double> neighbor : neighbors.entrySet()) {
                String neighborId = neighbor.getKey();
                double edgeWeight = neighbor.getValue();
                double newDistance = distances.get(current.id) + edgeWeight;

                if (newDistance < distances.get(neighborId)) {
                    distances.put(neighborId, newDistance);
                    pq.add(new Node(neighborId, newDistance));
                }
            }
        }

        List<HospitalDistance> result = new ArrayList<>();
        for (Map.Entry<String, Double> entry : distances.entrySet()) {
            if (!entry.getKey().equals(startId) && entry.getValue() != Double.MAX_VALUE) {
                Hospital hospital = graph.getHospital(entry.getKey());
                if (hospital != null) {
                    result.add(new HospitalDistance(hospital, entry.getValue(),
                            graph.estimateTravelTimeMinutes(entry.getValue())));
                }
            }
        }

        result.sort(Comparator.comparingDouble(HospitalDistance::getDistance));
        return result.subList(0, Math.min(limit, result.size()));
    }

    private static List<String> reconstructPath(Map<String, String> previous, String endId) {
        LinkedList<String> path = new LinkedList<>();
        String current = endId;
        while (current != null) {
            path.addFirst(current);
            current = previous.get(current);
        }
        return path;
    }

    private static class Node {
        String id;
        double distance;

        Node(String id, double distance) {
            this.id = id;
            this.distance = distance;
        }
    }

    public static class HospitalDistance {
        private final Hospital hospital;
        private final double distance;
        private final double estimatedTimeMinutes;

        public HospitalDistance(Hospital hospital, double distance, double estimatedTimeMinutes) {
            this.hospital = hospital;
            this.distance = distance;
            this.estimatedTimeMinutes = estimatedTimeMinutes;
        }

        public Hospital getHospital() { return hospital; }
        public double getDistance() { return distance; }
        public double getEstimatedTimeMinutes() { return estimatedTimeMinutes; }
    }
}
