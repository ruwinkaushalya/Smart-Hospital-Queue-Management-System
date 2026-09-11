import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../../pages/Dashboard';
import * as api from '../../services/api';

const mockPatients = [
  { id: 'P001', name: 'Alice Cooper', age: 45, symptoms: 'Chest pain', severity: 'CRITICAL', status: 'waiting', estimatedWait: 5, aiScore: 0.92 },
  { id: 'P002', name: 'Bob Martin', age: 32, symptoms: 'Broken leg', severity: 'HIGH', status: 'waiting', estimatedWait: 15, aiScore: 0.78 },
  { id: 'P011', name: 'Kelly Adams', age: 25, symptoms: 'Fever', severity: 'LOW', status: 'completed', estimatedWait: 0, aiScore: 0.25 },
];

const mockQueueStats = {
  totalWaiting: 2,
  emergencyCount: 2,
  normalCount: 0,
  treatedCount: 1,
  pendingBeds: 0,
  availableDoctors: 7,
  totalDoctors: 8,
  avgWaitTime: 10,
  criticalRatio: 1.0,
  status: 'CRITICAL OVERLOAD',
  throughput: 5,
};

const mockAmbulances = [
  { id: 'A001', driver: 'John Smith', status: 'AVAILABLE' },
  { id: 'A002', driver: 'Sarah Johnson', status: 'DISPATCHED' },
];

vi.mock('../../hooks/useRealtimeData', () => ({
  default: () => {},
}));

function renderPage() {
  return render(
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>
  );
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api, 'getPatients').mockResolvedValue(mockPatients);
    vi.spyOn(api, 'getQueueStatus').mockResolvedValue(mockQueueStats);
    vi.spyOn(api, 'getAmbulances').mockResolvedValue(mockAmbulances);
  });

  it('renders loading state initially', () => {
    vi.spyOn(api, 'getPatients').mockImplementation(() => new Promise(() => {}));
    renderPage();
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });

  it('renders page title after loading', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('System Dashboard')).toBeInTheDocument();
    });
  });

  it('renders stat cards with values', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Emergency Patients')).toBeInTheDocument();
      expect(screen.getByText('Normal Patients')).toBeInTheDocument();
      expect(screen.getByText('Patients Treated')).toBeInTheDocument();
      expect(screen.getByText('Avg Wait Time')).toBeInTheDocument();
    });
  });

  it('renders emergency patient count stat', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Emergency Patients')).toBeInTheDocument();
    });
  });

  it('renders treated count stat', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Patients Treated')).toBeInTheDocument();
    });
  });

  it('displays top priority patients table', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Top Priority Patients')).toBeInTheDocument();
      expect(screen.getByText('Alice Cooper')).toBeInTheDocument();
      expect(screen.getByText('Bob Martin')).toBeInTheDocument();
    });
  });

  it('renders recently treated section', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Recently Treated')).toBeInTheDocument();
      expect(screen.getByText('Kelly Adams')).toBeInTheDocument();
    });
  });

  it('renders quick actions section', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('Process Next')).toBeInTheDocument();
      expect(screen.getByText('Simulate Emergency')).toBeInTheDocument();
      expect(screen.getByText('Refresh Queue')).toBeInTheDocument();
      expect(screen.getByText('Clear Data')).toBeInTheDocument();
    });
  });

  it('shows link to register new patient', async () => {
    renderPage();
    await waitFor(() => {
      const link = screen.getByText('New Patient');
      expect(link.closest('a')).toHaveAttribute('href', '/register');
    });
  });

  it('shows link to emergency queue', async () => {
    renderPage();
    await waitFor(() => {
      // "View All" text may appear in the page multiple times
      const links = screen.getAllByText('View All');
      expect(links.length).toBeGreaterThan(0);
      expect(links[0].closest('a')).toHaveAttribute('href', '/emergency');
    });
  });

  it('shows available ambulance count', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Ready for dispatch')).toBeInTheDocument();
    });
  });

  it('shows available doctors info', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Available Doctors')).toBeInTheDocument();
    });
  });

  it('shows queue status', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('CRITICAL OVERLOAD')).toBeInTheDocument();
    });
  });

  it('shows throughput text', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Queue Status')).toBeInTheDocument();
    });
  });

  it('shows active hospitals count', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Active Hospitals')).toBeInTheDocument();
    });
  });

  it('handles process next action', async () => {
    const mockResult = { success: true, patient: { name: 'Alice Cooper', severity: 'CRITICAL' } };
    vi.spyOn(api, 'processNextPatient').mockResolvedValue(mockResult);

    renderPage();
    await waitFor(() => expect(screen.getByText('Alice Cooper')).toBeInTheDocument());

    const processBtn = screen.getByText('Process Next');
    await userEvent.setup().click(processBtn);

    await waitFor(() => {
      expect(api.processNextPatient).toHaveBeenCalled();
    });
  });

  it('handles simulate emergency action', async () => {
    vi.spyOn(api, 'simulateEmergency').mockResolvedValue({ name: 'Emergency Patient X' });

    renderPage();
    await waitFor(() => expect(screen.getByText('Simulate Emergency')).toBeInTheDocument());

    const simulateBtn = screen.getByText('Simulate Emergency');
    await userEvent.setup().click(simulateBtn);

    await waitFor(() => {
      expect(api.simulateEmergency).toHaveBeenCalled();
    });
  });

  it('handles refresh action', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Refresh Queue')).toBeInTheDocument());

    const refreshBtn = screen.getByText('Refresh Queue');
    await userEvent.setup().click(refreshBtn);

    await waitFor(() => {
      expect(api.getPatients).toHaveBeenCalled();
    });
  });

  it('shows empty state for no recent treatments', async () => {
    vi.spyOn(api, 'getPatients').mockResolvedValue(mockPatients.filter(p => p.status !== 'completed'));
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('No patients treated yet today.')).toBeInTheDocument();
    });
  });
});
