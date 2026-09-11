package com.hospital.datastructures;

import com.hospital.TestRunner;
import com.hospital.model.Hospital;

public class KruskalMSTTest {
    public static void runTests() {
        TestRunner.runTest("basicMST", KruskalMSTTest::basicMST);
        TestRunner.runTest("mstConnectsAllHospitals", KruskalMSTTest::mstConnectsAllHospitals);
        TestRunner.runTest("mstMinimizesTotalDistance", KruskalMSTTest::mstMinimizesTotalDistance);
        TestRunner.runTest("mstAvoidsCycles", KruskalMSTTest::mstAvoidsCycles);
        TestRunner.runTest("singleHospital", KruskalMSTTest::singleHospital);
        TestRunner.runTest("twoHospitals", KruskalMSTTest::twoHospitals);
    }

    private static HospitalGraph createTriangleGraph() {
        HospitalGraph graph = new HospitalGraph();
        Hospital h1 = new Hospital("H1", "Hospital A", "Addr1", 0, 0, 100, 10, 5, true);
        Hospital h2 = new Hospital("H2", "Hospital B", "Addr2", 1, 1, 80, 8, 4, true);
        Hospital h3 = new Hospital("H3", "Hospital C", "Addr3", 2, 2, 60, 6, 3, false);
        graph.addHospital(h1);
        graph.addHospital(h2);
        graph.addHospital(h3);
        graph.addRoad("H1", "H2", 5.0);
        graph.addRoad("H2", "H3", 3.0);
        graph.addRoad("H1", "H3", 10.0);
        return graph;
    }

    private static boolean basicMST() {
        HospitalGraph graph = createTriangleGraph();
        KruskalMST.MSTResult result = KruskalMST.findMST(graph);
        return result.getEdges().size() == 2 && result.getTotalDistance() == 8.0;
    }

    private static boolean mstConnectsAllHospitals() {
        HospitalGraph graph = createTriangleGraph();
        KruskalMST.MSTResult result = KruskalMST.findMST(graph);
        return result.isConnected(3);
    }

    private static boolean mstMinimizesTotalDistance() {
        HospitalGraph graph = createTriangleGraph();
        KruskalMST.MSTResult result = KruskalMST.findMST(graph);
        // MST should pick H1-H2 (5.0) and H2-H3 (3.0), not H1-H3 (10.0)
        return result.getTotalDistance() == 8.0;
    }

    private static boolean mstAvoidsCycles() {
        HospitalGraph graph = createTriangleGraph();
        KruskalMST.MSTResult result = KruskalMST.findMST(graph);
        // 3 nodes, MST should have exactly 2 edges
        return result.getEdgeCount() == 2;
    }

    private static boolean singleHospital() {
        HospitalGraph graph = new HospitalGraph();
        graph.addHospital(new Hospital("H1", "Hospital A", "Addr1", 0, 0, 100, 10, 5, true));
        KruskalMST.MSTResult result = KruskalMST.findMST(graph);
        return result.getEdges().isEmpty() && result.getTotalDistance() == 0.0;
    }

    private static boolean twoHospitals() {
        HospitalGraph graph = new HospitalGraph();
        graph.addHospital(new Hospital("H1", "Hospital A", "Addr1", 0, 0, 100, 10, 5, true));
        graph.addHospital(new Hospital("H2", "Hospital B", "Addr2", 1, 1, 80, 8, 4, true));
        graph.addRoad("H1", "H2", 7.5);
        KruskalMST.MSTResult result = KruskalMST.findMST(graph);
        return result.getEdgeCount() == 1 && result.getTotalDistance() == 7.5;
    }
}
