import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SeverityBadge from '../SeverityBadge';

describe('SeverityBadge', () => {
  it('renders CRITICAL severity', () => {
    render(<SeverityBadge severity="CRITICAL" />);
    const badge = screen.getByText('CRITICAL');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-red-100');
  });

  it('renders HIGH severity', () => {
    render(<SeverityBadge severity="HIGH" />);
    const badge = screen.getByText('HIGH');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-orange-100');
  });

  it('renders MODERATE severity', () => {
    render(<SeverityBadge severity="MODERATE" />);
    const badge = screen.getByText('MODERATE');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-cyan-100');
  });

  it('renders LOW severity', () => {
    render(<SeverityBadge severity="LOW" />);
    const badge = screen.getByText('LOW');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-emerald-100');
  });

  it('renders ROUTINE severity', () => {
    render(<SeverityBadge severity="ROUTINE" />);
    const badge = screen.getByText('ROUTINE');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-slate-100');
  });

  it('falls back to ROUTINE for unknown severity', () => {
    render(<SeverityBadge severity="UNKNOWN" />);
    const badge = screen.getByText('UNKNOWN');
    expect(badge).toBeInTheDocument();
  });

  it('has uppercase tracking class', () => {
    render(<SeverityBadge severity="HIGH" />);
    const badge = screen.getByText('HIGH');
    expect(badge.className).toContain('uppercase');
  });

  it('displays severity text in uppercase', () => {
    render(<SeverityBadge severity="critical" />);
    expect(screen.getByText('critical')).toBeInTheDocument();
  });
});
