package com.hospital.datastructures;

import com.hospital.TestRunner;
import com.hospital.model.Patient;

public class SortingAlgorithmsTest {
    public static void runTests() {
        TestRunner.runTest("bubbleSortByAge", SortingAlgorithmsTest::bubbleSortByAge);
        TestRunner.runTest("selectionSortByName", SortingAlgorithmsTest::selectionSortByName);
        TestRunner.runTest("bubbleSortAlreadySorted", SortingAlgorithmsTest::bubbleSortAlreadySorted);
        TestRunner.runTest("selectionSortBySeverity", SortingAlgorithmsTest::selectionSortBySeverity);
        TestRunner.runTest("bubbleSortReverseOrder", SortingAlgorithmsTest::bubbleSortReverseOrder);
        TestRunner.runTest("emptyArray", SortingAlgorithmsTest::emptyArray);
        TestRunner.runTest("singleElement", SortingAlgorithmsTest::singleElement);
    }

    private static boolean bubbleSortByAge() {
        Patient[] arr = {
            new Patient("Zara", 30, "077-1", "Fever", Patient.Severity.LOW),
            new Patient("Amy", 20, "077-2", "Cough", Patient.Severity.MODERATE),
            new Patient("John", 50, "077-3", "Pain", Patient.Severity.HIGH)
        };
        int comparisons = SortingAlgorithms.bubbleSort(arr, SortingAlgorithms.BY_AGE);
        return arr[0].getAge() == 20 && arr[1].getAge() == 30 && arr[2].getAge() == 50 && comparisons > 0;
    }

    private static boolean selectionSortByName() {
        Patient[] arr = {
            new Patient("Zara", 30, "077-1", "Fever", Patient.Severity.LOW),
            new Patient("Amy", 20, "077-2", "Cough", Patient.Severity.MODERATE),
            new Patient("John", 50, "077-3", "Pain", Patient.Severity.HIGH)
        };
        int comparisons = SortingAlgorithms.selectionSort(arr, SortingAlgorithms.BY_NAME);
        return "Amy".equals(arr[0].getName()) && "John".equals(arr[1].getName()) && "Zara".equals(arr[2].getName()) && comparisons > 0;
    }

    private static boolean bubbleSortAlreadySorted() {
        Patient[] arr = {
            new Patient("A", 20, "077-1", "Fever", Patient.Severity.LOW),
            new Patient("B", 30, "077-2", "Cough", Patient.Severity.MODERATE),
            new Patient("C", 40, "077-3", "Pain", Patient.Severity.HIGH)
        };
        int comparisons = SortingAlgorithms.bubbleSort(arr, SortingAlgorithms.BY_AGE);
        // Already sorted - optimized bubble sort should make minimal comparisons
        return arr[0].getAge() == 20 && comparisons <= 2;
    }

    private static boolean selectionSortBySeverity() {
        Patient[] arr = {
            new Patient("Low", 30, "077-1", "Fever", Patient.Severity.LOW),
            new Patient("Critical", 20, "077-2", "Cough", Patient.Severity.CRITICAL),
            new Patient("High", 50, "077-3", "Pain", Patient.Severity.HIGH)
        };
        SortingAlgorithms.selectionSort(arr, SortingAlgorithms.BY_SEVERITY);
        return arr[0].getSeverity() == Patient.Severity.CRITICAL &&
               arr[1].getSeverity() == Patient.Severity.HIGH &&
               arr[2].getSeverity() == Patient.Severity.LOW;
    }

    private static boolean bubbleSortReverseOrder() {
        Patient[] arr = {
            new Patient("C", 50, "077-3", "Pain", Patient.Severity.HIGH),
            new Patient("B", 30, "077-2", "Cough", Patient.Severity.MODERATE),
            new Patient("A", 20, "077-1", "Fever", Patient.Severity.LOW)
        };
        SortingAlgorithms.bubbleSort(arr, SortingAlgorithms.BY_AGE);
        return arr[0].getAge() == 20 && arr[1].getAge() == 30 && arr[2].getAge() == 50;
    }

    private static boolean emptyArray() {
        Patient[] arr = new Patient[0];
        int comps = SortingAlgorithms.bubbleSort(arr, SortingAlgorithms.BY_NAME);
        return comps == 0;
    }

    private static boolean singleElement() {
        Patient[] arr = { new Patient("Solo", 25, "077-1", "Fever", Patient.Severity.LOW) };
        int comps = SortingAlgorithms.selectionSort(arr, SortingAlgorithms.BY_NAME);
        return comps == 0 && "Solo".equals(arr[0].getName());
    }
}
