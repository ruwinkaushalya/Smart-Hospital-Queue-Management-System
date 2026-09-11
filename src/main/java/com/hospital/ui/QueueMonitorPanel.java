package com.hospital.ui;

import com.hospital.model.Patient;
import com.hospital.service.QueueManager;

import javax.swing.*;
import javax.swing.border.*;
import javax.swing.table.*;
import java.awt.*;
import java.util.List;

public class QueueMonitorPanel extends JPanel {
    private final QueueManager queueManager;
    private JTable emergencyTable;
    private JTable normalTable;
    private DefaultTableModel emergencyModel;
    private DefaultTableModel normalModel;
    private JTextField searchField;
    private JComboBox<String> filterCombo;
    private JLabel summaryLabel;

    public QueueMonitorPanel(QueueManager queueManager) {
        this.queueManager = queueManager;
        setLayout(new BorderLayout(15, 15));
        setBackground(new Color(245, 247, 250));
        setBorder(new EmptyBorder(20, 20, 20, 20));

        add(createHeader(), BorderLayout.NORTH);
        add(createContent(), BorderLayout.CENTER);

        queueManager.addListener(() -> SwingUtilities.invokeLater(this::refresh));
    }

    private JPanel createHeader() {
        JPanel header = new JPanel(new BorderLayout());
        header.setOpaque(false);

        JLabel title = new JLabel("Live Queue Monitor");
        title.setFont(new Font("Segoe UI", Font.BOLD, 24));
        title.setForeground(new Color(30, 41, 59));

        JLabel subtitle = new JLabel("Real-time view of emergency and normal patient queues");
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

        content.add(createToolbar(), BorderLayout.NORTH);

        JPanel tablesPanel = new JPanel(new GridLayout(1, 2, 15, 0));
        tablesPanel.setOpaque(false);
        tablesPanel.add(createEmergencyTablePanel());
        tablesPanel.add(createNormalTablePanel());

        content.add(tablesPanel, BorderLayout.CENTER);
        content.add(createSummaryPanel(), BorderLayout.SOUTH);

        return content;
    }

    private JPanel createToolbar() {
        JPanel toolbar = new JPanel(new FlowLayout(FlowLayout.LEFT, 10, 5));
        toolbar.setOpaque(false);

        searchField = new JTextField(20);
        searchField.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        searchField.setBorder(BorderFactory.createCompoundBorder(
            BorderFactory.createLineBorder(new Color(203, 213, 225)),
            new EmptyBorder(6, 10, 6, 10)
        ));
        searchField.setToolTipText("Search by name or ID");

        filterCombo = new JComboBox<>(new String[]{"All Severities", "Critical", "High", "Moderate", "Low", "Routine"});
        filterCombo.setFont(new Font("Segoe UI", Font.PLAIN, 13));

        JButton searchBtn = new JButton("Search / Filter");
        searchBtn.setFont(new Font("Segoe UI", Font.BOLD, 12));
        searchBtn.setForeground(Color.WHITE);
        searchBtn.setBackground(new Color(59, 130, 246));
        searchBtn.setFocusPainted(false);
        searchBtn.setBorder(new EmptyBorder(6, 15, 6, 15));
        searchBtn.addActionListener(e -> refresh());

        JButton refreshBtn = new JButton("Refresh");
        refreshBtn.setFont(new Font("Segoe UI", Font.BOLD, 12));
        refreshBtn.setForeground(new Color(100, 116, 139));
        refreshBtn.setBackground(new Color(241, 245, 249));
        refreshBtn.setFocusPainted(false);
        refreshBtn.setBorder(new EmptyBorder(6, 15, 6, 15));
        refreshBtn.addActionListener(e -> refresh());

        JButton processBtn = new JButton("Process Next Patient");
        processBtn.setFont(new Font("Segoe UI", Font.BOLD, 12));
        processBtn.setForeground(Color.WHITE);
        processBtn.setBackground(new Color(16, 185, 129));
        processBtn.setFocusPainted(false);
        processBtn.setBorder(new EmptyBorder(6, 15, 6, 15));
        processBtn.addActionListener(e -> {
            Patient p = queueManager.processNextPatient();
            if (p != null) {
                JOptionPane.showMessageDialog(this,
                    "Processed: " + p.getName() + " (" + p.getSeverity() + ")",
                    "Patient Processed", JOptionPane.INFORMATION_MESSAGE);
            } else {
                JOptionPane.showMessageDialog(this, "No patients in queue.", "Empty Queue", JOptionPane.WARNING_MESSAGE);
            }
            refresh();
        });

        toolbar.add(new JLabel("Search:"));
        toolbar.add(searchField);
        toolbar.add(new JLabel("Filter:"));
        toolbar.add(filterCombo);
        toolbar.add(searchBtn);
        toolbar.add(refreshBtn);
        toolbar.add(processBtn);

        return toolbar;
    }

    private JPanel createEmergencyTablePanel() {
        JPanel panel = new JPanel(new BorderLayout(10, 10));
        panel.setBackground(Color.WHITE);
        panel.setBorder(BorderFactory.createCompoundBorder(
            BorderFactory.createLineBorder(new Color(226, 232, 240)),
            new EmptyBorder(15, 15, 15, 15)
        ));

        JLabel title = new JLabel("🚨 Emergency Queue (Priority)");
        title.setFont(new Font("Segoe UI", Font.BOLD, 14));
        title.setForeground(new Color(239, 68, 68));
        panel.add(title, BorderLayout.NORTH);

        String[] columns = {"ID", "Name", "Age", "Severity", "Symptoms", "Wait (min)", "AI Score"};
        emergencyModel = new DefaultTableModel(columns, 0) {
            @Override
            public boolean isCellEditable(int row, int column) { return false; }
        };

        emergencyTable = new JTable(emergencyModel);
        styleTable(emergencyTable);

        JScrollPane scroll = new JScrollPane(emergencyTable);
        scroll.setBorder(BorderFactory.createEmptyBorder());
        panel.add(scroll, BorderLayout.CENTER);

        return panel;
    }

    private JPanel createNormalTablePanel() {
        JPanel panel = new JPanel(new BorderLayout(10, 10));
        panel.setBackground(Color.WHITE);
        panel.setBorder(BorderFactory.createCompoundBorder(
            BorderFactory.createLineBorder(new Color(226, 232, 240)),
            new EmptyBorder(15, 15, 15, 15)
        ));

        JLabel title = new JLabel("🏥 Normal Queue (FIFO)");
        title.setFont(new Font("Segoe UI", Font.BOLD, 14));
        title.setForeground(new Color(59, 130, 246));
        panel.add(title, BorderLayout.NORTH);

        String[] columns = {"ID", "Name", "Age", "Severity", "Symptoms", "Wait (min)", "AI Score"};
        normalModel = new DefaultTableModel(columns, 0) {
            @Override
            public boolean isCellEditable(int row, int column) { return false; }
        };

        normalTable = new JTable(normalModel);
        styleTable(normalTable);

        JScrollPane scroll = new JScrollPane(normalTable);
        scroll.setBorder(BorderFactory.createEmptyBorder());
        panel.add(scroll, BorderLayout.CENTER);

        return panel;
    }

    private JPanel createSummaryPanel() {
        JPanel panel = new JPanel(new FlowLayout(FlowLayout.LEFT, 20, 5));
        panel.setBackground(new Color(30, 41, 59));
        panel.setBorder(new EmptyBorder(10, 15, 10, 15));

        summaryLabel = new JLabel("Loading...");
        summaryLabel.setFont(new Font("Segoe UI", Font.BOLD, 13));
        summaryLabel.setForeground(Color.WHITE);
        panel.add(summaryLabel);

        return panel;
    }

    private void styleTable(JTable table) {
        table.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        table.setRowHeight(32);
        table.setSelectionBackground(new Color(66, 133, 244));
        table.setSelectionForeground(Color.WHITE);
        table.setShowGrid(true);
        table.setGridColor(new Color(226, 232, 240));
        table.setIntercellSpacing(new Dimension(0, 0));

        JTableHeader header = table.getTableHeader();
        header.setFont(new Font("Segoe UI", Font.BOLD, 12));
        header.setBackground(new Color(241, 245, 249));
        header.setForeground(new Color(71, 85, 105));
        header.setBorder(BorderFactory.createMatteBorder(0, 0, 2, 0, new Color(203, 213, 225)));
        header.setPreferredSize(new Dimension(0, 36));

        DefaultTableCellRenderer centerRenderer = new DefaultTableCellRenderer();
        centerRenderer.setHorizontalAlignment(SwingConstants.CENTER);

        for (int i = 0; i < table.getColumnCount(); i++) {
            table.getColumnModel().getColumn(i).setCellRenderer(centerRenderer);
        }
    }

    public void refresh() {
        String searchTerm = searchField.getText().trim().toLowerCase();
        String filter = (String) filterCombo.getSelectedItem();

        emergencyModel.setRowCount(0);
        normalModel.setRowCount(0);

        List<Patient> emergencyPatients = queueManager.getEmergencyQueue();
        List<Patient> normalPatients = queueManager.getNormalQueue();

        int totalEmergency = 0;
        int totalNormal = 0;

        for (Patient p : emergencyPatients) {
            if (matchesFilter(p, searchTerm, filter)) {
                emergencyModel.addRow(new Object[]{
                    p.getId(), p.getName(), p.getAge(),
                    p.getSeverity().name(), truncate(p.getSymptoms(), 25),
                    p.getEstimatedWaitTimeMinutes(),
                    String.format("%.2f", p.getAiPriorityScore())
                });
                totalEmergency++;
            }
        }

        for (Patient p : normalPatients) {
            if (matchesFilter(p, searchTerm, filter)) {
                normalModel.addRow(new Object[]{
                    p.getId(), p.getName(), p.getAge(),
                    p.getSeverity().name(), truncate(p.getSymptoms(), 25),
                    p.getEstimatedWaitTimeMinutes(),
                    String.format("%.2f", p.getAiPriorityScore())
                });
                totalNormal++;
            }
        }

        summaryLabel.setText(String.format(
            "  Emergency: %d  |  Normal: %d  |  Total Waiting: %d  |  Treated Today: %d  |  Avg Wait: %.0f min",
            totalEmergency, totalNormal, queueManager.getTotalWaiting(),
            queueManager.getTreatedCount(), queueManager.getAverageWaitTime()
        ));
    }

    private boolean matchesFilter(Patient p, String search, String severityFilter) {
        boolean matchesSearch = search.isEmpty()
            || p.getName().toLowerCase().contains(search)
            || p.getId().toLowerCase().contains(search)
            || p.getSymptoms().toLowerCase().contains(search);

        boolean matchesSeverity = severityFilter.equals("All Severities")
            || p.getSeverity().name().equals(severityFilter.toUpperCase());

        return matchesSearch && matchesSeverity;
    }

    private String truncate(String text, int maxLen) {
        if (text.length() <= maxLen) return text;
        return text.substring(0, maxLen - 3) + "...";
    }
}
