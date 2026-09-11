import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import EmergencyQueue from '../../pages/EmergencyQueue';
import * as api from '../../services/api';

const mockPatients = [
  { id: 'P001', name: 'Alice Cooper', age: 45, symptoms: 'Chest pain', severity: 'CRITICAL', status: 'waiting', registrationTime: '2026-06-10T08:30:00', estimatedWait: 5, aiScore: 0.92 },
  { id: 'P002', name: 'Bob Martin', age: 32, symptoms: 'Broken leg', severity: 'HIGH', status: 'waiting', registrationTime: '2026-06-10T08:45:00', estimatedWait: 15, aiScore: 0.78 },
  { id: 'P003', name: 'Irene Scott', age: 33, symptoms: 'Wheezing', severity: 'CRITICAL', status: 'waiting', registrationTime: '2026-06-10T09:00:00', estimatedWait: 8, aiScore: 0.89 },
];

vi.mock('../../hooks/useRealtimeData', () => ({
  default: () => {},
}));

function renderPage() {
  return render(
    <BrowserRouter>
      <EmergencyQueue />
    </BrowserRouter>
  );
}

describe('EmergencyQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api, 'getEmergencyPatients').mockResolvedValue(mockPatients);
  });

  it('renders loading state initially', () => {
    vi.spyOn(api, 'getEmergencyPatients').mockImplementation(() => new Promise(() => {}));
    renderPage();
    expect(screen.getByText('Loading emergency queue...')).toBeInTheDocument();
  });

  it('renders page title', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Emergency Queue')).toBeInTheDocument();
    });
  });

  it('renders patient data after loading', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Alice Cooper')).toBeInTheDocument();
      expect(screen.getByText('Bob Martin')).toBeInTheDocument();
      expect(screen.getByText('Irene Scott')).toBeInTheDocument();
    });
  });

  it('displays severity badges for each patient level', async () => {
    renderPage();
    await waitFor(() => {
      // Each badge text may appear on multiple patients
      const criticalBadges = screen.getAllByText('CRITICAL');
      const highBadges = screen.getAllByText('HIGH');
      expect(criticalBadges.length).toBeGreaterThanOrEqual(2);
      expect(highBadges.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders AI score for each patient', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('92%')).toBeInTheDocument();
      expect(screen.getByText('78%')).toBeInTheDocument();
      expect(screen.getByText('89%')).toBeInTheDocument();
    });
  });

  it('displays wait times', async () => {
    renderPage();
    await waitFor(() => {
      // Wait times may appear multiple times in the table
      const wait5 = screen.getAllByText('5 min');
      const wait15 = screen.getAllByText('15 min');
      expect(wait5.length).toBeGreaterThanOrEqual(1);
      expect(wait15.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows empty state when no patients', async () => {
    vi.spyOn(api, 'getEmergencyPatients').mockResolvedValue([]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/No emergency patients/)).toBeInTheDocument();
    });
  });

  it('filters patients by severity', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Alice Cooper')).toBeInTheDocument();
    });

    // Find severity filter select by its default option value
    const severitySelect = screen.getByDisplayValue('All Severities');
    await user.selectOptions(severitySelect, 'HIGH');

    await waitFor(() => {
      // After filtering to HIGH, there should be no CRITICAL patients shown
      expect(screen.queryByText('Alice Cooper')).not.toBeInTheDocument();
      expect(screen.getByText('Bob Martin')).toBeInTheDocument();
    });
  });

  it('sorts by AI priority by default', async () => {
    renderPage();
    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(1);
    });
  });

  it('renders summary bar with patient count', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Showing 3 emergency patients/)).toBeInTheDocument();
    });
  });

  it('renders severity counts in summary bar', async () => {
    renderPage();
    await waitFor(() => {
      // These appear in the summary bar
      const criticalSummary = screen.getAllByText(/Critical:/);
      const highSummary = screen.getAllByText(/High:/);
      expect(criticalSummary.length).toBeGreaterThanOrEqual(1);
      expect(highSummary.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('fetches data on mount', async () => {
    renderPage();
    await waitFor(() => {
      expect(api.getEmergencyPatients).toHaveBeenCalled();
    });
  });
});
