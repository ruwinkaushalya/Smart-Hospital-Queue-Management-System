package com.hospital.ui;

import com.hospital.ai.AIDecisionSupport;
import com.hospital.model.*;
import com.hospital.service.*;

import javax.swing.*;
import javax.swing.border.*;
import java.awt.*;
import java.util.List;

public class AnalyticsPanel extends JPanel {
    private final QueueManager queueManager;
    private final DispatchService dispatchService;
    private JTextArea analyticsArea;
    private JTextArea hospitalLoadArea;
    private JTextArea aiInsightsArea;
    private JPanel severityChartPanel;
    private JPanel waitTimeChartPanel;

    public AnalyticsPanel(QueueManager queueManager, DispatchService dispatchService) {
        this.queueManager = queueManager;
        this.dispatchService = dispatchService;
        setLayout(new BorderLayout(15, 15));
        setBackground(new Color(245, 247, 250));
        setBorder(new EmptyBorder(20, 20, 20, 20));

        add(createHeader(), BorderLayout.NORTH);
        add(createContent(), BorderLayout.CENTER);
    }

    private JPanel createHeader() {
        JPanel header = new JPanel(new BorderLayout());
        header.setOpaque(false);

        JLabel title = new JLabel("AI Analytics & Insights");
        title.setFont(new Font("Segoe UI", Font.BOLD, 24));
        title.setForeground(new Color(30, 41, 59));

        JLabel subtitle = new JLabel("Real-time analytics powered by AI decision support algorithms");
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
        JPanel content = new JPanel(new GridLayout(2, 2, 15, 15));
        content.setOpaque(false);

        content.add(createQueueStatsPanel());
        content.add(createSeverityChartPanel());
        content.add(createHospitalLoadPanel());
        content.add(createAiInsightsPanel());

        return content;
    }

    private JPanel createQueueStatsPanel() {
        JPanel panel = new JPanel(new BorderLayout(10, 10));
        panel.setBackground(Color.WHITE);
        panel.setBorder(BorderFactory.createCompoundBorder(
            BorderFactory.createLineBorder(new Color(226, 232, 240)),
            new EmptyBorder(15, 15, 15, 15)
        ));

        JLabel title = new JLabel("Queue Statistics");
        title.setFont(new Font("Segoe UI", Font.BOLD, 14));
        title.setForeground(new Color(30, 41, 59));
        panel.add(title, BorderLayout.NORTH);

        analyticsArea = new JTextArea(10, 30);
        analyticsArea.setFont(new Font("Consolas", Font.PLAIN, 12));
        analyticsArea.setEditable(false);
        analyticsArea.setBackground(new Color(250, 250, 250));
        analyticsArea.setBorder(new EmptyBorder(10, 10, 10, 10));

        JScrollPane scroll = new JScrollPane(analyticsArea);
        scroll.setBorder(BorderFactory.createEmptyBorder());
        panel.add(scroll, BorderLayout.CENTER);

        return panel;
    }

    private JPanel createSeverityChartPanel() {
        JPanel panel = new JPanel(new BorderLayout(10, 10));
        panel.setBackground(Color.WHITE);
        panel.setBorder(BorderFactory.createCompoundBorder(
            BorderFactory.createLineBorder(new Color(226, 232, 240)),
            new EmptyBorder(15, 15, 15, 15)
        ));

        JLabel title = new JLabel("Severity Distribution");
        title.setFont(new Font("Segoe UI", Font.BOLD, 14));
        title.setForeground(new Color(30, 41, 59));
        panel.add(title, BorderLayout.NORTH);

        severityChartPanel = new JPanel() {
            @Override
            protected void paintComponent(Graphics g) {
                super.paintComponent(g);
                drawSeverityBars(g);
            }
        };
        severityChartPanel.setBackground(Color.WHITE);
        panel.add(severityChartPanel, BorderLayout.CENTER);

        return panel;
    }

    private void drawSeverityBars(Graphics g) {
        AIDecisionSupport.QueueAnalytics analytics = queueManager.getAnalytics();
        int total = Math.max(analytics.totalWaiting, 1);

        int[] counts = { analytics.criticalCount, analytics.highCount, analytics.moderateCount,
                         analytics.lowCount };
        Color[] colors = { new Color(239, 68, 68), new Color(245, 158, 11),
                           new Color(59, 130, 246), new Color(16, 185, 129) };
        String[] labels = { "Critical", "High", "Moderate", "Low/Routine" };

        int barWidth = 40;
        int maxBarHeight = severityChartPanel.getHeight() - 60;
        int startX = 30;
        int baseY = severityChartPanel.getHeight() - 40;

        for (int i = 0; i < counts.length; i++) {
            int barHeight = (int) ((counts[i] / (double) total) * maxBarHeight);
            int x = startX + i * (barWidth + 30);

            g.setColor(colors[i]);
            g.fillRect(x, baseY - barHeight, barWidth, barHeight);
            g.setColor(Color.DARK_GRAY);
            g.drawRect(x, baseY - barHeight, barWidth, barHeight);

            g.setFont(new Font("Segoe UI", Font.BOLD, 11));
            g.drawString(labels[i], x, baseY + 18);
            g.drawString(String.valueOf(counts[i]), x + 10, baseY - barHeight - 5);
        }
    }

    private JPanel createHospitalLoadPanel() {
        JPanel panel = new JPanel(new BorderLayout(10, 10));
        panel.setBackground(Color.WHITE);
        panel.setBorder(BorderFactory.createCompoundBorder(
            BorderFactory.createLineBorder(new Color(226, 232, 240)),
            new EmptyBorder(15, 15, 15, 15)
        ));

        JLabel title = new JLabel("Hospital Load & Capacity");
        title.setFont(new Font("Segoe UI", Font.BOLD, 14));
        title.setForeground(new Color(30, 41, 59));
        panel.add(title, BorderLayout.NORTH);

        hospitalLoadArea = new JTextArea(8, 30);
        hospitalLoadArea.setFont(new Font("Consolas", Font.PLAIN, 12));
        hospitalLoadArea.setEditable(false);
        hospitalLoadArea.setBackground(new Color(250, 250, 250));
        hospitalLoadArea.setBorder(new EmptyBorder(10, 10, 10, 10));

        JScrollPane scroll = new JScrollPane(hospitalLoadArea);
        scroll.setBorder(BorderFactory.createEmptyBorder());
        panel.add(scroll, BorderLayout.CENTER);

        return panel;
    }

    private JPanel createAiInsightsPanel() {
        JPanel panel = new JPanel(new BorderLayout(10, 10));
        panel.setBackground(Color.WHITE);
        panel.setBorder(BorderFactory.createCompoundBorder(
            BorderFactory.createLineBorder(new Color(226, 232, 240)),
            new EmptyBorder(15, 15, 15, 15)
        ));

        JLabel title = new JLabel("🤖 AI Insights & Recommendations");
        title.setFont(new Font("Segoe UI", Font.BOLD, 14));
        title.setForeground(new Color(139, 92, 246));
        panel.add(title, BorderLayout.NORTH);

        aiInsightsArea = new JTextArea(10, 30);
        aiInsightsArea.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        aiInsightsArea.setEditable(false);
        aiInsightsArea.setLineWrap(true);
        aiInsightsArea.setWrapStyleWord(true);
        aiInsightsArea.setBackground(new Color(250, 250, 250));
        aiInsightsArea.setBorder(new EmptyBorder(10, 10, 10, 10));

        JScrollPane scroll = new JScrollPane(aiInsightsArea);
        scroll.setBorder(BorderFactory.createEmptyBorder());
        panel.add(scroll, BorderLayout.CENTER);

        return panel;
    }

    public void refresh() {
        AIDecisionSupport.QueueAnalytics analytics = queueManager.getAnalytics();

        StringBuilder stats = new StringBuilder();
        stats.append("Queue Performance Metrics:\n");
        stats.append("-".repeat(40)).append("\n");
        stats.append(String.format("Total Waiting:       %d%n", analytics.totalWaiting));
        stats.append(String.format("Critical Cases:      %d%n", analytics.criticalCount));
        stats.append(String.format("High Priority:       %d%n", analytics.highCount));
        stats.append(String.format("Moderate:            %d%n", analytics.moderateCount));
        stats.append(String.format("Low/Routine:         %d%n", analytics.lowCount));
        stats.append(String.format("Avg Wait Time:       %.1f min%n", analytics.avgWaitTime));
        stats.append(String.format("Max Wait Time:       %.1f min%n", analytics.maxWaitTime));
        stats.append(String.format("Total Treated:       %.0f%n", analytics.throughput));
        stats.append(String.format("Critical Ratio:      %.1f%%%n", analytics.criticalRatio * 100));
        stats.append(String.format("System Status:       %s%n", analytics.status));
        stats.append("\n");

        List<Patient> emergency = queueManager.getEmergencyQueue();
        if (!emergency.isEmpty()) {
            stats.append("Top Emergency Patients:\n");
            for (Patient p : emergency.subList(0, Math.min(5, emergency.size()))) {
                stats.append(String.format("  %s - %s (%.2f AI Score)%n", p.getId(), p.getName(), p.getAiPriorityScore()));
            }
        }

        analyticsArea.setText(stats.toString());
        analyticsArea.setCaretPosition(0);

        StringBuilder load = new StringBuilder();
        load.append("Hospital Load Analysis:\n");
        load.append("-".repeat(50)).append("\n");
        load.append(String.format("%-25s %-8s %-8s %-8s%n", "Hospital", "Load %", "Beds", "ICU"));
        load.append("-".repeat(50)).append("\n");

        for (Hospital h : queueManager.getHospitals()) {
            double loadPct = h.getLoadFactor() * 100;
            String status = loadPct > 90 ? "OVERLOADED" : loadPct > 70 ? "HIGH" : loadPct > 40 ? "MODERATE" : "NORMAL";
            load.append(String.format("%-25s %-8.1f %-8d %-8d  [%s]%n",
                h.getName(), loadPct, h.getAvailableBeds(), h.getAvailableICU(), status));
        }

        hospitalLoadArea.setText(load.toString());
        hospitalLoadArea.setCaretPosition(0);

        StringBuilder insights = new StringBuilder();
        insights.append("AI Decision Support Analysis:\n");
        insights.append("-".repeat(45)).append("\n\n");

        if (analytics.criticalRatio > 0.5) {
            insights.append("⚠️ ALERT: High critical patient ratio detected.\n");
            insights.append("   Recommend activating additional emergency staff.\n\n");
        }

        if (analytics.avgWaitTime > 60) {
            insights.append("⚠️ ALERT: Average wait time exceeds 60 minutes.\n");
            insights.append("   Consider redirecting non-urgent cases to clinics.\n\n");
        }

        if (analytics.totalWaiting > 0) {
            java.util.List<Patient> allWaiting = queueManager.getAllWaitingPatients();
            Patient next = allWaiting.isEmpty() ? null : allWaiting.get(0);
            if (next != null) {
                insights.append(String.format("Next Patient: %s (%s)%n", next.getName(), next.getSeverity()));
                insights.append(String.format("Predicted Wait: %d minutes%n", next.getEstimatedWaitTimeMinutes()));
                insights.append(String.format("AI Priority Score: %.2f%n%n", next.getAiPriorityScore()));
            }
        }

        insights.append("Optimization Recommendations:\n");
        insights.append("-".repeat(30)).append("\n");
        insights.append(String.format("1. Queue throughput: %.0f patients processed%n", analytics.throughput));
        insights.append("2. Priority Queue ensures O(log n) emergency insertions%n");
        insights.append("3. Circular Queue handles O(1) normal patient enqueue/dequeue%n");
        insights.append("4. Dijkstra's Algorithm finds O(E log V) shortest hospital paths%n");

        aiInsightsArea.setText(insights.toString());
        aiInsightsArea.setCaretPosition(0);

        severityChartPanel.repaint();
    }

    }
