import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Notifications from '../../pages/Notifications';
import * as api from '../../services/api';

const mockBackendNotifications = {
  notifications: [
    { id: 'N001', type: 'SMS', message: 'Appointment reminder', recipientType: 'PATIENT', timestamp: '2026-06-10T10:00:00Z', status: 'DELIVERED' },
    { id: 'N002', type: 'EMAIL', message: 'Lab results ready', recipientType: 'PATIENT', timestamp: '2026-06-10T09:00:00Z', status: 'SENT' },
  ],
};

vi.mock('../../hooks/usePatientNotifications', () => ({
  default: () => ({
    notifications: [],
    dismissNotification: vi.fn(),
  }),
}));

vi.mock('../../hooks/useRealtimeData', () => ({
  default: () => {},
}));

function renderPage() {
  return render(<BrowserRouter><Notifications /></BrowserRouter>);
}

describe('Notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api, 'getNotifications').mockResolvedValue(mockBackendNotifications);
  });

  it('renders loading state initially', () => {
    vi.spyOn(api, 'getNotifications').mockImplementation(() => new Promise(() => {}));
    renderPage();
    expect(screen.getByText('Loading notifications...')).toBeInTheDocument();
  });

  it('renders page title', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Notifications Center')).toBeInTheDocument();
    });
  });

  it('renders filter buttons', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('Unread')).toBeInTheDocument();
      expect(screen.getByText('Critical')).toBeInTheDocument();
      expect(screen.getByText('Dispatch')).toBeInTheDocument();
      expect(screen.getByText('Queue')).toBeInTheDocument();
      expect(screen.getByText('Beds')).toBeInTheDocument();
    });
  });

  it('renders backend notification messages', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Appointment reminder/)).toBeInTheDocument();
      expect(screen.getByText(/Lab results ready/)).toBeInTheDocument();
    });
  });

  it('renders action buttons', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Mark All Read')).toBeInTheDocument();
      expect(screen.getByText('Clear')).toBeInTheDocument();
    });
  });

  it('shows empty state when no notifications', async () => {
    vi.spyOn(api, 'getNotifications').mockResolvedValue({ notifications: [] });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('No notifications matching your filter.')).toBeInTheDocument();
    });
  });

  it('renders notification type badges', async () => {
    renderPage();
    await waitFor(() => {
      const smsBadges = screen.getAllByText('SMS');
      const emailBadges = screen.getAllByText('EMAIL');
      expect(smsBadges.length).toBeGreaterThanOrEqual(1);
      expect(emailBadges.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('filters to unread notifications', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => expect(screen.getByText('Notifications Center')).toBeInTheDocument());
    await user.click(screen.getByText('Unread'));

    await waitFor(() => {
      // Should still show the SENT notification (unread)
      expect(screen.getByText(/Lab results ready/)).toBeInTheDocument();
    });
  });

  it('marks all as read', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => expect(screen.getByText('Notifications Center')).toBeInTheDocument());
    await user.click(screen.getByText('Mark All Read'));

    // After marking all read, the unread count should change
    await waitFor(() => {
      expect(screen.queryByText('2 unread')).not.toBeInTheDocument();
    });
  });

  it('clears notification history', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => expect(screen.getByText('Notifications Center')).toBeInTheDocument());
    await user.click(screen.getByText('Clear'));

    await waitFor(() => {
      expect(screen.getByText('No notifications matching your filter.')).toBeInTheDocument();
    });
  });

  it('fetches notifications on mount', async () => {
    renderPage();
    await waitFor(() => {
      expect(api.getNotifications).toHaveBeenCalled();
    });
  });
});
