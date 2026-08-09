# Smart Hospital Queue Management System

A production-ready, full-stack hospital management platform developed as part of the Higher National Diploma in Software Engineering (HNDSE) Programming & Data Structures & Algorithms (PDSA) module at NIBM.

## 🚀 Key Features
- **Role-Based Access Control (RBAC):** Dedicated dashboards for 5 user roles (Admin, Doctor, Nurse, Receptionist, and Patient).
- **AI-Powered Decision Support:** Intelligent patient prioritization and optimal ambulance routing.
- **Real-Time Synchronization:** Live updates across dashboards using Server-Sent Events (SSE).
- **Interactive 3D Visualizations:** Hospital mapping and ambulance tracking powered by Three.js.
- **Algorithm Demonstrations:** Built-in visualizers for data structures, sorting algorithms, and network graphs.

---

## 🧠 Implemented Data Structures & Algorithms
| Topic | Data Structure / Algorithm | Real-World Application |
| :--- | :--- | :--- |
| **Stack** | `UndoStack` | Reversible administrative actions (patient registration/bed allocation) |
| **Queue** | `CircularQueue` | Memory-efficient FIFO ordering for non-emergency patients |
| **Linked List** | `PatientHistoryLinkedList` | Chronological tracking of patient medical visits |
| **Sorting** | Bubble & Selection Sort | Multi-criteria sorting for patient lists and analytics |
| **Balanced Trees** | `AVL Tree` | Self-balancing pharmacy inventory for O(log n) searches |
| **Graphs** | Dijkstra's Algorithm | Shortest-path routing for emergency ambulance dispatch |
| **Graphs** | Kruskal's MST | Optimal road network connection minimizing infrastructure distance |

---

## 🛠️ Technology Stack
- **Frontend:** React 19, Vite, Tailwind CSS v4, Recharts, Three.js, Lucide React
- **Backend:** Java 17, `com.sun.net.httpserver` (REST API)
- **Database:** H2 Embedded Database (File-based persistence with 12 tables)
- **Testing:** Custom JUnit runner (71 backend tests) & Vitest/React Testing Library (216 frontend tests)

---

## 👨‍💻 Developed By
- **Ruwin Kaushalya** (MAHDSE251F-028)
- **Ahamed Zameer** (MAHDSE251F-029)
- **Institution:** National Institute of Business Management (NIBM), Sri Lanka
- **Module Lecturer:** Ms. Nadishani Gunasekara
