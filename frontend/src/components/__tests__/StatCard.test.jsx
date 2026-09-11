import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatCard from '../StatCard';

const mockUsersIcon = () => <svg data-testid="mock-icon" />;

describe('StatCard', () => {
  it('renders with title and value', () => {
    render(<StatCard title="Patients" value={42} />);
    expect(screen.getByText('Patients')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders optional subtitle', () => {
    render(<StatCard title="Beds" value={10} subtitle="Available" />);
    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(<StatCard title="Users" value={5} icon={mockUsersIcon} />);
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });

  it('renders positive trend indicator', () => {
    render(<StatCard title="Growth" value={100} trend={12} />);
    expect(screen.getByText('+12%')).toBeInTheDocument();
    expect(screen.getByText('vs last hour')).toBeInTheDocument();
  });

  it('renders negative trend indicator', () => {
    render(<StatCard title="Decline" value={50} trend={-8} />);
    expect(screen.getByText('-8%')).toBeInTheDocument();
  });

  it('renders zero trend', () => {
    render(<StatCard title="Flat" value={30} trend={0} />);
    expect(screen.getByText('+0%')).toBeInTheDocument();
  });

  it('does not render trend section when trend is undefined', () => {
    render(<StatCard title="Simple" value={7} />);
    expect(screen.queryByText('vs last hour')).not.toBeInTheDocument();
  });

  it('applies default slate color when no color prop given', () => {
    const { container } = render(<StatCard title="Default" value={1} />);
    const card = container.firstChild;
    expect(card.className).toContain('slate');
  });

  it('applies specified color class', () => {
    const { container } = render(<StatCard title="Red Card" value={5} color="red" />);
    const card = container.firstChild;
    expect(card.className).toContain('red');
  });

  it('handles string value types', () => {
    render(<StatCard title="Status" value="Active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders uppercase title', () => {
    render(<StatCard title="Queue Status" value="Normal" />);
    const titleEl = screen.getByText('Queue Status');
    expect(titleEl.className).toContain('uppercase');
  });
});
