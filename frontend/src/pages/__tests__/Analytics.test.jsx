import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Analytics from '../../pages/Analytics';
import * as api from '../../services/api';

const mockAnalytics = {
  queueStats: { totalWaiting: 10, emergencyCount: 3, normalCount: 7, treatedCount: 15, avgWaitTime: 25, pendingBeds: 2, availableDoctors: 5, status: 'MODERATE', throughput: 8 },
  severityDistribution: [{ name: 'CRITICAL', value: 3 }, { name: 'HIGH', value: 4 }, { name: 'MODERATE', value: 5 }, { name: 'LOW', value: 3 }],
  hospitalPerformance: [
    { name: 'City General', load: 75, beds: '45/200', icu: '8/20' },
    { name: 'Metro Medical', load: 60, beds: '60/150', icu: '10/15' },
  ],
};

vi.mock('../../hooks/useRealtimeData', () => ({
  default: () => {},
}));

const mockHourlyVolume = [
  { hour: '08:00', emergency: 2, normal: 3 },
  { hour: '12:00', emergency: 4, normal: 6 },
];

const mockWaitTimeTrend = [
  { day: 'Mon', avgWait: 30, predicted: 28 },
  { day: 'Tue', avgWait: 35, predicted: 32 },
];

function renderPage() {
  return render(<BrowserRouter><Analytics /></BrowserRouter>);
}

describe('Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api, 'getAnalytics').mockResolvedValue(mockAnalytics);
  });

  it('renders loading state initially', () => {
    vi.spyOn(api, 'getAnalytics').mockImplementation(() => new Promise(() => {}));
    renderPage();
    expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
  });

  it('renders page title', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('AI Analytics & Insights')).toBeInTheDocument();
    });
  });

  it('renders export button', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Export Data')).toBeInTheDocument();
    });
  });

  it('renders tab navigation', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Severity')).toBeInTheDocument();
      expect(screen.getByText('Volume')).toBeInTheDocument();
      expect(screen.getByText('AI Prediction')).toBeInTheDocument();
      expect(screen.getByText('Hospitals')).toBeInTheDocument();
    });
  });

  it('renders queue performance metrics in overview tab', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Queue Performance Metrics')).toBeInTheDocument();
      expect(screen.getByText('AI Insights')).toBeInTheDocument();
    });
  });

  it('renders AI insights section', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('AI Insights')).toBeInTheDocument();
    });
  });

  it('switches to severity tab', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => expect(screen.getByText('Severity')).toBeInTheDocument());
    await user.click(screen.getByText('Severity'));

    await waitFor(() => {
      expect(screen.getByText('Severity Distribution')).toBeInTheDocument();
      expect(screen.getByText('Severity by Count')).toBeInTheDocument();
    });
  });

  it('switches to volume tab', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => expect(screen.getByText('Volume')).toBeInTheDocument());
    await user.click(screen.getByText('Volume'));

    await waitFor(() => {
      expect(screen.getByText('Hourly Patient Volume')).toBeInTheDocument();
    });
  });

  it('switches to AI prediction tab', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => expect(screen.getByText('AI Prediction')).toBeInTheDocument());
    await user.click(screen.getByText('AI Prediction'));

    await waitFor(() => {
      expect(screen.getByText(/AI Wait Time Prediction/)).toBeInTheDocument();
      expect(screen.getByText('Prediction Accuracy')).toBeInTheDocument();
    });
  });

  it('switches to hospitals tab', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => expect(screen.getByText('Hospitals')).toBeInTheDocument());
    await user.click(screen.getByText('Hospitals'));

    await waitFor(() => {
      expect(screen.getByText('Hospital Load & Capacity')).toBeInTheDocument();
    });
  });

  it('shows metric rows in overview', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Total Waiting')).toBeInTheDocument();
      expect(screen.getByText('Critical Cases')).toBeInTheDocument();
      expect(screen.getByText('Avg Wait Time')).toBeInTheDocument();
      expect(screen.getByText('Total Treated')).toBeInTheDocument();
    });
  });

  it('fetches analytics on mount', async () => {
    renderPage();
    await waitFor(() => {
      expect(api.getAnalytics).toHaveBeenCalled();
    });
  });
});
