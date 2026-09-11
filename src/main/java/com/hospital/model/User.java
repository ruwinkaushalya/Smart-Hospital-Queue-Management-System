package com.hospital.model;

import java.time.LocalDateTime;
import java.util.UUID;

public class User {
    private final String id;
    private String username;
    private String passwordHash;
    private String name;
    private Role role;
    private String email;
    private boolean active;
    private LocalDateTime createdAt;
    private String authToken;
    private LocalDateTime lastLogin;

    public enum Role {
        ADMIN("Administrator", "Full system access"),
        DOCTOR("Doctor", "Patient treatment and medical records"),
        RECEPTIONIST("Receptionist", "Patient registration and queue management"),
        NURSE("Nurse", "Bed management and patient care"),
        PATIENT("Patient", "Personal health records and appointments");

        private final String displayName;
        private final String description;

        Role(String displayName, String description) {
            this.displayName = displayName;
            this.description = description;
        }

        public String getDisplayName() { return displayName; }
        public String getDescription() { return description; }
    }

    public User(String username, String passwordHash, String name, Role role, String email) {
        this.id = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        this.username = username;
        this.passwordHash = passwordHash;
        this.name = name;
        this.role = role;
        this.email = email;
        this.active = true;
        this.createdAt = LocalDateTime.now();
    }

    /** Constructor for database restore */
    public User(String id, String username, String passwordHash, String name, Role role, String email, boolean active, LocalDateTime createdAt, LocalDateTime lastLogin) {
        this.id = id;
        this.username = username;
        this.passwordHash = passwordHash;
        this.name = name;
        this.role = role;
        this.email = email;
        this.active = active;
        this.createdAt = createdAt;
        this.lastLogin = lastLogin;
    }

    public void generateAuthToken() {
        this.authToken = UUID.randomUUID().toString().replace("-", "").toUpperCase();
    }

    public void clearAuthToken() {
        this.authToken = null;
    }

    public void updateLastLogin() {
        this.lastLogin = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getAuthToken() { return authToken; }
    public void setAuthToken(String authToken) { this.authToken = authToken; }
    public LocalDateTime getLastLogin() { return lastLogin; }
    public void setLastLogin(LocalDateTime lastLogin) { this.lastLogin = lastLogin; }

    @Override
    public String toString() {
        return String.format("User[%s | %s | %s | %s]", id, username, role.getDisplayName(), active ? "Active" : "Inactive");
    }
}
