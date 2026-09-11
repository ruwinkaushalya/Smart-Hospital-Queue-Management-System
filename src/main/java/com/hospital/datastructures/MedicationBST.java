package com.hospital.datastructures;

import com.hospital.model.Medication;

import java.util.ArrayList;
import java.util.List;

public class MedicationBST {
    private Node root;
    private int size;

    private static class Node {
        Medication medication;
        Node left;
        Node right;

        Node(Medication medication) {
            this.medication = medication;
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
        return node;
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

    public synchronized int getTreeHeight() {
        return height(root);
    }

    private int height(Node node) {
        if (node == null) return 0;
        return 1 + Math.max(height(node.left), height(node.right));
    }
}
