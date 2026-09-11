package com.hospital.datastructures;

import com.hospital.model.Patient;

import java.util.ArrayList;
import java.util.List;

public class CircularQueue<T> {
    private static final int DEFAULT_CAPACITY = 128;
    private static final int MAX_CAPACITY = 1024;

    private Object[] elements;
    private int head;
    private int tail;
    private int size;
    private int capacity;

    public CircularQueue() {
        this(DEFAULT_CAPACITY);
    }

    public CircularQueue(int initialCapacity) {
        if (initialCapacity <= 0) {
            throw new IllegalArgumentException("Capacity must be positive");
        }
        this.capacity = Math.min(initialCapacity, MAX_CAPACITY);
        this.elements = new Object[this.capacity];
        this.head = 0;
        this.tail = 0;
        this.size = 0;
    }

    public synchronized boolean enqueue(T item) {
        if (isFull()) {
            if (!resize()) {
                return false;
            }
        }
        elements[tail] = item;
        tail = (tail + 1) % capacity;
        size++;
        return true;
    }

    @SuppressWarnings("unchecked")
    public synchronized T dequeue() {
        if (isEmpty()) {
            return null;
        }
        T item = (T) elements[head];
        elements[head] = null;
        head = (head + 1) % capacity;
        size--;
        return item;
    }

    @SuppressWarnings("unchecked")
    public synchronized T peek() {
        if (isEmpty()) {
            return null;
        }
        return (T) elements[head];
    }

    @SuppressWarnings("unchecked")
    public synchronized List<T> toList() {
        List<T> list = new ArrayList<>(size);
        for (int i = 0; i < size; i++) {
            list.add((T) elements[(head + i) % capacity]);
        }
        return list;
    }

    public synchronized boolean remove(T item) {
        if (isEmpty() || item == null) return false;

        int index = -1;
        for (int i = 0; i < size; i++) {
            if (item.equals(elements[(head + i) % capacity])) {
                index = i;
                break;
            }
        }

        if (index == -1) return false;

        int actualIndex = (head + index) % capacity;

        if (actualIndex == head) {
            elements[head] = null;
            head = (head + 1) % capacity;
        } else {
            for (int i = index; i < size - 1; i++) {
                int curr = (head + i) % capacity;
                int next = (head + i + 1) % capacity;
                elements[curr] = elements[next];
            }
            int lastIndex = (head + size - 1) % capacity;
            elements[lastIndex] = null;
            tail = (tail - 1 + capacity) % capacity;
        }
        size--;
        return true;
    }

    @SuppressWarnings("unchecked")
    public synchronized T get(int index) {
        if (index < 0 || index >= size) {
            throw new IndexOutOfBoundsException("Index: " + index + ", Size: " + size);
        }
        return (T) elements[(head + index) % capacity];
    }

    public synchronized int size() {
        return size;
    }

    public synchronized boolean isEmpty() {
        return size == 0;
    }

    public synchronized boolean isFull() {
        return size == capacity;
    }

    public synchronized int getCapacity() {
        return capacity;
    }

    private boolean resize() {
        if (capacity >= MAX_CAPACITY) {
            return false;
        }
        int newCapacity = Math.min(capacity * 2, MAX_CAPACITY);
        Object[] newElements = new Object[newCapacity];
        for (int i = 0; i < size; i++) {
            newElements[i] = elements[(head + i) % capacity];
        }
        elements = newElements;
        head = 0;
        tail = size;
        capacity = newCapacity;
        return true;
    }

    public synchronized void clear() {
        for (int i = 0; i < capacity; i++) {
            elements[i] = null;
        }
        head = 0;
        tail = 0;
        size = 0;
    }

    @Override
    public synchronized String toString() {
        StringBuilder sb = new StringBuilder("CircularQueue[");
        for (int i = 0; i < size; i++) {
            sb.append(elements[(head + i) % capacity]);
            if (i < size - 1) sb.append(", ");
        }
        sb.append("]");
        return sb.toString();
    }
}
