package com.hospital.ui;

import com.hospital.ai.AIDecisionSupport;
import com.hospital.datastructures.DijkstraAlgorithm;
import com.hospital.model.*;
import com.hospital.service.*;

import javax.swing.*;
import javax.swing.border.*;
import java.awt.*;
import java.util.List;

public class DispatchPanel extends JPanel {
    private final DispatchService dispatchService;
    private final QueueManager queueManager;
    private JTextArea hospitalInfoArea;
    private JTextArea pathResultArea;
    private JComboBox<String> fromHospitalCombo;
    private JComboBox<String> toHospitalCombo;
    private JComboBox<String> patientCombo;
    private JTable ambulanceTable;
    private javax.swing.table.DefaultTableModel ambulanceModel;

    public DispatchPanel(DispatchService dispatchService, QueueManager queueManager) {
        this.dispatchService = dispatchService;
        this.queueManager = queueManager;
        setLayout(new BorderLayout(15, 15));
        setBackground(new Color(245, 247, 250));
        setBorder(new EmptyBorder(20, 20, 20, 20));

        add(createHeader(), BorderLayout.NORTH);
        add(createContent(), BorderLayout.CENTER);

        dispatchService.addListener(() -> SwingUtilities.invokeLater(this::refresh));
    }

    private JPanel createHeader() {
        JPanel header = new JPanel(new BorderLayout());
        header.setOpaque(false);

        JLabel title = new JLabel("Ambulance Dispatch & Hospital Network");
        title.setFont(new Font("Segoe UI", Font.BOLD, 24));
        title.setForeground(new Color(30, 41, 59));

        JLabel subtitle = new JLabel("Dijkstra shortest path algorithm for optimal hospital routing");
        subtitle.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        subtitle.setForeground(new Color(100, 116, 139));

        JPanel titlePanel = new JPanel(new GridLayout(2, 1, 0, 2));
        titlePanel.setOpaque(false);
        titlePanel.add(title);
        titlePanel.add(subtitle);

        header.add(titlePanel, BorderLayout.WEST);
        return header;
    }

    private JPanel createContent() {
        JPanel content = new JPanel(new GridLayout(1, 2, 15, 0));
        content.setOpaque(false);
        content.add(createNetworkPanel());
        content.add(createDispatchPanel());
        return content;
    }

    private JPanel createNetworkPanel() {
        JPanel panel = new JPanel(new BorderLayout(10, 10));
        panel.setBackground(Color.WHITE);
        panel.setBorder(BorderFactory.createCompoundBorder(
            BorderFactory.createLineBorder(new Color(226, 232, 240)),
            new EmptyBorder(15, 15, 15, 15)
        ));

        JLabel title = new JLabel("Hospital Network (Graph)");
        title.setFont(new Font("Segoe UI", Font.BOLD, 16));
        title.setForeground(new Color(30, 41, 59));
        panel.add(title, BorderLayout.NORTH);

        hospitalInfoArea = new JTextArea(10, 30);
        hospitalInfoArea.setFont(new Font("Consolas", Font.PLAIN, 12));
        hospitalInfoArea.setEditable(false);
        hospitalInfoArea.setBackground(new Color(250, 250, 250));
        hospitalInfoArea.setBorder(new EmptyBorder(10, 10, 10, 10));

        JScrollPane scroll = new JScrollPane(hospitalInfoArea);
        scroll.setBorder(BorderFactory.createEmptyBorder());
        panel.add(scroll, BorderLayout.CENTER);

        JPanel dijkstraPanel = new JPanel(new GridLayout(4, 2, 8, 8));
        dijkstraPanel.setOpaque(false);
        dijkstraPanel.setBorder(new EmptyBorder(10, 0, 0, 0));

        fromHospitalCombo = new JComboBox<>();
        toHospitalCombo = new JComboBox<>();
        styleCombo(fromHospitalCombo);
        styleCombo(toHospitalCombo);

        JButton calcPathBtn = new JButton("Calculate Shortest Path");
        calcPathBtn.setFont(new Font("Segoe UI", Font.BOLD, 12));
        calcPathBtn.setForeground(Color.WHITE);
        calcPathBtn.setBackground(new Color(139, 92, 246));
        calcPathBtn.setFocusPainted(false);
        calcPathBtn.setBorder(new EmptyBorder(8, 15, 8, 15));
        calcPathBtn.addActionListener(e -> calculateShortestPath());

        pathResultArea = new JTextArea(4, 25);
        pathResultArea.setFont(new Font("Consolas", Font.PLAIN, 12));
        pathResultArea.setEditable(false);
        pathResultArea.setLineWrap(true);
        pathResultArea.setBackground(new Color(245, 247, 250));
        pathResultArea.setBorder(new EmptyBorder(8, 8, 8, 8));

        dijkstraPanel.add(new JLabel("From Hospital:"));
        dijkstraPanel.add(fromHospitalCombo);
        dijkstraPanel.add(new JLabel("To Hospital:"));
        dijkstraPanel.add(toHospitalCombo);
        dijkstraPanel.add(calcPathBtn);
        dijkstraPanel.add(new JLabel(""));
        dijkstraPanel.add(new JLabel("Result:"));
        dijkstraPanel.add(new JScrollPane(pathResultArea));

        panel.add(dijkstraPanel, BorderLayout.SOUTH);
        return panel;
    }

    private JPanel createDispatchPanel() {
        JPanel panel = new JPanel(new BorderLayout(10, 10));
        panel.setBackground(Color.WHITE);
        panel.setBorder(BorderFactory.createCompoundBorder(
            BorderFactory.createLineBorder(new Color(226, 232, 240)),
            new EmptyBorder(15, 15, 15, 15)
        ));

        JLabel title = new JLabel("Ambulance Dispatch Operations");
        title.setFont(new Font("Segoe UI", Font.BOLD, 16));
        title.setForeground(new Color(30, 41, 59));
        panel.add(title, BorderLayout.NORTH);

        JPanel dispatchForm = new JPanel(new GridLayout(5, 2, 8, 8));
        dispatchForm.setOpaque(false);
        dispatchForm.setBorder(new EmptyBorder(0, 0, 15, 0));

        patientCombo = new JComboBox<>();
        styleCombo(patientCombo);

        JLabel latLabel = new JLabel("Ambulance Lat:");
        JTextField latField = new JTextField("6.9000");
        JLabel lonLabel = new JLabel("Ambulance Lon:");
        JTextField lonField = new JTextField("79.8700");

        styleField(latField);
        styleField(lonField);

        JButton dispatchBtn = new JButton("Dispatch Ambulance");
        dispatchBtn.setFont(new Font("Segoe UI", Font.BOLD, 13));
        dispatchBtn.setForeground(Color.WHITE);
        dispatchBtn.setBackground(new Color(239, 68, 68));
        dispatchBtn.setFocusPainted(false);
        dispatchBtn.setBorder(new EmptyBorder(10, 20, 10, 20));
        dispatchBtn.addActionListener(e -> {
            try {
                double lat = Double.parseDouble(latField.getText().trim());
                double lon = Double.parseDouble(lonField.getText().trim());
                dispatchPatient(lat, lon);
            } catch (NumberFormatException ex) {
                JOptionPane.showMessageDialog(this, "Invalid coordinates.", "Error", JOptionPane.ERROR_MESSAGE);
            }
        });

        dispatchForm.add(new JLabel("Select Patient:"));
        dispatchForm.add(patientCombo);
        dispatchForm.add(latLabel);
        dispatchForm.add(latField);
        dispatchForm.add(lonLabel);
        dispatchForm.add(lonField);
        JButton completeBtn = new JButton("Complete Dispatch");
        completeBtn.setFont(new Font("Segoe UI", Font.BOLD, 13));
        completeBtn.setForeground(Color.WHITE);
        completeBtn.setBackground(new Color(16, 185, 129));
        completeBtn.setFocusPainted(false);
        completeBtn.setBorder(new EmptyBorder(10, 20, 10, 20));
        completeBtn.addActionListener(e -> completeDispatch());

        dispatchForm.add(new JLabel(""));
        dispatchForm.add(dispatchBtn);
        dispatchForm.add(new JLabel(""));
        dispatchForm.add(completeBtn);

        panel.add(dispatchForm, BorderLayout.CENTER);

        String[] cols = {"ID", "Driver", "Status", "Patient", "Destination", "Dist (km)", "ETA (min)"};
        ambulanceModel = new javax.swing.table.DefaultTableModel(cols, 0) {
            @Override
            public boolean isCellEditable(int row, int column) { return false; }
        };
        ambulanceTable = new JTable(ambulanceModel);
        styleTable(ambulanceTable);

        JScrollPane scroll = new JScrollPane(ambulanceTable);
        scroll.setBorder(BorderFactory.createEmptyBorder());
        panel.add(scroll, BorderLayout.SOUTH);

        return panel;
    }

    private void styleCombo(JComboBox<String> combo) {
        combo.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        combo.setBorder(BorderFactory.createLineBorder(new Color(203, 213, 225)));
    }

    private void styleField(JTextField field) {
        field.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        field.setBorder(BorderFactory.createCompoundBorder(
            BorderFactory.createLineBorder(new Color(203, 213, 225)),
            new EmptyBorder(6, 10, 6, 10)
        ));
    }

    private void styleTable(JTable table) {
        table.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        table.setRowHeight(30);
        table.setSelectionBackground(new Color(66, 133, 244));
        table.setSelectionForeground(Color.WHITE);
        table.setShowGrid(true);
        table.setGridColor(new Color(226, 232, 240));
        javax.swing.table.JTableHeader h = table.getTableHeader();
        h.setFont(new Font("Segoe UI", Font.BOLD, 12));
        h.setBackground(new Color(241, 245, 249));
        h.setForeground(new Color(71, 85, 105));
    }

    private void calculateShortestPath() {
        String from = (String) fromHospitalCombo.getSelectedItem();
        String to = (String) toHospitalCombo.getSelectedItem();
        if (from == null || to == null || from.equals(to)) {
            pathResultArea.setText("Select different hospitals.");
            return;
        }

        String fromId = from.split(" ")[0];
        String toId = to.split(" ")[0];

        DijkstraAlgorithm.PathResult result = DijkstraAlgorithm.findShortestPath(
            dispatchService.getHospitalGraph(), fromId, toId);

        if (result == null) {
            pathResultArea.setText("No path found between these hospitals.");
        } else {
            pathResultArea.setText(String.format(
                "Shortest Path: %s\nDistance: %.1f km\nEst. Travel Time: %.0f minutes",
                String.join(" -> ", result.getPath()),
                result.getTotalDistance(),
                result.getEstimatedTimeMinutes()
            ));
        }
    }

    private void completeDispatch() {
        int selectedRow = ambulanceTable.getSelectedRow();
        if (selectedRow < 0) {
            JOptionPane.showMessageDialog(this, "Select an active ambulance to mark as complete.", "No Selection", JOptionPane.WARNING_MESSAGE);
            return;
        }
        String ambulanceId = (String) ambulanceModel.getValueAt(selectedRow, 0);
        dispatchService.completeDispatch(ambulanceId);
        JOptionPane.showMessageDialog(this, "Ambulance " + ambulanceId + " returned to base.", "Dispatch Complete", JOptionPane.INFORMATION_MESSAGE);
        refresh();
    }

    private void dispatchPatient(double lat, double lon) {
        String selected = (String) patientCombo.getSelectedItem();
        if (selected == null) {
            JOptionPane.showMessageDialog(this, "Select a patient to dispatch.", "No Patient", JOptionPane.WARNING_MESSAGE);
            return;
        }

        String patientId = selected.split(" ")[0];
        Patient patient = queueManager.getPatient(patientId);
        if (patient == null) {
            JOptionPane.showMessageDialog(this, "Patient not found.", "Error", JOptionPane.ERROR_MESSAGE);
            return;
        }

        DispatchService.DispatchResult result = dispatchService.dispatchAmbulance(patient, lat, lon);
        if (result.success) {
            JOptionPane.showMessageDialog(this,
                String.format("Ambulance dispatched!\nDriver: %s\nHospital: %s\nDistance: %.1f km\nETA: %.0f min",
                    result.ambulance.getDriverName(), result.hospital.getName(),
                    result.distanceKm, result.estimatedTimeMinutes),
                "Dispatch Successful", JOptionPane.INFORMATION_MESSAGE);
        } else {
            JOptionPane.showMessageDialog(this, result.message, "Dispatch Failed", JOptionPane.WARNING_MESSAGE);
        }
        refresh();
    }

    public void refresh() {
        fromHospitalCombo.removeAllItems();
        toHospitalCombo.removeAllItems();
        patientCombo.removeAllItems();

        StringBuilder info = new StringBuilder();
        info.append("Hospitals in Network:\n");
        info.append(String.format("%-6s %-25s %-8s %-8s %-8s%n", "ID", "Name", "Beds", "ICU", "Doctors"));
        info.append("-".repeat(55)).append("\n");

        for (Hospital h : dispatchService.getHospitalGraph().getAllHospitals()) {
            fromHospitalCombo.addItem(h.getId() + " - " + h.getName());
            toHospitalCombo.addItem(h.getId() + " - " + h.getName());
            info.append(String.format("%-6s %-25s %-8d %-8d %-8d%n",
                h.getId(), h.getName(), h.getAvailableBeds(), h.getAvailableICU(), h.getAvailableDoctors()));
        }

        info.append("\nRoad Connections:\n");
        for (java.util.Map.Entry<String, java.util.Map<String, Double>> entry :
                dispatchService.getHospitalGraph().getAdjacencyList().entrySet()) {
            for (java.util.Map.Entry<String, Double> conn : entry.getValue().entrySet()) {
                if (entry.getKey().compareTo(conn.getKey()) < 0) {
                    info.append(String.format("%s <-> %s  :  %.1f km%n", entry.getKey(), conn.getKey(), conn.getValue()));
                }
            }
        }

        hospitalInfoArea.setText(info.toString());
        hospitalInfoArea.setCaretPosition(0);

        for (Patient p : queueManager.getAllWaitingPatients()) {
            if (p.getSeverity().getPriorityValue() >= 4) {
                patientCombo.addItem(p.getId() + " - " + p.getName() + " (" + p.getSeverity() + ")");
            }
        }

        ambulanceModel.setRowCount(0);
        for (Ambulance a : dispatchService.getAllAmbulances()) {
            ambulanceModel.addRow(new Object[]{
                a.getId(), a.getDriverName(), a.getStatus().getLabel(),
                a.getAssignedPatient() != null ? a.getAssignedPatient().getName() : "-",
                a.getDestinationHospital() != null ? a.getDestinationHospital().getName() : "-",
                String.format("%.1f", a.getDistanceKm()),
                String.format("%.0f", a.getEstimatedArrivalMinutes())
            });
        }
    }
}
