package com.hospital.ui;

import javax.swing.SwingUtilities;
import javax.swing.UIManager;
import java.awt.Color;
import java.awt.Font;

public class HospitalQueueApp {

    public static void main(String[] args) {
        try {
            UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
            UIManager.put("Panel.background", new Color(245, 247, 250));
            UIManager.put("Table.background", Color.WHITE);
            UIManager.put("Table.gridColor", new Color(220, 225, 230));
            UIManager.put("Table.selectionBackground", new Color(66, 133, 244));
            UIManager.put("Table.selectionForeground", Color.WHITE);
            UIManager.put("Button.background", new Color(66, 133, 244));
            UIManager.put("Button.foreground", Color.WHITE);
            UIManager.put("Button.font", new Font("Segoe UI", Font.BOLD, 12));
        } catch (Exception e) {
            e.printStackTrace();
        }

        SwingUtilities.invokeLater(() -> {
            MainFrame mainFrame = new MainFrame();
            mainFrame.setVisible(true);
        });
    }
}
