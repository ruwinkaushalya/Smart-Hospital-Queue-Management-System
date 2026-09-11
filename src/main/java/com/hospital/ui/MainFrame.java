package com.hospital.ui;

import com.hospital.model.*;
import com.hospital.service.*;

import javax.swing.*;
import javax.swing.border.*;
import java.awt.*;
import java.awt.event.*;
import java.util.*;

public class MainFrame extends JFrame {
    private final QueueManager queueManager;
    private final DispatchService dispatchService;
    private final CardLayout cardLayout;
    private final JPanel contentPanel;
    private JLabel statusLabel;
    private JLabel emergencyCountLabel;
    private JLabel normalCountLabel;
    private JLabel totalCountLabel;

    private DashboardPanel dashboardPanel;
    private RegistrationPanel registrationPanel;
    private QueueMonitorPanel queueMonitorPanel;
    private DispatchPanel dispatchPanel;
    private AnalyticsPanel analyticsPanel;

    public MainFrame() {
        this.queueManager = new QueueManager();
        this.dispatchService = new DispatchService();

        setTitle("Smart Hospital Patient Queue Management System (AI-Enhanced)");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(1400, 900);
        setLocationRelativeTo(null);
        setExtendedState(JFrame.MAXIMIZED_BOTH);

        initSampleData();

        JPanel mainPanel = new JPanel(new BorderLayout());
        mainPanel.setBackground(new Color(245, 247, 250));

        mainPanel.add(createSidebar(), BorderLayout.WEST);

        contentPanel = new JPanel(cardLayout = new CardLayout());
        contentPanel.setBackground(new Color(245, 247, 250));

        dashboardPanel = new DashboardPanel(queueManager, dispatchService);
        registrationPanel = new RegistrationPanel(queueManager);
        queueMonitorPanel = new QueueMonitorPanel(queueManager);
        dispatchPanel = new DispatchPanel(dispatchService, queueManager);
        analyticsPanel = new AnalyticsPanel(queueManager, dispatchService);

        contentPanel.add(dashboardPanel, "DASHBOARD");
        contentPanel.add(registrationPanel, "REGISTRATION");
        contentPanel.add(queueMonitorPanel, "QUEUE");
        contentPanel.add(dispatchPanel, "DISPATCH");
        contentPanel.add(analyticsPanel, "ANALYTICS");

        mainPanel.add(contentPanel, BorderLayout.CENTER);
        mainPanel.add(createStatusBar(), BorderLayout.SOUTH);

        add(mainPanel);

        queueManager.addListener(() -> {
            SwingUtilities.invokeLater(this::updateStatusBar);
        });
        dispatchService.addListener(() -> {
            SwingUtilities.invokeLater(this::updateStatusBar);
        });
    }

    private JPanel createSidebar() {
        JPanel sidebar = new JPanel();
        sidebar.setPreferredSize(new Dimension(220, 0));
        sidebar.setBackground(new Color(30, 41, 59));
        sidebar.setLayout(new BoxLayout(sidebar, BoxLayout.Y_AXIS));
        sidebar.setBorder(new EmptyBorder(20, 15, 20, 15));

        JLabel titleLabel = new JLabel("SMART HOSPITAL");
        titleLabel.setFont(new Font("Segoe UI", Font.BOLD, 16));
        titleLabel.setForeground(Color.WHITE);
        titleLabel.setAlignmentX(Component.LEFT_ALIGNMENT);

        JLabel subtitleLabel = new JLabel("Queue Management System");
        subtitleLabel.setFont(new Font("Segoe UI", Font.PLAIN, 11));
        subtitleLabel.setForeground(new Color(148, 163, 184));
        subtitleLabel.setAlignmentX(Component.LEFT_ALIGNMENT);

        JLabel aiLabel = new JLabel("  AI-ENHANCED");
        aiLabel.setFont(new Font("Segoe UI", Font.BOLD, 10));
        aiLabel.setForeground(new Color(52, 211, 153));
        aiLabel.setAlignmentX(Component.LEFT_ALIGNMENT);
        aiLabel.setBorder(new EmptyBorder(2, 0, 20, 0));

        sidebar.add(titleLabel);
        sidebar.add(subtitleLabel);
        sidebar.add(aiLabel);
        sidebar.add(Box.createVerticalStrut(10));

        String[] navItems = {
            "DASHBOARD", "Dashboard Overview",
            "REGISTRATION", "Patient Registration",
            "QUEUE", "Live Queue Monitor",
            "DISPATCH", "Ambulance Dispatch",
            "ANALYTICS", "AI Analytics & Insights"
        };

        for (int i = 0; i < navItems.length; i += 2) {
            String cardName = navItems[i];
            String label = navItems[i + 1];
            JButton btn = createNavButton(label, cardName);
            sidebar.add(btn);
            sidebar.add(Box.createVerticalStrut(8));
        }

        sidebar.add(Box.createVerticalGlue());

        JLabel versionLabel = new JLabel("v1.0.0  |  PDSA Coursework");
        versionLabel.setFont(new Font("Segoe UI", Font.PLAIN, 10));
        versionLabel.setForeground(new Color(100, 116, 139));
        versionLabel.setAlignmentX(Component.LEFT_ALIGNMENT);
        sidebar.add(versionLabel);

        return sidebar;
    }

    private JButton createNavButton(String text, String cardName) {
        JButton btn = new JButton(text);
        btn.setFont(new Font("Segoe UI", Font.BOLD, 13));
        btn.setForeground(new Color(203, 213, 225));
        btn.setBackground(new Color(30, 41, 59));
        btn.setBorder(new EmptyBorder(12, 15, 12, 15));
        btn.setFocusPainted(false);
        btn.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btn.setAlignmentX(Component.LEFT_ALIGNMENT);
        btn.setMaximumSize(new Dimension(Integer.MAX_VALUE, 45));
        btn.setHorizontalAlignment(SwingConstants.LEFT);

        btn.addMouseListener(new MouseAdapter() {
            @Override
            public void mouseEntered(MouseEvent e) {
                btn.setBackground(new Color(51, 65, 85));
                btn.setForeground(Color.WHITE);
            }
            @Override
            public void mouseExited(MouseEvent e) {
                btn.setBackground(new Color(30, 41, 59));
                btn.setForeground(new Color(203, 213, 225));
            }
        });

        btn.addActionListener(e -> {
            cardLayout.show(contentPanel, cardName);
            if (cardName.equals("DASHBOARD")) dashboardPanel.refresh();
            if (cardName.equals("QUEUE")) queueMonitorPanel.refresh();
            if (cardName.equals("DISPATCH")) dispatchPanel.refresh();
            if (cardName.equals("ANALYTICS")) analyticsPanel.refresh();
        });

        return btn;
    }

    private JPanel createStatusBar() {
        JPanel statusBar = new JPanel(new BorderLayout());
        statusBar.setBackground(new Color(15, 23, 42));
        statusBar.setBorder(new EmptyBorder(8, 15, 8, 15));
        statusBar.setPreferredSize(new Dimension(0, 36));

        statusLabel = new JLabel("System Ready | All services operational");
        statusLabel.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        statusLabel.setForeground(new Color(148, 163, 184));

        JPanel statsPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT, 15, 0));
        statsPanel.setOpaque(false);

        emergencyCountLabel = createStatLabel("Emergency: 0", new Color(239, 68, 68));
        normalCountLabel = createStatLabel("Normal: 0", new Color(59, 130, 246));
        totalCountLabel = createStatLabel("Total Waiting: 0", new Color(16, 185, 129));

        statsPanel.add(emergencyCountLabel);
        statsPanel.add(normalCountLabel);
        statsPanel.add(totalCountLabel);

        statusBar.add(statusLabel, BorderLayout.WEST);
        statusBar.add(statsPanel, BorderLayout.EAST);

        return statusBar;
    }

    private JLabel createStatLabel(String text, Color color) {
        JLabel label = new JLabel(text);
        label.setFont(new Font("Segoe UI", Font.BOLD, 12));
        label.setForeground(color);
        return label;
    }

    private void updateStatusBar() {
        emergencyCountLabel.setText("Emergency: " + queueManager.getEmergencyCount());
        normalCountLabel.setText("Normal: " + queueManager.getNormalCount());
        totalCountLabel.setText("Total Waiting: " + queueManager.getTotalWaiting());

        com.hospital.ai.AIDecisionSupport.QueueAnalytics analytics = queueManager.getAnalytics();
        String statusText;
        Color statusColor;
        if (analytics.status.contains("CRITICAL")) {
            statusText = "CRITICAL OVERLOAD - Immediate attention required";
            statusColor = new Color(239, 68, 68);
        } else if (analytics.status.contains("HIGH")) {
            statusText = "HIGH LOAD - Monitor closely";
            statusColor = new Color(245, 158, 11);
        } else if (analytics.status.contains("MODERATE")) {
            statusText = "MODERATE LOAD - Operating normally";
            statusColor = new Color(59, 130, 246);
        } else {
            statusText = "System Normal - All services operational";
            statusColor = new Color(148, 163, 184);
        }
        statusLabel.setText(statusText);
        statusLabel.setForeground(statusColor);
    }

    private void initSampleData() {
        Hospital h1 = new Hospital("H1", "City General Hospital", "123 Main St", 6.9271, 79.8612, 200, 20, 15, true);
        Hospital h2 = new Hospital("H2", "Metro Medical Center", "456 Park Ave", 6.8500, 79.9000, 150, 15, 10, true);
        Hospital h3 = new Hospital("H3", "St. Mary's Hospital", "789 Hill Rd", 6.9500, 79.8200, 100, 10, 8, true);
        Hospital h4 = new Hospital("H4", "Northside Clinic", "321 North Blvd", 7.0000, 79.8800, 80, 5, 5, false);
        Hospital h5 = new Hospital("H5", "Emergency Care Unit", "555 Rapid Ln", 6.8800, 79.9500, 50, 25, 12, true);

        queueManager.addHospital(h1);
        queueManager.addHospital(h2);
        queueManager.addHospital(h3);
        queueManager.addHospital(h4);
        queueManager.addHospital(h5);

        dispatchService.addHospital(h1);
        dispatchService.addHospital(h2);
        dispatchService.addHospital(h3);
        dispatchService.addHospital(h4);
        dispatchService.addHospital(h5);

        dispatchService.addRoad("H1", "H2", 8.5);
        dispatchService.addRoad("H1", "H3", 5.2);
        dispatchService.addRoad("H1", "H4", 12.0);
        dispatchService.addRoad("H2", "H3", 9.8);
        dispatchService.addRoad("H2", "H5", 4.3);
        dispatchService.addRoad("H3", "H4", 7.1);
        dispatchService.addRoad("H3", "H5", 11.2);
        dispatchService.addRoad("H4", "H5", 15.5);

        dispatchService.addAmbulance(new Ambulance("John Smith", "077-1234567", 6.9000, 79.8700));
        dispatchService.addAmbulance(new Ambulance("Sarah Johnson", "077-2345678", 6.9400, 79.8500));
        dispatchService.addAmbulance(new Ambulance("Michael Brown", "077-3456789", 6.8600, 79.9200));
        dispatchService.addAmbulance(new Ambulance("Emily Davis", "077-4567890", 6.9800, 79.8900));

        Patient p1 = new Patient("Alice Cooper", 45, "071-1111111", "Chest pain, difficulty breathing", Patient.Severity.CRITICAL);
        Patient p2 = new Patient("Bob Martin", 32, "071-2222222", "Broken leg from accident", Patient.Severity.HIGH);
        Patient p3 = new Patient("Carol White", 67, "071-3333333", "High fever, dehydration", Patient.Severity.MODERATE);
        Patient p4 = new Patient("David Lee", 28, "071-4444444", "Severe allergic reaction", Patient.Severity.HIGH);
        Patient p5 = new Patient("Emma Wilson", 55, "071-5555555", "Migraine, dizziness", Patient.Severity.LOW);
        Patient p6 = new Patient("Frank Harris", 72, "071-6666666", "Chest tightness", Patient.Severity.CRITICAL);
        Patient p7 = new Patient("Grace Taylor", 19, "071-7777777", "Sprained ankle", Patient.Severity.LOW);
        Patient p8 = new Patient("Henry Clark", 41, "071-8888888", "Abdominal pain", Patient.Severity.MODERATE);

        for (Patient p : Arrays.asList(p1, p2, p3, p4, p5, p6, p7, p8)) {
            queueManager.registerPatient(p);
        }
    }
}
