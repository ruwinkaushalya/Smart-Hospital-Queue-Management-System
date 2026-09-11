package com.hospital.datastructures;

import com.hospital.model.Medication;

import java.util.ArrayList;
import java.util.List;

/**
 * AVL Tree - Self-Balancing Binary Search Tree.
 * Automatically balances after every insertion and deletion to maintain O(log n) height.
 * Used for efficient medication storage and retrieval.
 *
 * Balance Factor = height(left) - height(right)
 * Valid balance factors: -1, 0, 1
 * If |balance factor| > 1, rotations are performed to restore balance.
 */
public class AVLTree {
    private Node root;
    private int size;

    private static class Node {
        Medication medication;
        Node left;
        Node right;
        int height;

        Node(Medication medication) {
            this.medication = medication;
            this.height = 1;
        }
    }

    public synchronized boolean add(Medication medication) {
        if (medication == null) return false;
        if (contains(medication.getId())) return false;
        root = insert(root, medication);
        size++;
        return true;
    }

    private Node insert(Node node, Medication medication) {
        if (node == null) return new Node(medication);

        int cmp = medication.getId().compareTo(node.medication.getId());
        if (cmp < 0) {
            node.left = insert(node.left, medication);
        } else if (cmp > 0) {
            node.right = insert(node.right, medication);
        } else {
            return node; // Duplicate
        }

        node.height = 1 + Math.max(height(node.left), height(node.right));
        int balance = getBalance(node);

        // Left Left Case
        if (balance > 1 && medication.getId().compareTo(node.left.medication.getId()) < 0) {
            return rightRotate(node);
        }
        // Right Right Case
        if (balance < -1 && medication.getId().compareTo(node.right.medication.getId()) > 0) {
            return leftRotate(node);
        }
        // Left Right Case
        if (balance > 1 && medication.getId().compareTo(node.left.medication.getId()) > 0) {
            node.left = leftRotate(node.left);
            return rightRotate(node);
        }
        // Right Left Case
        if (balance < -1 && medication.getId().compareTo(node.right.medication.getId()) < 0) {
            node.right = rightRotate(node.right);
            return leftRotate(node);
        }

        return node;
    }

    public synchronized boolean remove(String medicationId) {
        if (medicationId == null || !contains(medicationId)) return false;
        root = delete(root, medicationId);
        size--;
        return true;
    }

    private Node delete(Node node, String medicationId) {
        if (node == null) return null;

        int cmp = medicationId.compareTo(node.medication.getId());
        if (cmp < 0) {
            node.left = delete(node.left, medicationId);
        } else if (cmp > 0) {
            node.right = delete(node.right, medicationId);
        } else {
            if (node.left == null) return node.right;
            if (node.right == null) return node.left;
            Node minNode = findMin(node.right);
            node.medication = minNode.medication;
            node.right = delete(node.right, minNode.medication.getId());
        }

        if (node == null) return null;

        node.height = 1 + Math.max(height(node.left), height(node.right));
        int balance = getBalance(node);

        // Left Left Case
        if (balance > 1 && getBalance(node.left) >= 0) {
            return rightRotate(node);
        }
        // Left Right Case
        if (balance > 1 && getBalance(node.left) < 0) {
            node.left = leftRotate(node.left);
            return rightRotate(node);
        }
        // Right Right Case
        if (balance < -1 && getBalance(node.right) <= 0) {
            return leftRotate(node);
        }
        // Right Left Case
        if (balance < -1 && getBalance(node.right) > 0) {
            node.right = rightRotate(node.right);
            return leftRotate(node);
        }

        return node;
    }

    // Left rotation
    private Node leftRotate(Node z) {
        Node y = z.right;
        Node T2 = y.left;

        y.left = z;
        z.right = T2;

        z.height = 1 + Math.max(height(z.left), height(z.right));
        y.height = 1 + Math.max(height(y.left), height(y.right));

        return y;
    }

    // Right rotation
    private Node rightRotate(Node z) {
        Node y = z.left;
        Node T3 = y.right;

        y.right = z;
        z.left = T3;

        z.height = 1 + Math.max(height(z.left), height(z.right));
        y.height = 1 + Math.max(height(y.left), height(y.right));

        return y;
    }

    private int height(Node node) {
        return node == null ? 0 : node.height;
    }

    private int getBalance(Node node) {
        return node == null ? 0 : height(node.left) - height(node.right);
    }

    private Node findMin(Node node) {
        while (node.left != null) {
            node = node.left;
        }
        return node;
    }

    public synchronized Medication find(String medicationId) {
        return find(root, medicationId);
    }

    private Medication find(Node node, String medicationId) {
        if (node == null) return null;
        int cmp = medicationId.compareTo(node.medication.getId());
        if (cmp < 0) return find(node.left, medicationId);
        if (cmp > 0) return find(node.right, medicationId);
        return node.medication;
    }

    public synchronized boolean contains(String medicationId) {
        return find(medicationId) != null;
    }

    public synchronized List<Medication> getAllInOrder() {
        List<Medication> list = new ArrayList<>();
        inOrder(root, list);
        return list;
    }

    private void inOrder(Node node, List<Medication> list) {
        if (node == null) return;
        inOrder(node.left, list);
        list.add(node.medication);
        inOrder(node.right, list);
    }

    public synchronized List<Medication> searchByName(String nameQuery) {
        List<Medication> results = new ArrayList<>();
        searchByName(root, nameQuery.toLowerCase(), results);
        return results;
    }

    private void searchByName(Node node, String query, List<Medication> results) {
        if (node == null) return;
        searchByName(node.left, query, results);
        if (node.medication.getName().toLowerCase().contains(query)) {
            results.add(node.medication);
        }
        searchByName(node.right, query, results);
    }

    public synchronized List<Medication> getLowStock() {
        List<Medication> lowStock = new ArrayList<>();
        for (Medication m : getAllInOrder()) {
            if (m.getStock() <= m.getReorderThreshold()) {
                lowStock.add(m);
            }
        }
        return lowStock;
    }

    public synchronized List<Medication> getExpired() {
        List<Medication> expired = new ArrayList<>();
        for (Medication m : getAllInOrder()) {
            if (m.isExpired()) {
                expired.add(m);
            }
        }
        return expired;
    }

    public synchronized boolean updateStock(String medicationId, int delta) {
        Medication m = find(medicationId);
        if (m == null) return false;
        int newStock = m.getStock() + delta;
        if (newStock < 0) return false;
        m.setStock(newStock);
        return true;
    }

    public synchronized int size() {
        return size;
    }

    public synchronized void clear() {
        root = null;
        size = 0;
    }

    public synchronized boolean isEmpty() {
        return size == 0;
    }

    public synchronized int getTreeHeight() {
        return height(root);
    }

    public synchronized boolean isBalanced() {
        return checkBalanced(root);
    }

    private boolean checkBalanced(Node node) {
        if (node == null) return true;
        int balance = getBalance(node);
        if (Math.abs(balance) > 1) return false;
        return checkBalanced(node.left) && checkBalanced(node.right);
    }

    /**
     * Returns the balance factor of the root node for demonstration.
     */
    public synchronized int getRootBalanceFactor() {
        return getBalance(root);
    }
}
