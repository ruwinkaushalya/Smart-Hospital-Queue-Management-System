package com.hospital.ui;

import com.hospital.ai.AIDecisionSupport;
import com.hospital.model.*;
import com.hospital.service.*;

import javax.swing.*;
import javax.swing.border.*;
import java.awt.*;
import java.util.List;

public class DashboardPanel extends JPanel {
    private final QueueManager queueManager;
    private final DispatchService dispatchService;

    private JLabel emergencyLabel;
    private JLabel normalLabel;
    private JLabel treatedLabel;
    private JLabel avgWaitLabel;
    private JLabel statusLabel;
    private JLabel ambulancesLabel;
    private JLabel hospitalsLabel;
    private JTextArea recentActivityArea;
    private JPanel statsGrid;

    public DashboardPanel(QueueManager queueManager, DispatchService dispatchService) {
        this.queueManager = queueManager;
        this.dispatchService = dispatchService;
        setLayout(new BorderLayout(15, 15));
        setBackground(new Color(245, 247, 250));
        setBorder(new EmptyBorder(20, 20, 20, 20));

        add(createHeader(), BorderLayout.NORTH);
        add(createContent(), BorderLayout.CENTER);
        refresh();
    }

    private JPanel createHeader() {
        JPanel header = new JPanel(new BorderLayout());
        header.setOpaque(false);

        JLabel title = new JLabel("System Dashboard");
        title.setFont(new Font("Segoe UI", Font.BOLD, 24));
        title.setForeground(new Color(30, 41, 59));

        JLabel subtitle = new JLabel("Real-time overview of hospital queue and dispatch operations");
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
        JPanel content = new JPanel(new BorderLayout(15, 15));
        content.setOpaque(false);

        statsGrid = new JPanel(new GridLayout(2, 4, 15, 15));
        statsGrid.setOpaque(false);

        emergencyLabel = createStatCard("Emergency Patients", "0", new Color(239, 68, 68), "🚨");
        normalLabel = createStatCard("Normal Patients", "0", new Color(59, 130, 246), "🏥");
        treatedLabel = createStatCard("Patients Treated", "0", new Color(16, 185, 129), "✅");
        avgWaitLabel = createStatCard("Avg Wait Time", "0 min", new Color(245, 158, 11), "⏱");
        statusLabel = createStatCard("Queue Status", "NORMAL", new Color(99, 102, 241), "📊");
        ambulancesLabel = createStatCard("Available Ambulances", "0", new Color(236, 72, 153), "🚑");
        hospitalsLabel = createStatCard("Active Hospitals", "0", new Color(20, 184, 166), "🏨");
        JLabel throughputLabel = createStatCard("Throughput", "0/hr", new Color(139, 92, 246), "📈");

        statsGrid.add(emergencyLabel);
        statsGrid.add(normalLabel);
        statsGrid.add(treatedLabel);
        statsGrid.add(avgWaitLabel);
        statsGrid.add(statusLabel);
        statsGrid.add(ambulancesLabel);
        statsGrid.add(hospitalsLabel);
        statsGrid.add(throughputLabel);

        content.add(statsGrid, BorderLayout.NORTH);

        JPanel bottomPanel = new JPanel(new GridLayout(1, 2, 15, 0));
        bottomPanel.setOpaque(false);
        bottomPanel.add(createRecentActivityPanel());
        bottomPanel.add(createQuickActionsPanel());
        content.add(bottomPanel, BorderLayout.CENTER);

        return content;
    }

    private JLabel createStatCard(String title, String value, Color color, String icon) {
        JLabel label = new JLabel(
            String.format("<html><div style='padding: 15px; background: %s; border-radius: 8px;'>" +
                "<div style='font-size: 24px; color: white; margin-bottom: 5px;'>%s %s</div>" +
                "<div style='font-size: 11px; color: rgba(255,255,255,0.8); text-transform: uppercase;'>%s</div></div></html>",
                toHex(color), value, icon, title)
        );
        label.setOpaque(true);
        label.setBackground(color);
        label.setBorder(new EmptyBorder(10, 15, 10, 15));
        label.setHorizontalAlignment(SwingConstants.CENTER);
        return label;
    }

    private JPanel createRecentActivityPanel() {
        JPanel panel = new JPanel(new BorderLayout(10, 10));
        panel.setBackground(Color.WHITE);
        panel.setBorder(createCardBorder("Recent Activity"));

        recentActivityArea = new JTextArea(8, 30);
        recentActivityArea.setFont(new Font("Consolas", Font.PLAIN, 12));
        recentActivityArea.setEditable(false);
        recentActivityArea.setBackground(new Color(250, 250, 250));
        recentActivityArea.setBorder(new EmptyBorder(10, 10, 10, 10));

        JScrollPane scroll = new JScrollPane(recentActivityArea);
        scroll.setBorder(BorderFactory.createEmptyBorder());
        panel.add(scroll, BorderLayout.CENTER);

        return panel;
    }

    private JPanel createQuickActionsPanel() {
        JPanel panel = new JPanel(new BorderLayout(10, 10));
        panel.setBackground(Color.WHITE);
        panel.setBorder(createCardBorder("Quick Actions"));

        JPanel buttonsPanel = new JPanel(new GridLayout(4, 1, 10, 10));
        buttonsPanel.setOpaque(false);
        buttonsPanel.setBorder(new EmptyBorder(15, 15, 15, 15));

        JButton processBtn = createActionButton("Process Next Patient", new Color(16, 185, 129));
        processBtn.addActionListener(e -> {
            Patient p = queueManager.processNextPatient();
            if (p != null) {
                JOptionPane.showMessageDialog(this,
                    "Processed: " + p.getName() + " (" + p.getSeverity() + ")",
                    "Patient Processed", JOptionPane.INFORMATION_MESSAGE);
                refresh();
            } else {
                JOptionPane.showMessageDialog(this, "No patients in queue", "Empty Queue", JOptionPane.WARNING_MESSAGE);
            }
        });

        JButton refreshBtn = createActionButton("Refresh Dashboard", new Color(59, 130, 246));
        refreshBtn.addActionListener(e -> refresh());

        JButton simulateBtn = createActionButton("Simulate Emergency Arrival", new Color(239, 68, 68));
        simulateBtn.addActionListener(e -> {
            Patient sim = new Patient("Emergency Patient " + (queueManager.getTotalWaiting() + 1),
                (int)(Math.random() * 60) + 18,
                "077-" + (int)(Math.random() * 9000000 + 1000000),
                "Simulated emergency case",
                Math.random() > 0.5 ? Patient.Severity.CRITICAL : Patient.Severity.HIGH);
            queueManager.registerPatient(sim);
            JOptionPane.showMessageDialog(this, "Simulated emergency patient added!", "Simulation", JOptionPane.INFORMATION_MESSAGE);
            refresh();
        });

        JButton clearBtn = createActionButton("Clear All Data", new Color(100, 116, 139));
        clearBtn.addActionListener(e -> {
            int confirm = JOptionPane.showConfirmDialog(this, "Clear all patient data?", "Confirm", JOptionPane.YES_NO_OPTION);
            if (confirm == JOptionPane.YES_OPTION) {
                queueManager.clear();
                refresh();
            }
        });

        buttonsPanel.add(processBtn);
        buttonsPanel.add(simulateBtn);
        buttonsPanel.add(refreshBtn);
        buttonsPanel.add(clearBtn);

        panel.add(buttonsPanel, BorderLayout.CENTER);
        return panel;
    }

    private JButton createActionButton(String text, Color bg) {
        JButton btn = new JButton(text);
        btn.setFont(new Font("Segoe UI", Font.BOLD, 13));
        btn.setForeground(Color.WHITE);
        btn.setBackground(bg);
        btn.setFocusPainted(false);
        btn.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btn.setBorder(new EmptyBorder(12, 20, 12, 20));
        return btn;
    }

    private Border createCardBorder(String title) {
        return BorderFactory.createCompoundBorder(
            BorderFactory.createLineBorder(new Color(226, 232, 240)),
            BorderFactory.createTitledBorder(
                BorderFactory.createEmptyBorder(10, 10, 10, 10),
                title,
                TitledBorder.LEFT,
                TitledBorder.TOP,
                new Font("Segoe UI", Font.BOLD, 14),
                new Color(30, 41, 59)
            )
        );
    }

    private String toHex(Color c) {
        return String.format("#%02x%02x%02x", c.getRed(), c.getGreen(), c.getBlue());
    }

    public void refresh() {
        AIDecisionSupport.QueueAnalytics analytics = queueManager.getAnalytics();

        emergencyLabel.setText(String.format(
            "<html><div style='padding: 15px; background: #ef4444; border-radius: 8px;'>" +
            "<div style='font-size: 24px; color: white; margin-bottom: 5px;'>%d 🚨</div>" +
            "<div style='font-size: 11px; color: rgba(255,255,255,0.8); text-transform: uppercase;'>Emergency Patients</div></div></html>",
            queueManager.getEmergencyCount()));

        normalLabel.setText(String.format(
            "<html><div style='padding: 15px; background: #3b82f6; border-radius: 8px;'>" +
            "<div style='font-size: 24px; color: white; margin-bottom: 5px;'>%d 🏥</div>" +
            "<div style='font-size: 11px; color: rgba(255,255,255,0.8); text-transform: uppercase;'>Normal Patients</div></div></html>",
            queueManager.getNormalCount()));

        treatedLabel.setText(String.format(
            "<html><div style='padding: 15px; background: #10b981; border-radius: 8px;'>" +
            "<div style='font-size: 24px; color: white; margin-bottom: 5px;'>%d ✅</div>" +
            "<div style='font-size: 11px; color: rgba(255,255,255,0.8); text-transform: uppercase;'>Patients Treated</div></div></html>",
            queueManager.getTreatedCount()));

        avgWaitLabel.setText(String.format(
            "<html><div style='padding: 15px; background: #f59e0b; border-radius: 8px;'>" +
            "<div style='font-size: 24px; color: white; margin-bottom: 5px;'>%.0f min ⏱</div>" +
            "<div style='font-size: 11px; color: rgba(255,255,255,0.8); text-transform: uppercase;'>Avg Wait Time</div></div></html>",
            queueManager.getAverageWaitTime()));

        Color statusColor = analytics.status.contains("CRITICAL") ? new Color(239, 68, 68)
                          : analytics.status.contains("HIGH") ? new Color(245, 158, 11)
                          : analytics.status.contains("MODERATE") ? new Color(59, 130, 246)
                          : new Color(16, 185, 129);

        statusLabel.setText(String.format(
            "<html><div style='padding: 15px; background: %s; border-radius: 8px;'>" +
            "<div style='font-size: 18px; color: white; margin-bottom: 5px;'>%s 📊</div>" +
            "<div style='font-size: 11px; color: rgba(255,255,255,0.8); text-transform: uppercase;'>Queue Status</div></div></html>",
            toHex(statusColor), analytics.status));
        statusLabel.setBackground(statusColor);

        ambulancesLabel.setText(String.format(
            "<html><div style='padding: 15px; background: #ec4899; border-radius: 8px;'>" +
            "<div style='font-size: 24px; color: white; margin-bottom: 5px;'>%d 🚑</div>" +
            "<div style='font-size: 11px; color: rgba(255,255,255,0.8); text-transform: uppercase;'>Available Ambulances</div></div></html>",
            dispatchService.getAvailableAmbulances().size()));

        hospitalsLabel.setText(String.format(
            "<html><div style='padding: 15px; background: #14b8a6; border-radius: 8px;'>" +
            "<div style='font-size: 24px; color: white; margin-bottom: 5px;'>%d 🏨</div>" +
            "<div style='font-size: 11px; color: rgba(255,255,255,0.8); text-transform: uppercase;'>Active Hospitals</div></div></html>",
            queueManager.getHospitals().size()));

        StringBuilder activity = new StringBuilder();
        List<Patient> waiting = queueManager.getAllWaitingPatients();
        if (waiting.isEmpty()) {
            activity.append("No patients currently waiting.\n");
        } else {
            activity.append("Top Priority Patients:\n");
            activity.append(String.format("%-10s %-20s %-12s %-15s%n", "ID", "Name", "Severity", "Wait Time"));
            activity.append("-".repeat(60)).append("\n");
            int count = 0;
            for (Patient p : waiting) {
                if (count++ >= 10) break;
                activity.append(String.format("%-10s %-20s %-12s %d min%n",
                    p.getId(), p.getName(), p.getSeverity().name(), p.getEstimatedWaitTimeMinutes()));
            }
        }

        List<Patient> treated = queueManager.getTreatedPatients();
        if (!treated.isEmpty()) {
            activity.append("\nRecently Treated:\n");
            int tCount = 0;
            for (int i = treated.size() - 1; i >= 0 && tCount < 5; i--, tCount++) {
                Patient p = treated.get(i);
                activity.append(String.format("%s - %s (%s) - Waited %d min\n",
                    p.getId(), p.getName(), p.getSeverity().name(), p.getWaitingTimeMinutes()));
            }
        }

        recentActivityArea.setText(activity.toString());
    }
}
