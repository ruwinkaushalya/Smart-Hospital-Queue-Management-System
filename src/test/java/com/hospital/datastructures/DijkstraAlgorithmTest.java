package com.hospital.datastructures;

import com.hospital.TestRunner;
import com.hospital.model.Hospital;

import java.util.List;

public class DijkstraAlgorithmTest {

    public static void runTests() {
        TestRunner.runTest("findShortestPathBasic", DijkstraAlgorithmTest::findShortestPathBasic);
        TestRunner.runTest("findShortestPathDirectConnection", DijkstraAlgorithmTest::findShortestPathDirectConnection);
        TestRunner.runTest("noPathReturnsNull", DijkstraAlgorithmTest::noPathReturnsNull);
        TestRunner.runTest("findNearestHospitals", DijkstraAlgorithmTest::findNearestHospitals);
        TestRunner.runTest("pathResultProperties", DijkstraAlgorithmTest::pathResultProperties);
        TestRunner.runTest("multiHopPath", DijkstraAlgorithmTest::multiHopPath);
    }

    private static HospitalGraph createTestGraph() {
        HospitalGraph graph = new HospitalGraph();
        Hospital h1 = new Hospital("H1", "General", "Addr1", 1.0, 1.0, 100, 10, 5, true);
        Hospital h2 = new Hospital("H2", "Metro", "Addr2", 2.0, 2.0, 80, 8, 4, true);
        Hospital h3 = new Hospital("H3", "StMary", "Addr3", 3.0, 3.0, 60, 6, 3, true);
        Hospital h4 = new Hospital("H4", "Northside", "Addr4", 4.0, 4.0, 40, 4, 2, false);

        graph.addHospital(h1);
        graph.addHospital(h2);
        graph.addHospital(h3);
        graph.addHospital(h4);

        graph.addRoad("H1", "H2", 5.0);
        graph.addRoad("H1", "H3", 10.0);
        graph.addRoad("H2", "H3", 3.0);
        graph.addRoad("H3", "H4", 2.0);

        return graph;
    }

    private static void findShortestPathBasic() {
        HospitalGraph graph = createTestGraph();
        DijkstraAlgorithm.PathResult result = DijkstraAlgorithm.findShortestPath(graph, "H1", "H2");

        assert result != null : "Path should exist";
        assert result.getPath().size() == 2 : "Direct path should have 2 nodes";
        assert "H1".equals(result.getPath().get(0)) : "Path should start at H1";
        assert "H2".equals(result.getPath().get(1)) : "Path should end at H2";
        assert result.getTotalDistance() == 5.0 : "Distance should be 5.0 km";
    }

    private static void findShortestPathDirectConnection() {
        HospitalGraph graph = createTestGraph();
        DijkstraAlgorithm.PathResult result = DijkstraAlgorithm.findShortestPath(graph, "H1", "H3");

        assert result != null : "Path should exist";
        // H1 -> H2 -> H3 is shorter (5+3=8) than H1 -> H3 (10)
        assert result.getTotalDistance() == 8.0 : "Shortest path should be 8.0 km via H2";
        assert result.getPath().size() == 3 : "Should go through H2";
        assert "H2".equals(result.getPath().get(1)) : "Middle node should be H2";
    }

    private static void noPathReturnsNull() {
        HospitalGraph graph = new HospitalGraph();
        Hospital h1 = new Hospital("H1", "A", "Addr", 1.0, 1.0, 10, 1, 1, true);
        Hospital h2 = new Hospital("H2", "B", "Addr", 2.0, 2.0, 10, 1, 1, true);
        graph.addHospital(h1);
        graph.addHospital(h2);
        // No road added

        DijkstraAlgorithm.PathResult result = DijkstraAlgorithm.findShortestPath(graph, "H1", "H2");
        assert result == null : "Should return null when no path exists";
    }

    private static void findNearestHospitals() {
        HospitalGraph graph = createTestGraph();
        List<DijkstraAlgorithm.HospitalDistance> nearest = DijkstraAlgorithm.findNearestHospitals(graph, "H1", 2);

        assert nearest.size() == 2 : "Should return 2 nearest hospitals";
        assert "H2".equals(nearest.get(0).getHospital().getId()) : "H2 should be closest (5km)";
        assert nearest.get(0).getDistance() == 5.0 : "H2 distance should be 5.0";
    }

    private static void pathResultProperties() {
        HospitalGraph graph = createTestGraph();
        DijkstraAlgorithm.PathResult result = DijkstraAlgorithm.findShortestPath(graph, "H1", "H2");

        assert result != null;
        assert result.getTotalDistance() > 0 : "Distance should be positive";
        assert result.getEstimatedTimeMinutes() > 0 : "Time should be positive";
        double expectedTime = (5.0 / 40.0) * 60.0;
        assert result.getEstimatedTimeMinutes() == expectedTime : "Time should match graph estimate";
    }

    private static void multiHopPath() {
        HospitalGraph graph = createTestGraph();
        DijkstraAlgorithm.PathResult result = DijkstraAlgorithm.findShortestPath(graph, "H1", "H4");

        assert result != null : "Path should exist";
        // H1 -> H2 -> H3 -> H4 = 5 + 3 + 2 = 10
        assert result.getTotalDistance() == 10.0 : "Should be 10.0 km";
        assert result.getPath().size() == 4 : "Should have 4 nodes";
        assert "H4".equals(result.getPath().get(result.getPath().size() - 1)) : "Should end at H4";
    }
}
