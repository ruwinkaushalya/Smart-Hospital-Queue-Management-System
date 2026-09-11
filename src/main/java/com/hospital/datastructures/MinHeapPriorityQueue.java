package com.hospital.datastructures;

import com.hospital.model.Patient;

import java.util.ArrayList;
import java.util.List;

public class MinHeapPriorityQueue {
    private final List<Patient> heap;

    public MinHeapPriorityQueue() {
        this.heap = new ArrayList<>();
    }

    public synchronized boolean add(Patient patient) {
        if (patient == null) return false;
        heap.add(patient);
        siftUp(heap.size() - 1);
        return true;
    }

    public synchronized Patient poll() {
        if (isEmpty()) return null;
        Patient root = heap.get(0);
        Patient last = heap.remove(heap.size() - 1);
        if (!isEmpty()) {
            heap.set(0, last);
            siftDown(0);
        }
        return root;
    }

    public synchronized Patient peek() {
        return isEmpty() ? null : heap.get(0);
    }

    public synchronized boolean remove(Patient patient) {
        if (patient == null || isEmpty()) return false;
        int index = -1;
        for (int i = 0; i < heap.size(); i++) {
            if (heap.get(i).getId().equals(patient.getId())) {
                index = i;
                break;
            }
        }
        if (index == -1) return false;

        Patient last = heap.remove(heap.size() - 1);
        if (index < heap.size()) {
            heap.set(index, last);
            siftDown(index);
            siftUp(index);
        }
        return true;
    }

    public synchronized int size() {
        return heap.size();
    }

    public synchronized boolean isEmpty() {
        return heap.isEmpty();
    }

    public synchronized void clear() {
        heap.clear();
    }

    public synchronized List<Patient> toSortedList() {
        List<Patient> sorted = new ArrayList<>(heap);
        sorted.sort((a, b) -> -a.compareTo(b));
        return sorted;
    }

    private void siftUp(int index) {
        while (index > 0) {
            int parent = (index - 1) / 2;
            if (heap.get(index).compareTo(heap.get(parent)) >= 0) {
                break;
            }
            swap(index, parent);
            index = parent;
        }
    }

    private void siftDown(int index) {
        int size = heap.size();
        while (index < size) {
            int leftChild = 2 * index + 1;
            int rightChild = 2 * index + 2;
            int smallest = index;

            if (leftChild < size && heap.get(leftChild).compareTo(heap.get(smallest)) < 0) {
                smallest = leftChild;
            }
            if (rightChild < size && heap.get(rightChild).compareTo(heap.get(smallest)) < 0) {
                smallest = rightChild;
            }
            if (smallest == index) break;

            swap(index, smallest);
            index = smallest;
        }
    }

    private void swap(int i, int j) {
        Patient temp = heap.get(i);
        heap.set(i, heap.get(j));
        heap.set(j, temp);
    }
}
