package com.hospital.datastructures;

import com.hospital.TestRunner;
import com.hospital.model.Hospital;

import java.util.List;
import java.util.Map;

public class HospitalGraphTest {

    public static void runTests() {
        TestRunner.runTest("addHospitalAndRoad", HospitalGraphTest::addHospitalAndRoad);
        TestRunner.runTest("getDistance", HospitalGraphTest::getDistance);
        TestRunner.runTest("removeHospital", HospitalGraphTest::removeHospital);
        TestRunner.runTest("removeRoad", HospitalGraphTest::removeRoad);
        TestRunner.runTest("getNeighbors", HospitalGraphTest::getNeighbors);
        TestRunner.runTest("estimateTravelTime", HospitalGraphTest::estimateTravelTime);
        TestRunner.runTest("roadCount", HospitalGraphTest::roadCount);
        TestRunner.runTest("adjacencyListCopy", HospitalGraphTest::adjacencyListCopy);
        TestRunner.runTest("addRoadBeforeHospitalThrows", HospitalGraphTest::addRoadBeforeHospitalThrows);
    }

    private static Hospital createHospital(String id) {
        return new Hospital(id, "Hospital " + id, "Addr", 1.0, 1.0, 100, 10, 5, true);
    }

    private static void addHospitalAndRoad() {
        HospitalGraph graph = new HospitalGraph();
        graph.addHospital(createHospital("H1"));
        graph.addHospital(createHospital("H2"));
        graph.addRoad("H1", "H2", 5.0);

        assert graph.getHospitalCount() == 2 : "Should have 2 hospitals";
        assert graph.hasHospital("H1") : "Should have H1";
        assert graph.hasHospital("H2") : "Should have H2";
    }

    private static void getDistance() {
        HospitalGraph graph = new HospitalGraph();
        graph.addHospital(createHospital("H1"));
        graph.addHospital(createHospital("H2"));
        graph.addRoad("H1", "H2", 7.5);

        assert graph.getDistance("H1", "H2") == 7.5 : "Distance H1->H2 should be 7.5";
        assert graph.getDistance("H2", "H1") == 7.5 : "Distance H2->H1 should be 7.5";
        assert graph.getDistance("H1", "H3") == null : "Non-existent road should be null";
    }

    private static void removeHospital() {
        HospitalGraph graph = new HospitalGraph();
        graph.addHospital(createHospital("H1"));
        graph.addHospital(createHospital("H2"));
        graph.addRoad("H1", "H2", 5.0);

        graph.removeHospital("H1");
        assert !graph.hasHospital("H1") : "H1 should be removed";
        assert graph.getRoadCount() == 0 : "Roads connected to H1 should be removed";
    }

    private static void removeRoad() {
        HospitalGraph graph = new HospitalGraph();
        graph.addHospital(createHospital("H1"));
        graph.addHospital(createHospital("H2"));
        graph.addRoad("H1", "H2", 5.0);

        graph.removeRoad("H1", "H2");
        assert graph.getDistance("H1", "H2") == null : "Road should be removed";
    }

    private static void getNeighbors() {
        HospitalGraph graph = new HospitalGraph();
        graph.addHospital(createHospital("H1"));
        graph.addHospital(createHospital("H2"));
        graph.addHospital(createHospital("H3"));
        graph.addRoad("H1", "H2", 5.0);
        graph.addRoad("H1", "H3", 10.0);

        List<Hospital> neighbors = graph.getNeighbors("H1");
        assert neighbors.size() == 2 : "H1 should have 2 neighbors";
    }

    private static void estimateTravelTime() {
        HospitalGraph graph = new HospitalGraph();
        double time = graph.estimateTravelTimeMinutes(20.0);
        assert time == 30.0 : "20km at 40km/h = 30 minutes";
    }

    private static void roadCount() {
        HospitalGraph graph = new HospitalGraph();
        graph.addHospital(createHospital("H1"));
        graph.addHospital(createHospital("H2"));
        graph.addHospital(createHospital("H3"));
        graph.addRoad("H1", "H2", 5.0);
        graph.addRoad("H2", "H3", 3.0);

        assert graph.getRoadCount() == 2 : "Should have 2 roads";
    }

    private static void adjacencyListCopy() {
        HospitalGraph graph = new HospitalGraph();
        graph.addHospital(createHospital("H1"));
        graph.addHospital(createHospital("H2"));
        graph.addRoad("H1", "H2", 5.0);

        Map<String, Map<String, Double>> copy = graph.getAdjacencyList();
        assert copy.size() == 2 : "Copy should have 2 entries";
        assert copy.get("H1").get("H2") == 5.0 : "Copy should preserve distance";
    }

    private static void addRoadBeforeHospitalThrows() {
        HospitalGraph graph = new HospitalGraph();
        try {
            graph.addRoad("H1", "H2", 5.0);
            assert false : "Should throw IllegalArgumentException";
        } catch (IllegalArgumentException e) {
            assert e.getMessage().contains("Both hospitals must be added");
        }
    }
}
