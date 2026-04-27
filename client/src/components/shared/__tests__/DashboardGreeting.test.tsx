import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardGreeting } from '../DashboardGreeting';
import { useAuth } from '@/contexts/AuthContext';

// Mock useAuth
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('DashboardGreeting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing if session is not available', () => {
    (useAuth as any).mockReturnValue({ data: null });
    const { container } = render(<DashboardGreeting />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders morning greeting', () => {
    // Mock morning (e.g., 9 AM)
    vi.setSystemTime(new Date('2026-04-27T09:00:00'));
    (useAuth as any).mockReturnValue({
      data: { user: { name: 'Aravind Venkat' } },
    });

    render(<DashboardGreeting />);
    expect(screen.getByText(/Good morning, Aravind!/i)).toBeInTheDocument();
  });

  it('renders afternoon greeting', () => {
    // Mock afternoon (e.g., 2 PM)
    vi.setSystemTime(new Date('2026-04-27T14:00:00'));
    (useAuth as any).mockReturnValue({
      data: { user: { name: 'Aravind Venkat' } },
    });

    render(<DashboardGreeting />);
    expect(screen.getByText(/Good afternoon, Aravind!/i)).toBeInTheDocument();
  });

  it('renders evening greeting', () => {
    // Mock evening (e.g., 8 PM)
    vi.setSystemTime(new Date('2026-04-27T20:00:00'));
    (useAuth as any).mockReturnValue({
      data: { user: { name: 'Aravind Venkat' } },
    });

    render(<DashboardGreeting />);
    expect(screen.getByText(/Good evening, Aravind!/i)).toBeInTheDocument();
  });

  it('handles single name correctly', () => {
    vi.setSystemTime(new Date('2026-04-27T09:00:00'));
    (useAuth as any).mockReturnValue({
      data: { user: { name: 'Aravind' } },
    });

    render(<DashboardGreeting />);
    expect(
      screen.getByText((content) => content.includes('Good morning, Aravind!')),
    ).toBeInTheDocument();
  });
});
