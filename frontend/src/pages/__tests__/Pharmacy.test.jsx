import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Pharmacy from '../../pages/Pharmacy';
import * as api from '../../services/api';

const mockMedications = [
  { id: 'MED-1', name: 'Paracetamol', category: 'Pain Relief', stock: 500, reorderThreshold: 50, pricePerUnit: 2.50, expiryDate: '2027-06-10', isExpired: false, isLowStock: false, supplier: 'PharmaCorp', dosage: '500mg', unit: 'Tablet', description: 'For fever', inventoryValue: 1250 },
  { id: 'MED-2', name: 'Amoxicillin', category: 'Antibiotic', stock: 15, reorderThreshold: 30, pricePerUnit: 15.00, expiryDate: '2026-12-10', isExpired: false, isLowStock: true, supplier: 'MediSupply', dosage: '250mg', unit: 'Capsule', description: 'Antibiotic', inventoryValue: 225 },
  { id: 'MED-3', name: 'Adrenaline', category: 'Emergency', stock: 25, reorderThreshold: 5, pricePerUnit: 45.00, expiryDate: '2024-01-01', isExpired: true, isLowStock: false, supplier: 'EmergencyPharm', dosage: '1mg/ml', unit: 'Ampoule', description: 'Emergency stimulant', inventoryValue: 1125 },
];

vi.mock('../../services/api', async () => {
  const actual = await vi.importActual('../../services/api');
  return {
    ...actual,
    subscribeToRealtime: vi.fn(() => () => {}),
  };
});

function renderPage() {
  return render(<BrowserRouter><Pharmacy /></BrowserRouter>);
}

describe('Pharmacy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api, 'getMedications').mockResolvedValue(mockMedications);
    vi.spyOn(api, 'getLowStockMedications').mockResolvedValue(mockMedications.filter(m => m.isLowStock));
    vi.spyOn(api, 'getExpiredMedications').mockResolvedValue(mockMedications.filter(m => m.isExpired));
  });

  it('renders loading state initially', () => {
    vi.spyOn(api, 'getMedications').mockImplementation(() => new Promise(() => {}));
    renderPage();
    expect(screen.getByText('Loading pharmacy inventory...')).toBeInTheDocument();
  });

  it('renders page title', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Pharmacy Inventory (BST)')).toBeInTheDocument();
    });
  });

  it('renders medication count stat', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Medications')).toBeInTheDocument();
    });
  });

  it('renders medication names in table', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Paracetamol')).toBeInTheDocument();
      expect(screen.getByText('Amoxicillin')).toBeInTheDocument();
      expect(screen.getByText('Adrenaline')).toBeInTheDocument();
    });
  });

  it('renders category badges', async () => {
    renderPage();
    await waitFor(() => {
      // Category names may appear in both badges and the filter dropdown
      const painRelief = screen.getAllByText('Pain Relief');
      expect(painRelief.length).toBeGreaterThanOrEqual(1);
      const antibiotic = screen.getAllByText('Antibiotic');
      expect(antibiotic.length).toBeGreaterThanOrEqual(1);
      const emergency = screen.getAllByText('Emergency');
      expect(emergency.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows low stock alert', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Low Stock Alerts (1)')).toBeInTheDocument();
    });
  });

  it('shows low stock medication name', async () => {
    renderPage();
    await waitFor(() => {
      // Amoxicillin appears in both table and low stock alert
      const amoxItems = screen.getAllByText(/Amoxicillin/);
      expect(amoxItems.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows expired alert section', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Expired Medications (1)')).toBeInTheDocument();
    });
  });

  it('shows expired medication detail', async () => {
    renderPage();
    await waitFor(() => {
      // Expired medication detail shows in the alert section
      const expItems = screen.getAllByText(/exp: 2024-01-01/);
      expect(expItems.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders total inventory value stat', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Inventory Value')).toBeInTheDocument();
    });
  });

  it('renders stock status badges', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('OK')).toBeInTheDocument();
      const lowBadges = screen.getAllByText('LOW');
      expect(lowBadges.length).toBeGreaterThanOrEqual(1);
      const expiredBadges = screen.getAllByText('EXPIRED');
      expect(expiredBadges.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders BST info section', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Data Structure: Binary Search Tree')).toBeInTheDocument();
    });
  });

  it('renders search input', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search medications by name...')).toBeInTheDocument();
    });
  });

  it('renders add medication button', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Add')).toBeInTheDocument();
    });
  });

  it('searches medications by name', async () => {
    vi.spyOn(api, 'searchMedications').mockResolvedValue([mockMedications[0]]);
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => expect(screen.getByText('Paracetamol')).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText('Search medications by name...');
    await user.type(searchInput, 'Paracetamol');

    const searchBtn = screen.getByText('Search');
    await user.click(searchBtn);

    await waitFor(() => {
      expect(api.searchMedications).toHaveBeenCalledWith('Paracetamol');
    });
  });

  it('opens add medication modal', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => expect(screen.getByText('Add')).toBeInTheDocument());
    await user.click(screen.getByText('Add'));

    await waitFor(() => {
      expect(screen.getByText('Add New Medication')).toBeInTheDocument();
      expect(screen.getByText('Name *')).toBeInTheDocument();
      expect(screen.getByText('Category *')).toBeInTheDocument();
    });
  });

  it('updates medication stock', async () => {
    vi.spyOn(api, 'updateMedicationStock').mockResolvedValue({ success: true });
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => expect(screen.getByText('Paracetamol')).toBeInTheDocument());

    const increaseButtons = screen.getAllByTitle('Increase stock');
    await user.click(increaseButtons[0]);

    await waitFor(() => {
      expect(api.updateMedicationStock).toHaveBeenCalledWith('MED-1', 1);
    });
  });

  it('shows empty state when no medications', async () => {
    vi.spyOn(api, 'getMedications').mockResolvedValue([]);
    vi.spyOn(api, 'getLowStockMedications').mockResolvedValue([]);
    vi.spyOn(api, 'getExpiredMedications').mockResolvedValue([]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('No medications found.')).toBeInTheDocument();
    });
  });

  it('fetches all data on mount', async () => {
    renderPage();
    await waitFor(() => {
      expect(api.getMedications).toHaveBeenCalled();
      expect(api.getLowStockMedications).toHaveBeenCalled();
      expect(api.getExpiredMedications).toHaveBeenCalled();
    });
  });
});
