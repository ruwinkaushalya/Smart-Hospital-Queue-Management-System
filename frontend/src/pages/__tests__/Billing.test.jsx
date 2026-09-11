import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Billing from '../../pages/Billing';
import * as api from '../../services/api';

const mockInvoices = [
  { id: 'INV-001', invoiceNumber: 'INV-2026-001', patientName: 'Alice Cooper', type: 'EMERGENCY', typeLabel: 'Emergency', baseAmount: 500.00, tax: 50.00, totalAmount: 550.00, status: 'PAID', statusLabel: 'Paid', hospitalName: 'City General' },
  { id: 'INV-002', invoiceNumber: 'INV-2026-002', patientName: 'Bob Martin', type: 'CONSULTATION', typeLabel: 'Consultation', baseAmount: 150.00, tax: 15.00, totalAmount: 165.00, status: 'PENDING', statusLabel: 'Pending', hospitalName: 'Metro Medical' },
];

const mockRevenue = { totalInvoices: 2, paidInvoices: 1, pendingInvoices: 1, totalRevenue: 715.00 };
const mockPatients = [{ id: 'P001', name: 'Alice Cooper' }, { id: 'P002', name: 'Bob Martin' }];
const mockDoctors = [{ id: 'D001', name: 'Dr. Smith', specialty: 'Cardiology' }];
const mockHospitals = [{ id: 'H1', name: 'City General' }];
const mockVisitRecords = [];

vi.mock('../../services/api', async () => {
  const actual = await vi.importActual('../../services/api');
  return {
    ...actual,
    subscribeToRealtime: vi.fn(() => () => {}),
  };
});

function renderPage() {
  return render(<BrowserRouter><Billing /></BrowserRouter>);
}

describe('Billing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api, 'getInvoices').mockResolvedValue(mockInvoices);
    vi.spyOn(api, 'getRevenueAnalytics').mockResolvedValue(mockRevenue);
    vi.spyOn(api, 'getPatients').mockResolvedValue(mockPatients);
    vi.spyOn(api, 'getDoctors').mockResolvedValue(mockDoctors);
    vi.spyOn(api, 'getHospitals').mockResolvedValue(mockHospitals);
    vi.spyOn(api, 'getVisitRecords').mockResolvedValue(mockVisitRecords);
  });

  it('renders loading state initially', () => {
    vi.spyOn(api, 'getInvoices').mockImplementation(() => new Promise(() => {}));
    renderPage();
    expect(screen.getByText('Loading billing...')).toBeInTheDocument();
  });

  it('renders page title', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Billing & Invoices')).toBeInTheDocument();
    });
  });

  it('renders patient names in invoice table', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Alice Cooper')).toBeInTheDocument();
      expect(screen.getByText('Bob Martin')).toBeInTheDocument();
    });
  });

  it('renders invoice status badges', async () => {
    renderPage();
    await waitFor(() => {
      const paidBadges = screen.getAllByText('Paid');
      const pendingBadges = screen.getAllByText('Pending');
      expect(paidBadges.length).toBeGreaterThanOrEqual(1);
      expect(pendingBadges.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders revenue stat cards', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      const paidTexts = screen.getAllByText('Paid');
      expect(paidTexts.length).toBeGreaterThanOrEqual(1);
      const pendingTexts = screen.getAllByText('Pending');
      expect(pendingTexts.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Invoices')).toBeInTheDocument();
    });
  });

  it('renders invoice type badges', async () => {
    renderPage();
    await waitFor(() => {
      const emergencies = screen.getAllByText('Emergency');
      const consultations = screen.getAllByText('Consultation');
      expect(emergencies.length).toBeGreaterThanOrEqual(1);
      expect(consultations.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders invoice numbers', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('INV-2026-001')).toBeInTheDocument();
      expect(screen.getByText('INV-2026-002')).toBeInTheDocument();
    });
  });

  it('renders filter buttons', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('PENDING')).toBeInTheDocument();
      expect(screen.getByText('PAID')).toBeInTheDocument();
      expect(screen.getByText('OVERDUE')).toBeInTheDocument();
    });
  });

  it('shows invoice count in filter bar', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Showing 2 of 2 invoices/)).toBeInTheDocument();
    });
  });

  it('renders new invoice button', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('New Invoice')).toBeInTheDocument();
    });
  });

  it('opens modal on new invoice click', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => expect(screen.getByText('New Invoice')).toBeInTheDocument());
    await user.click(screen.getByText('New Invoice'));

    await waitFor(() => {
      expect(screen.getByText('Generate New Invoice')).toBeInTheDocument();
      expect(screen.getByText('Manual Entry')).toBeInTheDocument();
      expect(screen.getByText('From Visit Record')).toBeInTheDocument();
    });
  });

  it('marks invoice as paid', async () => {
    vi.spyOn(api, 'payInvoice').mockResolvedValue({ success: true });
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => expect(screen.getByText('Bob Martin')).toBeInTheDocument());

    const payButtons = screen.getAllByText('Pay');
    await user.click(payButtons[0]);

    await waitFor(() => {
      expect(api.payInvoice).toHaveBeenCalledWith('INV-002');
    });
  });

  it('shows empty state when no invoices', async () => {
    vi.spyOn(api, 'getInvoices').mockResolvedValue([]);
    vi.spyOn(api, 'getRevenueAnalytics').mockResolvedValue({});
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('No invoices found.')).toBeInTheDocument();
    });
  });

  it('fetches all data on mount', async () => {
    renderPage();
    await waitFor(() => {
      expect(api.getInvoices).toHaveBeenCalled();
      expect(api.getRevenueAnalytics).toHaveBeenCalled();
      expect(api.getPatients).toHaveBeenCalled();
      expect(api.getDoctors).toHaveBeenCalled();
      expect(api.getHospitals).toHaveBeenCalled();
    });
  });
});
