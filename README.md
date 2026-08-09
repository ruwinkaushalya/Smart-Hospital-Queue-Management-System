# Smart Hospital Queue Management System

A production-ready, full-stack hospital management platform developed as part of the Higher National Diploma in Software Engineering (HNDSE) Programming & Data Structures & Algorithms (PDSA) module at NIBM[cite: 1].

## 🚀 Key Features
- **Role-Based Access Control (RBAC):** Dedicated dashboards for 5 user roles (Admin, Doctor, Nurse, Receptionist, and Patient)[cite: 1].
- **AI-Powered Decision Support:** Intelligent patient prioritization and optimal ambulance routing[cite: 1].
- **Real-Time Synchronization:** Live updates across dashboards using Server-Sent Events (SSE)[cite: 1].
- **Interactive 3D Visualizations:** Hospital mapping and ambulance tracking powered by Three.js[cite: 1].
- **Algorithm Demonstrations:** Built-in visualizers for data structures, sorting algorithms, and network graphs[cite: 1].

---

## 🧠 Implemented Data Structures & Algorithms
| Topic | Data Structure / Algorithm | Real-World Application |
| :--- | :--- | :--- |
| **Stack** | `UndoStack` | Reversible administrative actions (patient registration/bed allocation)[cite: 1] |
| **Queue** | `CircularQueue` | Memory-efficient FIFO ordering for non-emergency patients[cite: 1] |
| **Linked List** | `PatientHistoryLinkedList` | Chronological tracking of patient medical visits[cite: 1] |
| **Sorting** | Bubble & Selection Sort | Multi-criteria sorting for patient lists and analytics[cite: 1] |
| **Balanced Trees** | `AVL Tree` | Self-balancing pharmacy inventory for O(log n) searches[cite: 1] |
| **Graphs** | Dijkstra's Algorithm | Shortest-path routing for emergency ambulance dispatch[cite: 1] |
| **Graphs** | Kruskal's MST | Optimal road network connection minimizing infrastructure distance[cite: 1] |

---

## 🛠️ Technology Stack
- **Frontend:** React 19, Vite, Tailwind CSS v4, Recharts, Three.js, Lucide React[cite: 1]
- **Backend:** Java 17, `com.sun.net.httpserver` (REST API)[cite: 1]
- **Database:** H2 Embedded Database (File-based persistence with 12 tables)[cite: 1]
- **Testing:** Custom JUnit runner (71 backend tests) & Vitest/React Testing Library (216 frontend tests)[cite: 1]

---

## 👨‍💻 Developed By
- **Ruwin Kaushalya** (MAHDSE251F-028)[cite: 1]
- **Ahamed Zameer** (MAHDSE251F-029)[cite: 1]
- **Institution:** National Institute of Business Management (NIBM), Sri Lanka[cite: 1]
- **Module Lecturer:** Ms. Nadishani Gunasekara[cite: 1]
