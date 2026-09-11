package com.hospital.datastructures;

import com.hospital.TestRunner;
import com.hospital.model.Patient;

import java.util.List;

public class MinHeapPriorityQueueTest {

    public static void runTests() {
        TestRunner.runTest("addAndPeekReturnsHighestPriority", MinHeapPriorityQueueTest::addAndPeekReturnsHighestPriority);
        TestRunner.runTest("pollOrderIsPriorityThenFIFO", MinHeapPriorityQueueTest::pollOrderIsPriorityThenFIFO);
        TestRunner.runTest("removeSpecificPatient", MinHeapPriorityQueueTest::removeSpecificPatient);
        TestRunner.runTest("sizeAndEmptyTracking", MinHeapPriorityQueueTest::sizeAndEmptyTracking);
        TestRunner.runTest("clearEmptiesQueue", MinHeapPriorityQueueTest::clearEmptiesQueue);
        TestRunner.runTest("nullAddIsRejected", MinHeapPriorityQueueTest::nullAddIsRejected);
        TestRunner.runTest("removeNonExistentReturnsFalse", MinHeapPriorityQueueTest::removeNonExistentReturnsFalse);
        TestRunner.runTest("toSortedListOrder", MinHeapPriorityQueueTest::toSortedListOrder);
    }

    private static Patient createPatient(String name, Patient.Severity severity) {
        return new Patient(name, 30, "071-0000000", "symptoms", severity);
    }

    private static void addAndPeekReturnsHighestPriority() {
        MinHeapPriorityQueue queue = new MinHeapPriorityQueue();
        Patient critical = createPatient("Critical", Patient.Severity.CRITICAL);
        Patient low = createPatient("Low", Patient.Severity.LOW);
        Patient high = createPatient("High", Patient.Severity.HIGH);

        queue.add(low);
        queue.add(critical);
        queue.add(high);

        Patient peeked = queue.peek();
        assert peeked != null : "Peek should not return null";
        assert peeked.getSeverity() == Patient.Severity.CRITICAL : "Peek should return CRITICAL patient";
    }

    private static void pollOrderIsPriorityThenFIFO() {
        MinHeapPriorityQueue queue = new MinHeapPriorityQueue();
        Patient p1 = createPatient("Critical1", Patient.Severity.CRITICAL);
        try { Thread.sleep(10); } catch (InterruptedException ignored) {}
        Patient p2 = createPatient("Critical2", Patient.Severity.CRITICAL);
        Patient p3 = createPatient("High", Patient.Severity.HIGH);

        queue.add(p3);
        queue.add(p1);
        queue.add(p2);

        Patient first = queue.poll();
        assert first.getId().equals(p1.getId()) : "First poll should be earliest CRITICAL (FIFO tiebreak)";

        Patient second = queue.poll();
        assert second.getId().equals(p2.getId()) : "Second poll should be next CRITICAL";

        Patient third = queue.poll();
        assert third.getId().equals(p3.getId()) : "Third poll should be HIGH";
    }

    private static void removeSpecificPatient() {
        MinHeapPriorityQueue queue = new MinHeapPriorityQueue();
        Patient p1 = createPatient("One", Patient.Severity.CRITICAL);
        Patient p2 = createPatient("Two", Patient.Severity.HIGH);
        Patient p3 = createPatient("Three", Patient.Severity.LOW);

        queue.add(p1);
        queue.add(p2);
        queue.add(p3);

        assert queue.remove(p2) : "Should remove existing patient";
        assert queue.size() == 2 : "Size should be 2 after removal";

        Patient polled = queue.poll();
        assert polled.getSeverity() == Patient.Severity.CRITICAL : "After removing HIGH, CRITICAL should be first";
    }

    private static void sizeAndEmptyTracking() {
        MinHeapPriorityQueue queue = new MinHeapPriorityQueue();
        assert queue.isEmpty() : "New queue should be empty";
        assert queue.size() == 0 : "New queue size should be 0";

        queue.add(createPatient("P", Patient.Severity.MODERATE));
        assert !queue.isEmpty() : "Queue with patient should not be empty";
        assert queue.size() == 1 : "Size should be 1";
    }

    private static void clearEmptiesQueue() {
        MinHeapPriorityQueue queue = new MinHeapPriorityQueue();
        queue.add(createPatient("P", Patient.Severity.MODERATE));
        queue.clear();
        assert queue.isEmpty() : "Queue should be empty after clear";
        assert queue.peek() == null : "Peek should return null after clear";
    }

    private static void nullAddIsRejected() {
        MinHeapPriorityQueue queue = new MinHeapPriorityQueue();
        assert !queue.add(null) : "Adding null should return false";
        assert queue.isEmpty() : "Queue should remain empty after null add";
    }

    private static void removeNonExistentReturnsFalse() {
        MinHeapPriorityQueue queue = new MinHeapPriorityQueue();
        Patient p = createPatient("P", Patient.Severity.MODERATE);
        queue.add(p);
        Patient other = createPatient("Other", Patient.Severity.MODERATE);
        assert !queue.remove(other) : "Removing non-existent patient should return false";
    }

    private static void toSortedListOrder() {
        MinHeapPriorityQueue queue = new MinHeapPriorityQueue();
        queue.add(createPatient("Low", Patient.Severity.LOW));
        queue.add(createPatient("Critical", Patient.Severity.CRITICAL));
        queue.add(createPatient("High", Patient.Severity.HIGH));

        List<Patient> sorted = queue.toSortedList();
        assert sorted.size() == 3 : "Sorted list should have 3 items";
        assert sorted.get(0).getSeverity() == Patient.Severity.CRITICAL : "First should be CRITICAL";
        assert sorted.get(1).getSeverity() == Patient.Severity.HIGH : "Second should be HIGH";
        assert sorted.get(2).getSeverity() == Patient.Severity.LOW : "Third should be LOW";
    }
}
