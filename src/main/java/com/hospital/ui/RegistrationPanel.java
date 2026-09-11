package com.hospital.ui;

import com.hospital.ai.AIDecisionSupport;
import com.hospital.model.Patient;
import com.hospital.service.QueueManager;

import javax.swing.*;
import javax.swing.border.*;
import java.awt.*;

public class RegistrationPanel extends JPanel {
    private final QueueManager queueManager;

    private JTextField nameField;
    private JTextField ageField;
    private JTextField contactField;
    private JTextArea symptomsArea;
    private JComboBox<Patient.Severity> severityCombo;
    private JTextArea aiSuggestionArea;
    private JLabel waitTimeLabel;
    private JLabel queuePositionLabel;

    public RegistrationPanel(QueueManager queueManager) {
        this.queueManager = queueManager;
        setLayout(new BorderLayout(15, 15));
        setBackground(new Color(245, 247, 250));
        setBorder(new EmptyBorder(20, 20, 20, 20));

        add(createHeader(), BorderLayout.NORTH);
        add(createFormPanel(), BorderLayout.CENTER);
    }

    private JPanel createHeader() {
        JPanel header = new JPanel(new BorderLayout());
        header.setOpaque(false);

        JLabel title = new JLabel("Patient Registration");
        title.setFont(new Font("Segoe UI", Font.BOLD, 24));
        title.setForeground(new Color(30, 41, 59));

        JLabel subtitle = new JLabel("Register new patients with AI-assisted severity assessment");
        subtitle.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        subtitle.setForeground(new Color(100, 116, 139));

        JPanel titlePanel = new JPanel(new GridLayout(2, 1, 0, 2));
        titlePanel.setOpaque(false);
        titlePanel.add(title);
        titlePanel.add(subtitle);

        header.add(titlePanel, BorderLayout.WEST);
        return header;
    }

    private JPanel createFormPanel() {
        JPanel panel = new JPanel(new GridLayout(1, 2, 20, 0));
        panel.setOpaque(false);

        panel.add(createInputPanel());
        panel.add(createAiPanel());

        return panel;
    }

    private JPanel createInputPanel() {
        JPanel panel = new JPanel(new BorderLayout(15, 15));
        panel.setBackground(Color.WHITE);
        panel.setBorder(BorderFactory.createCompoundBorder(
            BorderFactory.createLineBorder(new Color(226, 232, 240)),
            new EmptyBorder(20, 20, 20, 20)
        ));

        JLabel formTitle = new JLabel("Patient Details");
        formTitle.setFont(new Font("Segoe UI", Font.BOLD, 16));
        formTitle.setForeground(new Color(30, 41, 59));
        panel.add(formTitle, BorderLayout.NORTH);

        JPanel fieldsPanel = new JPanel(new GridBagLayout());
        fieldsPanel.setOpaque(false);
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.fill = GridBagConstraints.HORIZONTAL;
        gbc.insets = new Insets(8, 5, 8, 5);

        nameField = new JTextField(20);
        nameField.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        nameField.setBorder(BorderFactory.createCompoundBorder(
            BorderFactory.createLineBorder(new Color(203, 213, 225)),
            new EmptyBorder(8, 10, 8, 10)
        ));

        ageField = new JTextField(20);
        ageField.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        ageField.setBorder(nameField.getBorder());

        contactField = new JTextField(20);
        contactField.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        contactField.setBorder(nameField.getBorder());

        symptomsArea = new JTextArea(4, 20);
        symptomsArea.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        symptomsArea.setLineWrap(true);
        symptomsArea.setWrapStyleWord(true);
        symptomsArea.setBorder(nameField.getBorder());

        severityCombo = new JComboBox<>(Patient.Severity.values());
        severityCombo.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        severityCombo.setBorder(nameField.getBorder());

        gbc.gridx = 0; gbc.gridy = 0;
        fieldsPanel.add(createLabel("Full Name *"), gbc);
        gbc.gridx = 1;
        fieldsPanel.add(nameField, gbc);

        gbc.gridx = 0; gbc.gridy = 1;
        fieldsPanel.add(createLabel("Age *"), gbc);
        gbc.gridx = 1;
        fieldsPanel.add(ageField, gbc);

        gbc.gridx = 0; gbc.gridy = 2;
        fieldsPanel.add(createLabel("Contact Number *"), gbc);
        gbc.gridx = 1;
        fieldsPanel.add(contactField, gbc);

        gbc.gridx = 0; gbc.gridy = 3;
        fieldsPanel.add(createLabel("Symptoms *"), gbc);
        gbc.gridx = 1;
        fieldsPanel.add(new JScrollPane(symptomsArea), gbc);

        gbc.gridx = 0; gbc.gridy = 4;
        fieldsPanel.add(createLabel("Severity Level *"), gbc);
        gbc.gridx = 1;
        fieldsPanel.add(severityCombo, gbc);

        panel.add(fieldsPanel, BorderLayout.CENTER);

        JPanel btnPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT, 10, 0));
        btnPanel.setOpaque(false);

        JButton analyzeBtn = new JButton("🧠 AI Analyze Symptoms");
        analyzeBtn.setFont(new Font("Segoe UI", Font.BOLD, 13));
        analyzeBtn.setForeground(Color.WHITE);
        analyzeBtn.setBackground(new Color(139, 92, 246));
        analyzeBtn.setFocusPainted(false);
        analyzeBtn.setCursor(new Cursor(Cursor.HAND_CURSOR));
        analyzeBtn.setBorder(new EmptyBorder(10, 20, 10, 20));
        analyzeBtn.addActionListener(e -> analyzeSymptoms());

        JButton registerBtn = new JButton("Register Patient");
        registerBtn.setFont(new Font("Segoe UI", Font.BOLD, 13));
        registerBtn.setForeground(Color.WHITE);
        registerBtn.setBackground(new Color(16, 185, 129));
        registerBtn.setFocusPainted(false);
        registerBtn.setCursor(new Cursor(Cursor.HAND_CURSOR));
        registerBtn.setBorder(new EmptyBorder(10, 25, 10, 25));
        registerBtn.addActionListener(e -> registerPatient());

        JButton clearBtn = new JButton("Clear Form");
        clearBtn.setFont(new Font("Segoe UI", Font.BOLD, 13));
        clearBtn.setForeground(new Color(100, 116, 139));
        clearBtn.setBackground(new Color(241, 245, 249));
        clearBtn.setFocusPainted(false);
        clearBtn.setCursor(new Cursor(Cursor.HAND_CURSOR));
        clearBtn.setBorder(new EmptyBorder(10, 20, 10, 20));
        clearBtn.addActionListener(e -> clearForm());

        btnPanel.add(analyzeBtn);
        btnPanel.add(clearBtn);
        btnPanel.add(registerBtn);

        panel.add(btnPanel, BorderLayout.SOUTH);

        return panel;
    }

    private JPanel createAiPanel() {
        JPanel panel = new JPanel(new BorderLayout(15, 15));
        panel.setBackground(Color.WHITE);
        panel.setBorder(BorderFactory.createCompoundBorder(
            BorderFactory.createLineBorder(new Color(226, 232, 240)),
            new EmptyBorder(20, 20, 20, 20)
        ));

        JLabel aiTitle = new JLabel("🤖 AI Decision Support");
        aiTitle.setFont(new Font("Segoe UI", Font.BOLD, 16));
        aiTitle.setForeground(new Color(139, 92, 246));
        panel.add(aiTitle, BorderLayout.NORTH);

        JPanel infoPanel = new JPanel(new GridLayout(4, 1, 10, 10));
        infoPanel.setOpaque(false);

        waitTimeLabel = new JLabel("Estimated Wait Time: --");
        waitTimeLabel.setFont(new Font("Segoe UI", Font.BOLD, 14));
        waitTimeLabel.setForeground(new Color(30, 41, 59));

        queuePositionLabel = new JLabel("Queue Position: --");
        queuePositionLabel.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        queuePositionLabel.setForeground(new Color(100, 116, 139));

        JLabel severityGuide = new JLabel("<html><b>Severity Guide:</b><br/>"
            + "<span style='color:#ef4444'>● Critical</span> - Life threatening, immediate action<br/>"
            + "<span style='color:#f97316'>● High</span> - Severe injury, fast-track needed<br/>"
            + "<span style='color:#f59e0b'>● Moderate</span> - Urgent but stable<br/>"
            + "<span style='color:#3b82f6'>● Low</span> - Minor issue<br/>"
            + "<span style='color:#10b981'>● Routine</span> - Non-urgent checkup</html>");
        severityGuide.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        severityGuide.setForeground(new Color(71, 85, 105));

        aiSuggestionArea = new JTextArea(8, 25);
        aiSuggestionArea.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        aiSuggestionArea.setEditable(false);
        aiSuggestionArea.setLineWrap(true);
        aiSuggestionArea.setWrapStyleWord(true);
        aiSuggestionArea.setBackground(new Color(250, 250, 250));
        aiSuggestionArea.setBorder(BorderFactory.createCompoundBorder(
            BorderFactory.createLineBorder(new Color(226, 232, 240)),
            new EmptyBorder(10, 10, 10, 10)
        ));
        aiSuggestionArea.setText("Enter patient details and click 'AI Analyze Symptoms' to get AI-powered recommendations.");

        infoPanel.add(waitTimeLabel);
        infoPanel.add(queuePositionLabel);
        infoPanel.add(new JScrollPane(aiSuggestionArea));
        infoPanel.add(severityGuide);

        panel.add(infoPanel, BorderLayout.CENTER);
        return panel;
    }

    private JLabel createLabel(String text) {
        JLabel label = new JLabel(text);
        label.setFont(new Font("Segoe UI", Font.BOLD, 13));
        label.setForeground(new Color(71, 85, 105));
        return label;
    }

    private void analyzeSymptoms() {
        String name = nameField.getText().trim();
        String ageStr = ageField.getText().trim();
        String symptoms = symptomsArea.getText().trim();

        if (symptoms.isEmpty()) {
            JOptionPane.showMessageDialog(this, "Please enter symptoms to analyze.", "Missing Symptoms", JOptionPane.WARNING_MESSAGE);
            return;
        }

        Patient tempPatient = new Patient(name.isEmpty() ? "Temp" : name,
            ageStr.isEmpty() ? 30 : Integer.parseInt(ageStr), "", symptoms,
            (Patient.Severity) severityCombo.getSelectedItem());

        AIDecisionSupport ai = queueManager.getAiSupport();
        String suggestion = ai.generateTreatmentSuggestion(tempPatient);

        int predictedWait = ai.predictWaitTimeMinutes(tempPatient,
            queueManager.getTotalWaiting(),
            queueManager.getHospitals().isEmpty() ? null : queueManager.getHospitals().get(0));

        waitTimeLabel.setText("Estimated Wait Time: " + predictedWait + " minutes");
        queuePositionLabel.setText("Queue Position: " + (queueManager.getTotalWaiting() + 1));
        aiSuggestionArea.setText(suggestion);
        aiSuggestionArea.setCaretPosition(0);
    }

    private void registerPatient() {
        String name = nameField.getText().trim();
        String ageStr = ageField.getText().trim();
        String contact = contactField.getText().trim();
        String symptoms = symptomsArea.getText().trim();
        Patient.Severity severity = (Patient.Severity) severityCombo.getSelectedItem();

        if (name.isEmpty() || ageStr.isEmpty() || contact.isEmpty() || symptoms.isEmpty()) {
            JOptionPane.showMessageDialog(this, "Please fill in all required fields.", "Validation Error", JOptionPane.ERROR_MESSAGE);
            return;
        }

        int age;
        try {
            age = Integer.parseInt(ageStr);
            if (age < 0 || age > 120) throw new NumberFormatException();
        } catch (NumberFormatException e) {
            JOptionPane.showMessageDialog(this, "Please enter a valid age (0-120).", "Invalid Age", JOptionPane.ERROR_MESSAGE);
            return;
        }

        Patient patient = new Patient(name, age, contact, symptoms, severity);
        boolean added = queueManager.registerPatient(patient);

        if (added) {
            JOptionPane.showMessageDialog(this,
                "Patient registered successfully!\n\n"
                + "ID: " + patient.getId() + "\n"
                + "Name: " + patient.getName() + "\n"
                + "Severity: " + severity.name() + "\n"
                + "Estimated Wait: " + patient.getEstimatedWaitTimeMinutes() + " min",
                "Registration Successful", JOptionPane.INFORMATION_MESSAGE);
            clearForm();
        } else {
            JOptionPane.showMessageDialog(this, "Failed to register patient.", "Error", JOptionPane.ERROR_MESSAGE);
        }
    }

    private void clearForm() {
        nameField.setText("");
        ageField.setText("");
        contactField.setText("");
        symptomsArea.setText("");
        severityCombo.setSelectedIndex(0);
        waitTimeLabel.setText("Estimated Wait Time: --");
        queuePositionLabel.setText("Queue Position: --");
        aiSuggestionArea.setText("Enter patient details and click 'AI Analyze Symptoms' to get AI-powered recommendations.");
    }
}
