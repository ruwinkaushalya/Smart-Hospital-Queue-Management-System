package com.hospital.datastructures;

import com.hospital.model.VisitRecord;

public class PatientHistoryLinkedList {
    private Node head;
    private Node tail;
    private int size;

    private static class Node {
        VisitRecord record;
        Node prev;
        Node next;

        Node(VisitRecord record) {
            this.record = record;
        }
    }

    public synchronized void addVisit(VisitRecord record) {
        if (record == null) return;
        Node newNode = new Node(record);
        if (tail == null) {
            head = tail = newNode;
        } else {
            tail.next = newNode;
            newNode.prev = tail;
            tail = newNode;
        }
        size++;
    }

    public synchronized boolean removeVisit(String visitId) {
        Node current = head;
        while (current != null) {
            if (current.record.getId().equals(visitId)) {
                if (current.prev != null) {
                    current.prev.next = current.next;
                } else {
                    head = current.next;
                }
                if (current.next != null) {
                    current.next.prev = current.prev;
                } else {
                    tail = current.prev;
                }
                size--;
                return true;
            }
            current = current.next;
        }
        return false;
    }

    public synchronized VisitRecord getLatestVisit() {
        return tail != null ? tail.record : null;
    }

    public synchronized VisitRecord getFirstVisit() {
        return head != null ? head.record : null;
    }

    public synchronized VisitRecord findVisit(String visitId) {
        Node current = head;
        while (current != null) {
            if (current.record.getId().equals(visitId)) {
                return current.record;
            }
            current = current.next;
        }
        return null;
    }

    public synchronized int size() {
        return size;
    }

    public synchronized boolean isEmpty() {
        return size == 0;
    }

    public synchronized void clear() {
        head = null;
        tail = null;
        size = 0;
    }

    public synchronized VisitRecord[] toArray() {
        VisitRecord[] array = new VisitRecord[size];
        Node current = head;
        int index = 0;
        while (current != null) {
            array[index++] = current.record;
            current = current.next;
        }
        return array;
    }

    public synchronized java.util.List<VisitRecord> toList() {
        java.util.List<VisitRecord> list = new java.util.ArrayList<>();
        Node current = head;
        while (current != null) {
            list.add(current.record);
            current = current.next;
        }
        return list;
    }

    public synchronized java.util.List<VisitRecord> getVisitsByType(VisitRecord.VisitType type) {
        java.util.List<VisitRecord> list = new java.util.ArrayList<>();
        Node current = head;
        while (current != null) {
            if (current.record.getType() == type) {
                list.add(current.record);
            }
            current = current.next;
        }
        return list;
    }

    public synchronized java.util.List<VisitRecord> getVisitsByDateRange(java.time.LocalDate from, java.time.LocalDate to) {
        java.util.List<VisitRecord> list = new java.util.ArrayList<>();
        Node current = head;
        while (current != null) {
            java.time.LocalDate date = current.record.getVisitDate();
            if (!date.isBefore(from) && !date.isAfter(to)) {
                list.add(current.record);
            }
            current = current.next;
        }
        return list;
    }

    public synchronized double getTotalCost() {
        double total = 0;
        Node current = head;
        while (current != null) {
            total += current.record.getTotalCost();
            current = current.next;
        }
        return total;
    }
}
