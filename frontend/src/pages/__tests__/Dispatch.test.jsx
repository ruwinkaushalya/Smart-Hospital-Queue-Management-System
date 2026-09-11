import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Dispatch from '../../pages/Dispatch';
import * as api from '../../services/api';

const mockHospitals = [
  { id: 'H1', name: 'City General Hospital', availableBeds: 45, totalBeds: 200, availableICU: 8, totalICU: 20, doctors: 15, availableDoctors: 5, hasEmergency: true },
  { id: 'H2', name: 'Metro Medical Center', availableBeds: 60, totalBeds: 150, availableICU: 10, totalICU: 15, doctors: 10, availableDoctors: 7, hasEmergency: true },
];

const mockRoads = [
  { from: 'H1', to: 'H2', distance: 8.5 },
];

const mockAmbulances = [
  { id: 'A001', driver: 'John Smith', status: 'AVAILABLE', patient: null, destination: null, distance: 0, eta: 0 },
  { id: 'A002', driver: 'Sarah Johnson', status: 'DISPATCHED', patient: 'Bob Martin', destination: 'City General Hospital', distance: 3.2, eta: 8 },
];

vi.mock('../../hooks/useRealtimeData', () => ({
  default: () => {},
}));

function renderPage() {
  return render(<BrowserRouter><Dispatch /></BrowserRouter>);
}

describe('Dispatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api, 'getHospitals').mockResolvedValue(mockHospitals);
    vi.spyOn(api, 'getRoads').mockResolvedValue(mockRoads);
    vi.spyOn(api, 'getAmbulances').mockResolvedValue(mockAmbulances);
  });

  it('renders loading state initially', () => {
    vi.spyOn(api, 'getHospitals').mockImplementation(() => new Promise(() => {}));
    renderPage();
    expect(screen.getByText('Loading dispatch panel...')).toBeInTheDocument();
  });

  it('renders page title', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Ambulance Dispatch & Hospital Network')).toBeInTheDocument();
    });
  });

  it('renders hospitals in table', async () => {
    renderPage();
    await waitFor(() => {
      // Hospital names appear in both table and select dropdowns
      const hospitals = screen.getAllByText('City General Hospital');
      expect(hospitals.length).toBeGreaterThanOrEqual(1);
      const metros = screen.getAllByText('Metro Medical Center');
      expect(metros.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders road connections', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/H1.*H2/)).toBeInTheDocument();
      expect(screen.getByText(/8.5 km/)).toBeInTheDocument();
    });
  });

  it('renders ambulance table with data', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
    });
  });

  it('renders shortest path section', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Shortest Path (Dijkstra)')).toBeInTheDocument();
      expect(screen.getByText('Calculate Shortest Path')).toBeInTheDocument();
    });
  });

  it('renders from/to hospital selects', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByLabelText('From Hospital')).toBeInTheDocument();
      expect(screen.getByLabelText('To Hospital')).toBeInTheDocument();
    });
  });

  it('calculates shortest path', async () => {
    vi.spyOn(api, 'getShortestPath').mockResolvedValue({
      path: ['H1', 'H9', 'H5'],
      distance: 10.9,
      time: 16,
    });

    const user = userEvent.setup();
    renderPage();

    await waitFor(() => expect(screen.getByText('Calculate Shortest Path')).toBeInTheDocument());

    // Select different hospitals first
    const fromSelect = screen.getByLabelText('From Hospital');
    const toSelect = screen.getByLabelText('To Hospital');
    await user.selectOptions(fromSelect, 'H1');
    await user.selectOptions(toSelect, 'H2');

    await user.click(screen.getByText('Calculate Shortest Path'));

    await waitFor(() => {
      expect(api.getShortestPath).toHaveBeenCalled();
    });
  });

  it('shows path result nodes after calculation', async () => {
    vi.spyOn(api, 'getShortestPath').mockResolvedValue({
      path: ['H1', 'H9', 'H5'],
      distance: 10.9,
      time: 16,
    });

    const user = userEvent.setup();
    renderPage();

    await waitFor(() => expect(screen.getByText('Calculate Shortest Path')).toBeInTheDocument());

    const fromSelect = screen.getByLabelText('From Hospital');
    const toSelect = screen.getByLabelText('To Hospital');
    await user.selectOptions(fromSelect, 'H1');
    await user.selectOptions(toSelect, 'H2');

    await user.click(screen.getByText('Calculate Shortest Path'));

    await waitFor(() => {
      // The path nodes appear as badges
      const h1Nodes = screen.getAllByText('H1');
      const h5Nodes = screen.getAllByText('H5');
      expect(h1Nodes.length).toBeGreaterThanOrEqual(1);
      expect(h5Nodes.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows error when selecting same hospital for path', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      const fromSelect = screen.getByLabelText('From Hospital');
      const toSelect = screen.getByLabelText('To Hospital');
      return fromSelect && toSelect;
    });

    const fromSelect = screen.getByLabelText('From Hospital');
    await user.selectOptions(fromSelect, 'H1');
    const toSelect = screen.getByLabelText('To Hospital');
    await user.selectOptions(toSelect, 'H1');

    await user.click(screen.getByText('Calculate Shortest Path'));

    await waitFor(() => {
      expect(screen.getByText('Select different hospitals')).toBeInTheDocument();
    });
  });

  it('renders dispatch buttons', async () => {
    renderPage();
    await waitFor(() => {
      const emergencyBtns = screen.getAllByText('Dispatch Emergency');
      expect(emergencyBtns.length).toBeGreaterThanOrEqual(1);
      const transportBtns = screen.getAllByText('Dispatch Transport');
      expect(transportBtns.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows available ambulance count', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Available ambulances: 1/)).toBeInTheDocument();
    });
  });

  it('opens modal on dispatch emergency click', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      const btns = screen.getAllByText('Dispatch Emergency');
      expect(btns.length).toBeGreaterThanOrEqual(1);
    });

    // Click the main Dispatch Emergency button to open the modal
    const dispatchBtn = screen.getByText('Dispatch Emergency');
    await user.click(dispatchBtn);

    await waitFor(() => {
      expect(screen.getByText('Dispatch Emergency Ambulance')).toBeInTheDocument();
      expect(screen.getByText('Destination Hospital')).toBeInTheDocument();
    });
  });

  it('sends dispatch from modal', async () => {
    vi.spyOn(api, 'dispatchAmbulance').mockResolvedValue({
      success: true,
      ambulanceId: 'A001',
      hospital: 'City General Hospital',
      message: 'Emergency dispatched: A001 → City General Hospital',
      ambulance: { id: 'A001' },
      distanceKm: 5.5,
      estimatedTimeMinutes: 12,
    });

    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      const btns = screen.getAllByText('Dispatch Emergency');
      expect(btns.length).toBeGreaterThanOrEqual(1);
    });

    // Open the modal by clicking the main dispatch button
    const dispatchBtn = screen.getByText('Dispatch Emergency');
    await user.click(dispatchBtn);

    await waitFor(() => expect(screen.getByText('Dispatch Emergency Ambulance')).toBeInTheDocument());

    // Click the dispatch button inside the modal (now there are 2 Dispatch Emergency buttons)
    const modalBtns = screen.getAllByText('Dispatch Emergency');
    await user.click(modalBtns[1]);

    await waitFor(() => {
      expect(api.dispatchAmbulance).toHaveBeenCalled();
    });
  });

  it('handles dispatch failure message', async () => {
    vi.spyOn(api, 'dispatchAmbulance').mockResolvedValue({
      success: false,
      message: 'No available ambulances',
    });

    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      const btns = screen.getAllByText('Dispatch Transport');
      expect(btns.length).toBeGreaterThanOrEqual(1);
    });

    // Open the transport modal by clicking the main transport button
    const transportBtn = screen.getByText('Dispatch Transport');
    await user.click(transportBtn);

    await waitFor(() => expect(screen.getByText('Dispatch Transport Ambulance')).toBeInTheDocument());

    // Click dispatch in the modal (now there are 2 Dispatch Transport buttons)
    const modalBtns = screen.getAllByText('Dispatch Transport');
    await user.click(modalBtns[1]);

    await waitFor(() => {
      expect(api.dispatchAmbulance).toHaveBeenCalled();
    });
  });
});
