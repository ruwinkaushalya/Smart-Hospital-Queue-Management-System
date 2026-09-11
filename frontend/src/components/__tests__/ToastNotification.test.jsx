import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ToastNotification from '../ToastNotification';

function renderWithRouter(ui) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe('ToastNotification', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mockNotification = {
    id: 'toast-1',
    patient: {
      id: 'P001',
      name: 'Alice Cooper',
      age: 45,
      symptoms: 'Chest pain, difficulty breathing',
      estimatedWait: 5,
    },
  };

  it('renders notification message', () => {
    renderWithRouter(
      <ToastNotification notifications={[mockNotification]} onDismiss={vi.fn()} />
    );
    expect(screen.getByText('Critical Patient Registered')).toBeInTheDocument();
    expect(screen.getByText('Alice Cooper')).toBeInTheDocument();
  });

  it('renders patient symptoms', () => {
    renderWithRouter(
      <ToastNotification notifications={[mockNotification]} onDismiss={vi.fn()} />
    );
    expect(screen.getByText(/Chest pain/)).toBeInTheDocument();
  });

  it('renders CRITICAL badge', () => {
    renderWithRouter(
      <ToastNotification notifications={[mockNotification]} onDismiss={vi.fn()} />
    );
    const criticalBadge = screen.getByText('CRITICAL');
    expect(criticalBadge).toBeInTheDocument();
    expect(criticalBadge.className).toContain('bg-red-100');
  });

  it('renders link to emergency queue', () => {
    renderWithRouter(
      <ToastNotification notifications={[mockNotification]} onDismiss={vi.fn()} />
    );
    const link = screen.getByText(/View in Emergency Queue/);
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/emergency');
  });

  it('auto-dismisses after 6 seconds', () => {
    const onDismiss = vi.fn();
    renderWithRouter(
      <ToastNotification notifications={[mockNotification]} onDismiss={onDismiss} />
    );

    act(() => {
      vi.advanceTimersByTime(6000);
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onDismiss).toHaveBeenCalledWith('toast-1');
  });

  it('dismisses on close button click', () => {
    const onDismiss = vi.fn();
    renderWithRouter(
      <ToastNotification notifications={[mockNotification]} onDismiss={onDismiss} />
    );

    const dismissButton = screen.getByLabelText('Dismiss notification');
    fireEvent.click(dismissButton);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onDismiss).toHaveBeenCalledWith('toast-1');
  });

  it('pauses auto-dismiss on mouse enter', () => {
    const onDismiss = vi.fn();
    renderWithRouter(
      <ToastNotification notifications={[mockNotification]} onDismiss={onDismiss} />
    );

    const toast = screen.getByRole('alert');
    fireEvent.mouseEnter(toast);

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('resumes auto-dismiss on mouse leave', () => {
    const onDismiss = vi.fn();
    renderWithRouter(
      <ToastNotification notifications={[mockNotification]} onDismiss={onDismiss} />
    );

    const toast = screen.getByRole('alert');
    fireEvent.mouseEnter(toast);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    fireEvent.mouseLeave(toast);

    act(() => {
      vi.advanceTimersByTime(6000);
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onDismiss).toHaveBeenCalledWith('toast-1');
  });

  it('renders multiple notifications stacked', () => {
    const notifications = [
      mockNotification,
      {
        id: 'toast-2',
        patient: {
          id: 'P002',
          name: 'Bob Martin',
          age: 32,
          symptoms: 'Broken leg',
          estimatedWait: 10,
        },
      },
    ];

    renderWithRouter(
      <ToastNotification notifications={notifications} onDismiss={vi.fn()} />
    );

    expect(screen.getByText('Alice Cooper')).toBeInTheDocument();
    expect(screen.getByText('Bob Martin')).toBeInTheDocument();
  });

  it('has aria-live polite for accessibility', () => {
    const { container } = renderWithRouter(
      <ToastNotification notifications={[mockNotification]} onDismiss={vi.fn()} />
    );
    const liveRegion = container.firstChild;
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
  });

  it('renders nothing when notifications array is empty', () => {
    const { container } = renderWithRouter(
      <ToastNotification notifications={[]} onDismiss={vi.fn()} />
    );
    expect(container.firstChild.children.length).toBe(0);
  });

  it('renders estimated wait time text', () => {
    renderWithRouter(
      <ToastNotification notifications={[mockNotification]} onDismiss={vi.fn()} />
    );
    expect(screen.getByText(/Est\.?/)).toBeInTheDocument();
  });
});
