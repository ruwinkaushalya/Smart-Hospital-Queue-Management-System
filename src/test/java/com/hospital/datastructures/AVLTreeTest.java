package com.hospital.datastructures;

import com.hospital.TestRunner;
import com.hospital.model.Medication;

import java.time.LocalDate;

public class AVLTreeTest {
    public static void runTests() {
        TestRunner.runTest("addAndContains", AVLTreeTest::addAndContains);
        TestRunner.runTest("removeAndRebalance", AVLTreeTest::removeAndRebalance);
        TestRunner.runTest("inOrderTraversal", AVLTreeTest::inOrderTraversal);
        TestRunner.runTest("searchByName", AVLTreeTest::searchByName);
        TestRunner.runTest("treeRemainsBalanced", AVLTreeTest::treeRemainsBalanced);
        TestRunner.runTest("duplicateAddRejected", AVLTreeTest::duplicateAddRejected);
        TestRunner.runTest("getTreeHeightAfterInsertions", AVLTreeTest::getTreeHeightAfterInsertions);
        TestRunner.runTest("clearEmptiesTree", AVLTreeTest::clearEmptiesTree);
    }

    private static Medication med(String name, String id) {
        return new Medication(name, "Category", "Desc", 100, 10, 5.0,
                LocalDate.now().plusMonths(6), "Supplier", "500mg", "Tablet");
    }

    private static boolean addAndContains() {
        AVLTree tree = new AVLTree();
        Medication m1 = med("Paracetamol", "MED-001");
        Medication m2 = med("Aspirin", "MED-002");
        tree.add(m1);
        tree.add(m2);
        return tree.contains("MED-001") && tree.contains("MED-002") && tree.size() == 2;
    }

    private static boolean removeAndRebalance() {
        AVLTree tree = new AVLTree();
        tree.add(med("A", "MED-A"));
        tree.add(med("B", "MED-B"));
        tree.add(med("C", "MED-C"));
        tree.remove("MED-B");
        return !tree.contains("MED-B") && tree.size() == 2 && tree.isBalanced();
    }

    private static boolean inOrderTraversal() {
        AVLTree tree = new AVLTree();
        tree.add(med("Charlie", "MED-C"));
        tree.add(med("Alpha", "MED-A"));
        tree.add(med("Bravo", "MED-B"));
        var list = tree.getAllInOrder();
        return list.size() == 3 &&
               "MED-A".equals(list.get(0).getId()) &&
               "MED-B".equals(list.get(1).getId()) &&
               "MED-C".equals(list.get(2).getId());
    }

    private static boolean searchByName() {
        AVLTree tree = new AVLTree();
        tree.add(med("Paracetamol", "MED-001"));
        tree.add(med("Amoxicillin", "MED-002"));
        tree.add(med("Paracetamol Extra", "MED-003"));
        var results = tree.searchByName("paracetamol");
        return results.size() == 2;
    }

    private static boolean treeRemainsBalanced() {
        AVLTree tree = new AVLTree();
        // Insert in ascending order to force left-heavy rotations
        for (int i = 1; i <= 10; i++) {
            tree.add(med("Med" + i, String.format("MED-%03d", i)));
        }
        return tree.isBalanced() && tree.getTreeHeight() <= 4; // AVL height should be ~log2(10) ~ 4
    }

    private static boolean duplicateAddRejected() {
        AVLTree tree = new AVLTree();
        Medication m = med("Test", "MED-001");
        tree.add(m);
        return !tree.add(m) && tree.size() == 1;
    }

    private static boolean getTreeHeightAfterInsertions() {
        AVLTree tree = new AVLTree();
        tree.add(med("A", "MED-001"));
        tree.add(med("B", "MED-002"));
        tree.add(med("C", "MED-003"));
        return tree.getTreeHeight() >= 2;
    }

    private static boolean clearEmptiesTree() {
        AVLTree tree = new AVLTree();
        tree.add(med("A", "MED-001"));
        tree.clear();
        return tree.isEmpty() && tree.size() == 0;
    }
}
