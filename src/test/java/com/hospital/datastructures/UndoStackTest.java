package com.hospital.datastructures;

import com.hospital.TestRunner;

public class UndoStackTest {
    public static void runTests() {
        TestRunner.runTest("pushAndPop", UndoStackTest::pushAndPop);
        TestRunner.runTest("peekDoesNotRemove", UndoStackTest::peekDoesNotRemove);
        TestRunner.runTest("isEmptyAndSize", UndoStackTest::isEmptyAndSize);
        TestRunner.runTest("popEmptyReturnsNull", UndoStackTest::popEmptyReturnsNull);
        TestRunner.runTest("clearEmptiesStack", UndoStackTest::clearEmptiesStack);
        TestRunner.runTest("maxSizeEnforced", UndoStackTest::maxSizeEnforced);
        TestRunner.runTest("toListPreservesOrder", UndoStackTest::toListPreservesOrder);
    }

    private static boolean pushAndPop() {
        UndoStack<String> stack = new UndoStack<>();
        stack.push("Action1");
        stack.push("Action2");
        String popped = stack.pop();
        return "Action2".equals(popped) && stack.size() == 1;
    }

    private static boolean peekDoesNotRemove() {
        UndoStack<Integer> stack = new UndoStack<>();
        stack.push(10);
        stack.push(20);
        int peeked = stack.peek();
        return peeked == 20 && stack.size() == 2;
    }

    private static boolean isEmptyAndSize() {
        UndoStack<String> stack = new UndoStack<>();
        if (!stack.isEmpty()) return false;
        stack.push("A");
        if (stack.isEmpty() || stack.size() != 1) return false;
        stack.pop();
        return stack.isEmpty();
    }

    private static boolean popEmptyReturnsNull() {
        UndoStack<String> stack = new UndoStack<>();
        return stack.pop() == null;
    }

    private static boolean clearEmptiesStack() {
        UndoStack<String> stack = new UndoStack<>();
        stack.push("A");
        stack.push("B");
        stack.clear();
        return stack.isEmpty() && stack.size() == 0;
    }

    private static boolean maxSizeEnforced() {
        UndoStack<String> stack = new UndoStack<>(3);
        stack.push("A");
        stack.push("B");
        stack.push("C");
        stack.push("D"); // Should evict oldest
        return stack.size() == 3 && "B".equals(stack.toList().get(0));
    }

    private static boolean toListPreservesOrder() {
        UndoStack<String> stack = new UndoStack<>();
        stack.push("First");
        stack.push("Second");
        stack.push("Third");
        var list = stack.toList();
        return list.size() == 3 &&
               "First".equals(list.get(0)) &&
               "Second".equals(list.get(1)) &&
               "Third".equals(list.get(2));
    }
}
