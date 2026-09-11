package com.hospital.datastructures;

import com.hospital.model.Hospital;

import java.util.*;

/**
 * Kruskal's Minimum Spanning Tree Algorithm.
 * Finds the subset of roads that connects all hospitals with minimum total distance.
 *
 * Algorithm Steps:
 * 1. Sort all edges (roads) by weight (distance) in ascending order.
 * 2. Initialize a Union-Find (Disjoint Set Union) structure for all hospitals.
 * 3. Iterate through sorted edges. For each edge:
 *    a. If the two hospitals are in different sets, add the edge to the MST and union the sets.
 *    b. If they are in the same set, skip (would form a cycle).
 * 4. Stop when all hospitals are connected (V-1 edges) or all edges are processed.
 *
 * Time Complexity: O(E log E) for sorting, O(E α(V)) for Union-Find operations.
 * Space Complexity: O(V + E).
 */
public class KruskalMST {

    public static class RoadEdge {
        public final String fromId;
        public final String toId;
        public final double distance;
        public final String fromName;
        public final String toName;

        public RoadEdge(String fromId, String toId, double distance, String fromName, String toName) {
            this.fromId = fromId;
            this.toId = toId;
            this.distance = distance;
            this.fromName = fromName;
            this.toName = toName;
        }

        @Override
        public String toString() {
            return String.format("%s -> %s (%.1f km)", fromName, toName, distance);
        }
    }

    public static class MSTResult {
        private final List<RoadEdge> edges;
        private final double totalDistance;
        private final int comparisons;
        private final int unions;

        public MSTResult(List<RoadEdge> edges, double totalDistance, int comparisons, int unions) {
            this.edges = edges;
            this.totalDistance = totalDistance;
            this.comparisons = comparisons;
            this.unions = unions;
        }

        public List<RoadEdge> getEdges() { return edges; }
        public double getTotalDistance() { return totalDistance; }
        public int getComparisons() { return comparisons; }
        public int getUnions() { return unions; }
        public int getEdgeCount() { return edges.size(); }
        public boolean isConnected(int totalHospitals) {
            return edges.size() >= totalHospitals - 1;
        }
    }

    /**
     * Union-Find (Disjoint Set Union) with Path Compression and Union by Rank.
     */
    private static class UnionFind {
        private final Map<String, String> parent;
        private final Map<String, Integer> rank;
        private int sets;

        UnionFind(Collection<String> ids) {
            parent = new HashMap<>();
            rank = new HashMap<>();
            for (String id : ids) {
                parent.put(id, id);
                rank.put(id, 0);
            }
            sets = ids.size();
        }

        String find(String id) {
            if (!parent.get(id).equals(id)) {
                parent.put(id, find(parent.get(id))); // Path compression
            }
            return parent.get(id);
        }

        boolean union(String id1, String id2) {
            String root1 = find(id1);
            String root2 = find(id2);
            if (root1.equals(root2)) return false;

            // Union by rank
            if (rank.get(root1) < rank.get(root2)) {
                parent.put(root1, root2);
            } else if (rank.get(root1) > rank.get(root2)) {
                parent.put(root2, root1);
            } else {
                parent.put(root2, root1);
                rank.put(root1, rank.get(root1) + 1);
            }
            sets--;
            return true;
        }

        boolean isConnected() {
            return sets == 1;
        }
    }

    public static MSTResult findMST(HospitalGraph graph) {
        List<RoadEdge> allEdges = new ArrayList<>();
        Map<String, Hospital> hospitalMap = new HashMap<>();

        for (Hospital h : graph.getAllHospitals()) {
            hospitalMap.put(h.getId(), h);
        }

        // Build edge list from adjacency list
        for (Map.Entry<String, Map<String, Double>> entry : graph.getAdjacencyList().entrySet()) {
            String fromId = entry.getKey();
            Hospital from = hospitalMap.get(fromId);
            for (Map.Entry<String, Double> conn : entry.getValue().entrySet()) {
                String toId = conn.getKey();
                if (fromId.compareTo(toId) < 0) { // Avoid duplicates
                    Hospital to = hospitalMap.get(toId);
                    allEdges.add(new RoadEdge(
                        fromId, toId, conn.getValue(),
                        from != null ? from.getName() : fromId,
                        to != null ? to.getName() : toId
                    ));
                }
            }
        }

        // Step 1: Sort edges by distance (ascending)
        allEdges.sort(Comparator.comparingDouble(e -> e.distance));

        // Step 2: Initialize Union-Find
        UnionFind uf = new UnionFind(hospitalMap.keySet());

        // Step 3: Greedily add edges
        List<RoadEdge> mstEdges = new ArrayList<>();
        double totalDistance = 0.0;
        int comparisons = 0;
        int unions = 0;

        for (RoadEdge edge : allEdges) {
            comparisons++;
            if (uf.union(edge.fromId, edge.toId)) {
                mstEdges.add(edge);
                totalDistance += edge.distance;
                unions++;
                if (uf.isConnected()) break;
            }
        }

        return new MSTResult(mstEdges, totalDistance, comparisons, unions);
    }
}
