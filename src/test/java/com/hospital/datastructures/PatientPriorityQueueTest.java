package com.hospital.datastructures;

import com.hospital.TestRunner;
import com.hospital.model.Patient;

import java.util.List;

public class PatientPriorityQueueTest {

    public static void runTests() {
        TestRunner.runTest("addEmergencyPatient", PatientPriorityQueueTest::addEmergencyPatient);
        TestRunner.runTest("addNormalPatient", PatientPriorityQueueTest::addNormalPatient);
        TestRunner.runTest("processNextPrioritizesEmergency", PatientPriorityQueueTest::processNextPrioritizesEmergency);
        TestRunner.runTest("peekNextPatient", PatientPriorityQueueTest::peekNextPatient);
        TestRunner.runTest("removePatient", PatientPriorityQueueTest::removePatient);
        TestRunner.runTest("getAllWaitingPatients", PatientPriorityQueueTest::getAllWaitingPatients);
        TestRunner.runTest("duplicateAddRejected", PatientPriorityQueueTest::duplicateAddRejected);
        TestRunner.runTest("nullAddRejected", PatientPriorityQueueTest::nullAddRejected);
        TestRunner.runTest("clearResetsEverything", PatientPriorityQueueTest::clearResetsEverything);
        TestRunner.runTest("countsAreAccurate", PatientPriorityQueueTest::countsAreAccurate);
    }

    private static Patient createPatient(String name, Patient.Severity severity) {
        return new Patient(name, 30, "071-0000000", "symptoms", severity);
    }

    private static void addEmergencyPatient() {
        PatientPriorityQueue pq = new PatientPriorityQueue();
        Patient p = createPatient("Emergency", Patient.Severity.CRITICAL);
        assert pq.addPatient(p) : "Should add emergency patient";
        assert pq.getEmergencyCount() == 1 : "Emergency count should be 1";
        assert pq.getNormalCount() == 0 : "Normal count should be 0";
    }

    private static void addNormalPatient() {
        PatientPriorityQueue pq = new PatientPriorityQueue();
        Patient p = createPatient("Normal", Patient.Severity.LOW);
        assert pq.addPatient(p) : "Should add normal patient";
        assert pq.getEmergencyCount() == 0 : "Emergency count should be 0";
        assert pq.getNormalCount() == 1 : "Normal count should be 1";
    }

    private static void processNextPrioritizesEmergency() {
        PatientPriorityQueue pq = new PatientPriorityQueue();
        Patient normal = createPatient("Normal", Patient.Severity.LOW);
        Patient emergency = createPatient("Emergency", Patient.Severity.CRITICAL);

        pq.addPatient(normal);
        pq.addPatient(emergency);

        Patient next = pq.processNextPatient();
        assert next.getSeverity() == Patient.Severity.CRITICAL : "Should process emergency first";
        assert next.isTreated() : "Patient should be marked treated";

        Patient second = pq.processNextPatient();
        assert second.getSeverity() == Patient.Severity.LOW : "Should process normal second";
    }

    private static void peekNextPatient() {
        PatientPriorityQueue pq = new PatientPriorityQueue();
        Patient p = createPatient("Peek", Patient.Severity.HIGH);
        pq.addPatient(p);

        Patient peeked = pq.peekNextPatient();
        assert peeked != null : "Peek should return patient";
        assert peeked.getId().equals(p.getId()) : "Peek should return correct patient";
        assert pq.getTotalWaitingCount() == 1 : "Peek should not remove patient";
    }

    private static void removePatient() {
        PatientPriorityQueue pq = new PatientPriorityQueue();
        Patient p = createPatient("Remove", Patient.Severity.MODERATE);
        pq.addPatient(p);

        assert pq.removePatient(p.getId()) : "Should remove patient";
        assert pq.getTotalWaitingCount() == 0 : "Queue should be empty after removal";
    }

    private static void getAllWaitingPatients() {
        PatientPriorityQueue pq = new PatientPriorityQueue();
        pq.addPatient(createPatient("E", Patient.Severity.CRITICAL));
        pq.addPatient(createPatient("N", Patient.Severity.LOW));

        List<Patient> all = pq.getAllWaitingPatients();
        assert all.size() == 2 : "Should have 2 waiting patients";
    }

    private static void duplicateAddRejected() {
        PatientPriorityQueue pq = new PatientPriorityQueue();
        Patient p = createPatient("Dup", Patient.Severity.HIGH);
        assert pq.addPatient(p);
        assert !pq.addPatient(p) : "Duplicate add should be rejected";
    }

    private static void nullAddRejected() {
        PatientPriorityQueue pq = new PatientPriorityQueue();
        assert !pq.addPatient(null) : "Null add should be rejected";
    }

    private static void clearResetsEverything() {
        PatientPriorityQueue pq = new PatientPriorityQueue();
        pq.addPatient(createPatient("E", Patient.Severity.CRITICAL));
        pq.addPatient(createPatient("N", Patient.Severity.LOW));
        pq.processNextPatient(); // move one to treated

        pq.clear();
        assert pq.getTotalWaitingCount() == 0 : "Waiting should be 0";
        assert pq.getTreatedCount() == 0 : "Treated should be 0";
        assert pq.getEmergencyCount() == 0 : "Emergency should be 0";
        assert pq.getNormalCount() == 0 : "Normal should be 0";
    }

    private static void countsAreAccurate() {
        PatientPriorityQueue pq = new PatientPriorityQueue();
        pq.addPatient(createPatient("E1", Patient.Severity.CRITICAL));
        pq.addPatient(createPatient("E2", Patient.Severity.HIGH));
        pq.addPatient(createPatient("N1", Patient.Severity.MODERATE));
        pq.addPatient(createPatient("N2", Patient.Severity.LOW));

        assert pq.getEmergencyCount() == 2 : "Should have 2 emergency";
        assert pq.getNormalCount() == 2 : "Should have 2 normal";
        assert pq.getTotalWaitingCount() == 4 : "Should have 4 total waiting";
    }
}
