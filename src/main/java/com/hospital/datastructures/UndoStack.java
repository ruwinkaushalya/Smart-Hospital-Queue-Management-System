package com.hospital.datastructures;

import java.util.ArrayList;
import java.util.List;

/**
 * Generic Stack implementation using ArrayList.
 * Supports push, pop, peek, size, isEmpty, and clear.
 * Used for undo/redo functionality in admin actions.
 *
 * @param <T> the type of elements stored in the stack
 */
public class UndoStack<T> {
    private final List<T> elements;
    private final int maxSize;

    public UndoStack() {
        this(100);
    }

    public UndoStack(int maxSize) {
        this.elements = new ArrayList<>();
        this.maxSize = maxSize;
    }

    public synchronized void push(T item) {
        if (item == null) return;
        if (elements.size() >= maxSize) {
            elements.remove(0); // Remove oldest if at capacity
        }
        elements.add(item);
    }

    public synchronized T pop() {
        if (isEmpty()) return null;
        return elements.remove(elements.size() - 1);
    }

    public synchronized T peek() {
        if (isEmpty()) return null;
        return elements.get(elements.size() - 1);
    }

    public synchronized boolean isEmpty() {
        return elements.isEmpty();
    }

    public synchronized int size() {
        return elements.size();
    }

    public synchronized void clear() {
        elements.clear();
    }

    public synchronized List<T> toList() {
        return new ArrayList<>(elements);
    }

    @Override
    public synchronized String toString() {
        return "UndoStack[" + elements.size() + " items]";
    }
}
