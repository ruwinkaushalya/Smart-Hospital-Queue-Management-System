import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Registration from '../../pages/Registration';
import * as api from '../../services/api';

vi.mock('../../services/api', async () => {
  const actual = await vi.importActual('../../services/api');
  return {
    ...actual,
    createPatient: vi.fn(),
  };
});

function renderPage() {
  return render(<BrowserRouter><Registration /></BrowserRouter>);
}

describe('Registration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    renderPage();
    expect(screen.getByText('Loading registration...')).toBeInTheDocument();
  });

  it('renders page title after loading', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Patient Registration')).toBeInTheDocument();
    });
  });

  it('renders form fields', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByLabelText('Full Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Age *')).toBeInTheDocument();
      expect(screen.getByLabelText('Contact Number *')).toBeInTheDocument();
      expect(screen.getByLabelText('Symptoms *')).toBeInTheDocument();
      expect(screen.getByLabelText('Severity Level *')).toBeInTheDocument();
    });
  });

  it('renders AI analyze and register buttons', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('AI Analyze Symptoms')).toBeInTheDocument();
      expect(screen.getByText('Register Patient')).toBeInTheDocument();
      expect(screen.getByText('Clear')).toBeInTheDocument();
    });
  });

  it('renders AI Decision Support panel', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('AI Decision Support')).toBeInTheDocument();
    });
  });

  it('shows severity guide', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Life threatening/)).toBeInTheDocument();
      expect(screen.getByText(/Severe injury/)).toBeInTheDocument();
    });
  });

  it('shows validation errors on empty submit', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => expect(screen.getByText('Register Patient')).toBeInTheDocument());

    await user.click(screen.getByText('Register Patient'));

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Age is required')).toBeInTheDocument();
      expect(screen.getByText('Contact number is required')).toBeInTheDocument();
      expect(screen.getByText('Symptoms description is required')).toBeInTheDocument();
    });
  });

  it('submits form successfully', async () => {
    vi.spyOn(api, 'createPatient').mockResolvedValue({ id: 'P001' });
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => expect(screen.getByText('Patient Registration')).toBeInTheDocument());

    await user.type(screen.getByLabelText('Full Name *'), 'Test Patient');
    await user.type(screen.getByLabelText('Age *'), '30');
    await user.type(screen.getByLabelText('Contact Number *'), '071-1111111');
    await user.type(screen.getByLabelText('Symptoms *'), 'Fever and cough');

    await user.click(screen.getByText('Register Patient'));

    await waitFor(() => {
      expect(api.createPatient).toHaveBeenCalledWith({
        name: 'Test Patient',
        age: '30',
        contact: '071-1111111',
        symptoms: 'Fever and cough',
        severity: 'MODERATE',
      });
    });
  });

  it('shows success message after registration', async () => {
    vi.spyOn(api, 'createPatient').mockResolvedValue({ id: 'P001' });
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => expect(screen.getByText('Patient Registration')).toBeInTheDocument());

    await user.type(screen.getByLabelText('Full Name *'), 'Test Patient');
    await user.type(screen.getByLabelText('Age *'), '30');
    await user.type(screen.getByLabelText('Contact Number *'), '071-1111111');
    await user.type(screen.getByLabelText('Symptoms *'), 'Fever');
    await user.click(screen.getByText('Register Patient'));

    await waitFor(() => {
      expect(screen.getByText('Patient registered successfully!')).toBeInTheDocument();
    });
  });

  it('analyzes symptoms with AI', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => expect(screen.getByText('Patient Registration')).toBeInTheDocument());

    await user.type(screen.getByLabelText('Symptoms *'), 'Chest pain and difficulty breathing');
    await user.click(screen.getByText('AI Analyze Symptoms'));

    await waitFor(() => {
      expect(screen.getByText('AI Suggested Severity')).toBeInTheDocument();
    });
  });

  it('clears form on clear button click', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => expect(screen.getByText('Patient Registration')).toBeInTheDocument());

    await user.type(screen.getByLabelText('Full Name *'), 'Test Patient');
    await user.click(screen.getByText('Clear'));

    await waitFor(() => {
      expect(screen.getByLabelText('Full Name *')).toHaveValue('');
    });
  });

  it('validates age range', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => expect(screen.getByText('Patient Registration')).toBeInTheDocument());

    await user.type(screen.getByLabelText('Full Name *'), 'Test');
    await user.type(screen.getByLabelText('Age *'), '200');
    await user.type(screen.getByLabelText('Contact Number *'), '071-1111111');
    await user.type(screen.getByLabelText('Symptoms *'), 'Fever');
    await user.click(screen.getByText('Register Patient'));

    await waitFor(() => {
      expect(screen.getByText('Valid age 0-120 required')).toBeInTheDocument();
    });
  });

  it('shows link to treatment panel', async () => {
    renderPage();
    await waitFor(() => {
      const link = screen.getByText('Treatment Panel');
      expect(link.closest('a')).toHaveAttribute('href', '/treatment');
    });
  });

  it('handles registration error', async () => {
    vi.spyOn(api, 'createPatient').mockRejectedValue(new Error('API error'));
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => expect(screen.getByText('Patient Registration')).toBeInTheDocument());

    await user.type(screen.getByLabelText('Full Name *'), 'Test');
    await user.type(screen.getByLabelText('Age *'), '30');
    await user.type(screen.getByLabelText('Contact Number *'), '071-1111111');
    await user.type(screen.getByLabelText('Symptoms *'), 'Fever');
    await user.click(screen.getByText('Register Patient'));

    // Should not show success message on error
    await waitFor(() => {
      expect(screen.queryByText('Patient registered successfully!')).not.toBeInTheDocument();
    });
  });
});
