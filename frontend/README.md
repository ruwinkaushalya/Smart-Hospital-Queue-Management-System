# Smart Hospital Patient Queue Management System — React Frontend

A professional, modern, responsive web application UI for the Smart Hospital Patient Queue Management System. Built with **React**, **Vite**, **Tailwind CSS v4**, **Recharts**, and **Lucide React** icons.

## Features

- **Dashboard** — Real-time stat cards, recent activity feed, quick actions
- **Emergency Queue** — Priority queue table with search, filter, sort, and severity badges
- **Normal Queue** — FIFO queue table with search and filter
- **Patient Registration** — Form with validation and AI-powered symptom severity analysis
- **Ambulance Dispatch** — Hospital network graph, Dijkstra shortest-path routing, live ambulance tracking
- **AI Analytics** — Bar, line, and pie charts; AI wait-time prediction visualization; hospital load analysis
- **Hospital Map** — Interactive SVG map view with multi-hospital dispatch simulation

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React 19 | UI framework |
| Vite 8 | Build tool & dev server |
| Tailwind CSS 4 | Utility-first styling |
| React Router 7 | Client-side routing |
| Recharts 3 | Data visualization charts |
| Lucide React | Icon library |

## Data Structures & Algorithms Demonstrated

- **Circular Queue** — O(1) enqueue/dequeue for normal patient flow
- **Min Heap Priority Queue** — O(log n) insertion/extraction for emergency prioritization
- **Graph (Adjacency List)** — Hospital network with weighted road-distance edges
- **Dijkstra's Algorithm** — O(E log V) shortest-path ambulance dispatch routing
- **AI Decision Support** — Severity scoring, wait-time prediction, hospital load balancing

## Project Structure

```
src/
  components/
    Layout.jsx          # Sidebar + responsive navigation
    StatCard.jsx        # Reusable dashboard stat card
    SeverityBadge.jsx   # Shared severity status badge
  pages/
    Dashboard.jsx       # Overview dashboard
    EmergencyQueue.jsx  # Priority emergency queue
    NormalQueue.jsx     # FIFO normal queue
    Registration.jsx    # Patient registration + AI analysis
    Dispatch.jsx        # Ambulance dispatch + Dijkstra routing
    Analytics.jsx       # Charts + AI insights
    MapView.jsx         # Multi-hospital SVG map
  data/
    mockData.js         # Sample JSON data for demo
  App.jsx               # React Router setup
  main.jsx              # Entry point
  index.css             # Tailwind v4 theme + custom utilities
```

## Prerequisites

- Node.js 18+ and npm

## Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd frontend

# Install dependencies
npm install
```

## Running the App

```bash
# Start the development server
npm start

# Or explicitly
npm run dev
```

The app will be available at `http://localhost:5173`.

## Building for Production

```bash
npm run build
```

Output is generated in the `dist/` directory.

## Java Backend API Integration

The frontend is designed to integrate with a Java backend API. To connect:

1. Update `src/services/api.js` (create if needed) to point to your Java API base URL:
   ```js
   const API_BASE = 'http://localhost:8080/api';
   ```
2. Replace `mockData.js` imports in pages with `fetch()` calls to the Java endpoints:
   - `GET /api/patients` — patient list
   - `POST /api/patients` — register patient
   - `GET /api/queues/status` — queue stats
   - `GET /api/hospitals` — hospital network
   - `GET /api/dispatch/shortest-path` — Dijkstra routing
   - `GET /api/analytics` — AI analytics data

## Scalability

The UI is designed to scale for:
- **100+ emergency patients** — Virtual scrolling can be added to the queue tables
- **500+ normal patients** — Pagination + search/filter keep the DOM lightweight
- **Real-time updates** — WebSocket or Server-Sent Events can stream queue changes to the dashboard

## License

Coursework project for HNDSE PDSA-1.
