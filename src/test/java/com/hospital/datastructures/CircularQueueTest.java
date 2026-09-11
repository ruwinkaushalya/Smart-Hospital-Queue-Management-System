package com.hospital.datastructures;

import com.hospital.TestRunner;

public class CircularQueueTest {

    public static void runTests() {
        TestRunner.runTest("basicEnqueueDequeue", CircularQueueTest::basicEnqueueDequeue);
        TestRunner.runTest("peekDoesNotRemove", CircularQueueTest::peekDoesNotRemove);
        TestRunner.runTest("autoResizeWhenFull", CircularQueueTest::autoResizeWhenFull);
        TestRunner.runTest("removeFromMiddle", CircularQueueTest::removeFromMiddle);
        TestRunner.runTest("getByIndex", CircularQueueTest::getByIndex);
        TestRunner.runTest("clearEmptiesQueue", CircularQueueTest::clearEmptiesQueue);
        TestRunner.runTest("dequeueEmptyReturnsNull", CircularQueueTest::dequeueEmptyReturnsNull);
        TestRunner.runTest("wrapAroundBehavior", CircularQueueTest::wrapAroundBehavior);
        TestRunner.runTest("toListPreservesOrder", CircularQueueTest::toListPreservesOrder);
        TestRunner.runTest("removeHeadElement", CircularQueueTest::removeHeadElement);
    }

    private static void basicEnqueueDequeue() {
        CircularQueue<String> queue = new CircularQueue<>(4);
        assert queue.enqueue("A");
        assert queue.enqueue("B");
        assert queue.enqueue("C");

        assert queue.size() == 3;
        assert "A".equals(queue.dequeue());
        assert "B".equals(queue.dequeue());
        assert "C".equals(queue.dequeue());
        assert queue.isEmpty();
    }

    private static void peekDoesNotRemove() {
        CircularQueue<Integer> queue = new CircularQueue<>(4);
        queue.enqueue(42);
        assert queue.peek() == 42;
        assert queue.peek() == 42;
        assert queue.size() == 1;
    }

    private static void autoResizeWhenFull() {
        CircularQueue<String> queue = new CircularQueue<>(2);
        assert queue.enqueue("A");
        assert queue.enqueue("B");
        assert queue.isFull();
        assert queue.enqueue("C"); // triggers resize
        assert queue.size() == 3;
        assert queue.getCapacity() >= 4;
    }

    private static void removeFromMiddle() {
        CircularQueue<String> queue = new CircularQueue<>(8);
        queue.enqueue("A");
        queue.enqueue("B");
        queue.enqueue("C");
        queue.enqueue("D");

        assert queue.remove("B");
        assert queue.size() == 3;
        assert "A".equals(queue.get(0));
        assert "C".equals(queue.get(1));
        assert "D".equals(queue.get(2));
    }

    private static void getByIndex() {
        CircularQueue<String> queue = new CircularQueue<>(4);
        queue.enqueue("First");
        queue.enqueue("Second");
        assert "First".equals(queue.get(0));
        assert "Second".equals(queue.get(1));
    }

    private static void clearEmptiesQueue() {
        CircularQueue<String> queue = new CircularQueue<>(4);
        queue.enqueue("A");
        queue.clear();
        assert queue.isEmpty();
        assert queue.size() == 0;
    }

    private static void dequeueEmptyReturnsNull() {
        CircularQueue<String> queue = new CircularQueue<>(4);
        assert queue.dequeue() == null;
        assert queue.peek() == null;
    }

    private static void wrapAroundBehavior() {
        CircularQueue<String> queue = new CircularQueue<>(4);
        queue.enqueue("A");
        queue.enqueue("B");
        queue.enqueue("C");
        queue.dequeue(); // remove A, head moves
        queue.dequeue(); // remove B, head moves
        queue.enqueue("D");
        queue.enqueue("E");
        queue.enqueue("F"); // should wrap around

        assert queue.size() == 4;
        assert "C".equals(queue.dequeue());
        assert "D".equals(queue.dequeue());
        assert "E".equals(queue.dequeue());
        assert "F".equals(queue.dequeue());
    }

    private static void toListPreservesOrder() {
        CircularQueue<String> queue = new CircularQueue<>(4);
        queue.enqueue("A");
        queue.enqueue("B");
        queue.enqueue("C");

        java.util.List<String> list = queue.toList();
        assert list.size() == 3;
        assert "A".equals(list.get(0));
        assert "B".equals(list.get(1));
        assert "C".equals(list.get(2));
    }

    private static void removeHeadElement() {
        CircularQueue<String> queue = new CircularQueue<>(4);
        queue.enqueue("A");
        queue.enqueue("B");
        queue.enqueue("C");

        assert queue.remove("A");
        assert queue.size() == 2;
        assert "B".equals(queue.peek());
    }
}
