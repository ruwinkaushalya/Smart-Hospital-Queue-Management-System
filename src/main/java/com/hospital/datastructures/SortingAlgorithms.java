package com.hospital.datastructures;

import com.hospital.model.Patient;

import java.util.Comparator;

/**
 * Sorting Algorithms implementation.
 * Contains Bubble Sort and Selection Sort for educational demonstration.
 * Both algorithms are applied to Patient arrays with configurable comparators.
 *
 * Bubble Sort: Repeatedly swaps adjacent elements if they are in the wrong order.
 *   Time Complexity: O(n²) average/worst, O(n) best (already sorted).
 *   Space Complexity: O(1).
 *
 * Selection Sort: Repeatedly finds the minimum element and places it at the beginning.
 *   Time Complexity: O(n²) for all cases.
 *   Space Complexity: O(1).
 */
public class SortingAlgorithms {

    /**
     * Bubble Sort on Patient array.
     * Steps:
     * 1. Iterate through the array multiple times.
     * 2. Compare adjacent elements.
     * 3. Swap if they are in the wrong order.
     * 4. If a complete pass has no swaps, the array is sorted.
     *
     * @param patients   the array to sort
     * @param comparator defines the sort order
     * @return the number of comparisons performed
     */
    public static int bubbleSort(Patient[] patients, Comparator<Patient> comparator) {
        int n = patients.length;
        int comparisons = 0;
        boolean swapped;

        for (int i = 0; i < n - 1; i++) {
            swapped = false;
            for (int j = 0; j < n - i - 1; j++) {
                comparisons++;
                if (comparator.compare(patients[j], patients[j + 1]) > 0) {
                    Patient temp = patients[j];
                    patients[j] = patients[j + 1];
                    patients[j + 1] = temp;
                    swapped = true;
                }
            }
            if (!swapped) break; // Optimized: stop if already sorted
        }
        return comparisons;
    }

    /**
     * Selection Sort on Patient array.
     * Steps:
     * 1. Divide the array into sorted and unsorted portions.
     * 2. Find the minimum element in the unsorted portion.
     * 3. Swap it with the first element of the unsorted portion.
     * 4. Expand the sorted portion by one.
     * 5. Repeat until the entire array is sorted.
     *
     * @param patients   the array to sort
     * @param comparator defines the sort order
     * @return the number of comparisons performed
     */
    public static int selectionSort(Patient[] patients, Comparator<Patient> comparator) {
        int n = patients.length;
        int comparisons = 0;

        for (int i = 0; i < n - 1; i++) {
            int minIndex = i;
            for (int j = i + 1; j < n; j++) {
                comparisons++;
                if (comparator.compare(patients[j], patients[minIndex]) < 0) {
                    minIndex = j;
                }
            }
            if (minIndex != i) {
                Patient temp = patients[i];
                patients[i] = patients[minIndex];
                patients[minIndex] = temp;
            }
        }
        return comparisons;
    }

    // Pre-built comparators for common use cases
    public static final Comparator<Patient> BY_SEVERITY = (a, b) -> {
        int sev = Integer.compare(b.getSeverity().getPriorityValue(), a.getSeverity().getPriorityValue());
        return sev != 0 ? sev : a.getRegistrationTime().compareTo(b.getRegistrationTime());
    };

    public static final Comparator<Patient> BY_NAME = Comparator.comparing(
        p -> p.getName() != null ? p.getName().toLowerCase() : ""
    );

    public static final Comparator<Patient> BY_AGE = Comparator.comparingInt(Patient::getAge);

    public static final Comparator<Patient> BY_REGISTRATION_TIME = Comparator.comparing(
        Patient::getRegistrationTime
    );
}
