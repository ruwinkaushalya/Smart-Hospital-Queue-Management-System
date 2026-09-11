import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import PatientHistory from '../../pages/PatientHistory';
import * as api from '../../services/api';

const mockRecords = [
  { id: 'VR-001', patientId: 'P001', patientName: 'Alice Cooper', type: 'EMERGENCY', typeLabel: 'Emergency', diagnosis: 'Chest pain', treatment: 'ECG monitoring', doctorName: 'Dr. Smith', hospitalName: 'City General', visitDate: '2026-06-10', medicationCost: 50.00, procedureCost: 200.00, bedCost: 0, totalCost: 250.00, notes: 'Stable' },
  { id: 'VR-002', patientId: 'P002', patientName: 'Bob Martin', type: 'CONSULTATION', typeLabel: 'Consultation', diagnosis: 'Migraine', treatment: 'Medication', doctorName: 'Dr. Jones', hospitalName: 'Metro Medical', visitDate: '2026-06-09', medicationCost: 25.00, procedureCost: 0, bedCost: 0, totalCost: 25.00, notes: '' },
];

const mockPatients = [
  { id: 'P001', name: 'Alice Cooper' },
  { id: 'P002', name: 'Bob Martin' },
];

const mockDoctors = [
  { id: 'D001', name: 'Dr. Smith', specialty: 'Cardiology' },
  { id: 'D002', name: 'Dr. Jones', specialty: 'Neurology' },
];

vi.mock('../../services/api', async () => {
  const actual = await vi.importActual('../../services/api');
  return {
    ...actual,
    subscribeToRealtime: vi.fn(() => () => {}),
  };
});

function renderPage() {
  return render(<BrowserRouter><PatientHistory /></BrowserRouter>);
}

describe('PatientHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api, 'getVisitRecords').mockResolvedValue(mockRecords);
    vi.spyOn(api, 'getPatients').mockResolvedValue(mockPatients);
    vi.spyOn(api, 'getDoctors').mockResolvedValue(mockDoctors);
  });

  it('renders loading state initially', () => {
    vi.spyOn(api, 'getVisitRecords').mockImplementation(() => new Promise(() => {}));
    renderPage();
    expect(screen.getByText('Loading patient history...')).toBeInTheDocument();
  });

  it('renders page title', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Patient Medical History (Linked List)')).toBeInTheDocument();
    });
  });

  it('renders patient record names', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Alice Cooper')).toBeInTheDocument();
      expect(screen.getByText('Bob Martin')).toBeInTheDocument();
    });
  });

  it('renders stat cards', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Total Records')).toBeInTheDocument();
      expect(screen.getByText('Patients')).toBeInTheDocument();
      expect(screen.getByText('Emergency Visits')).toBeInTheDocument();
      expect(screen.getByText('Total Cost')).toBeInTheDocument();
    });
  });

  it('renders data structure info', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Data Structure: Doubly Linked List')).toBeInTheDocument();
    });
  });

  it('renders visit type badges', async () => {
    renderPage();
    await waitFor(() => {
      const emergencies = screen.getAllByText('Emergency');
      const consultations = screen.getAllByText('Consultation');
      expect(emergencies.length).toBeGreaterThanOrEqual(1);
      expect(consultations.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders add record button', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Add Record')).toBeInTheDocument();
    });
  });

  it('renders filter dropdown with patient names', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Filter by Patient:')).toBeInTheDocument();
      expect(screen.getByText('All Patients')).toBeInTheDocument();
    });
  });

  it('shows record count', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Showing 2 of 2 records/)).toBeInTheDocument();
    });
  });

  it('renders generate invoice buttons', async () => {
    renderPage();
    await waitFor(() => {
      const generateBtns = screen.getAllByText('Generate Invoice');
      expect(generateBtns.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('generates invoice from record', async () => {
    vi.spyOn(api, 'generateInvoiceFromVisit').mockResolvedValue({ success: true });
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      const btns = screen.getAllByText('Generate Invoice');
      expect(btns.length).toBeGreaterThanOrEqual(1);
    });

    // Records are rendered in reverse order, so the last rendered button is for the first record
    const generateBtns = screen.getAllByText('Generate Invoice');
    await user.click(generateBtns[generateBtns.length - 1]);

    await waitFor(() => {
      expect(api.generateInvoiceFromVisit).toHaveBeenCalledWith('VR-001');
    });
  });

  it('opens add record modal', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => expect(screen.getByText('Add Record')).toBeInTheDocument());
    await user.click(screen.getByText('Add Record'));

    await waitFor(() => {
      expect(screen.getByText('Add Visit Record')).toBeInTheDocument();
    });
  });

  it('shows empty state when no records', async () => {
    vi.spyOn(api, 'getVisitRecords').mockResolvedValue([]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('No visit records found.')).toBeInTheDocument();
    });
  });

  it('shows diagnosis and treatment text', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Chest pain/)).toBeInTheDocument();
      expect(screen.getByText(/ECG monitoring/)).toBeInTheDocument();
    });
  });

  it('fetches all data on mount', async () => {
    renderPage();
    await waitFor(() => {
      expect(api.getVisitRecords).toHaveBeenCalled();
      expect(api.getPatients).toHaveBeenCalled();
      expect(api.getDoctors).toHaveBeenCalled();
    });
  });
});
