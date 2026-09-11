package com.hospital;

import com.hospital.datastructures.MinHeapPriorityQueueTest;
import com.hospital.datastructures.CircularQueueTest;
import com.hospital.datastructures.DijkstraAlgorithmTest;
import com.hospital.datastructures.HospitalGraphTest;
import com.hospital.datastructures.PatientPriorityQueueTest;
import com.hospital.datastructures.UndoStackTest;
import com.hospital.datastructures.AVLTreeTest;
import com.hospital.datastructures.SortingAlgorithmsTest;
import com.hospital.datastructures.KruskalMSTTest;

/**
 * Lightweight test runner for the Smart Hospital Queue Management System.
 * Runs all data structure unit tests and reports aggregate results.
 * No external dependencies (JUnit) required — uses Java assertions.
 */
public class TestRunner {

    private static int passed = 0;
    private static int failed = 0;

    public static void main(String[] args) {
        System.out.println("========================================");
        System.out.println("  Smart Hospital Data Structure Tests   ");
        System.out.println("========================================\n");

        runSuite("MinHeapPriorityQueue", MinHeapPriorityQueueTest::runTests);
        runSuite("CircularQueue", CircularQueueTest::runTests);
        runSuite("DijkstraAlgorithm", DijkstraAlgorithmTest::runTests);
        runSuite("HospitalGraph", HospitalGraphTest::runTests);
        runSuite("PatientPriorityQueue", PatientPriorityQueueTest::runTests);
        runSuite("UndoStack", UndoStackTest::runTests);
        runSuite("AVLTree", AVLTreeTest::runTests);
        runSuite("SortingAlgorithms", SortingAlgorithmsTest::runTests);
        runSuite("KruskalMST", KruskalMSTTest::runTests);

        System.out.println("\n========================================");
        System.out.println("  Results: " + passed + " passed, " + failed + " failed");
        System.out.println("========================================");

        if (failed > 0) {
            System.exit(1);
        }
    }

    public static void runTest(String name, Runnable test) {
        try {
            test.run();
            System.out.println("  [PASS] " + name);
            passed++;
        } catch (AssertionError | Exception e) {
            System.out.println("  [FAIL] " + name);
            System.out.println("         " + e.getMessage());
            failed++;
        }
    }

    private static void runSuite(String suiteName, Runnable suite) {
        System.out.println("Running " + suiteName + " tests...");
        suite.run();
        System.out.println();
    }
}
