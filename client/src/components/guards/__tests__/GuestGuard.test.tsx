import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, describe, it, expect } from 'vitest';
import { GuestGuard } from '../GuestGuard';
import { useAuth } from '../../../contexts/AuthContext';

// Mock the AuthContext hook
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('GuestGuard (Public Route Perimeter)', () => {
  const PublicComponent = () => <div>Public Content</div>;
  const DashboardComponent = () => <div>Dashboard</div>;

  const renderGuard = () => {
    return render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route
            path="/login"
            element={
              <GuestGuard>
                <PublicComponent />
              </GuestGuard>
            }
          />
          <Route path="/" element={<DashboardComponent />} />
        </Routes>
      </MemoryRouter>,
    );
  };

  it('should render loading state when session is pending', () => {
    vi.mocked(useAuth).mockReturnValue({
      isPending: true,
      data: null,
    } as unknown as ReturnType<typeof useAuth>);

    renderGuard();
    expect(screen.getByText(/Verifying access.../i)).toBeInTheDocument();
  });

  it('should redirect to / (Dashboard) when already authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      isPending: false,
      data: { user: { id: 'user-123' } },
    } as unknown as ReturnType<typeof useAuth>);

    renderGuard();
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.queryByText(/Public Content/i)).not.toBeInTheDocument();
  });

  it('should render public content when unauthenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      isPending: false,
      data: null,
    } as unknown as ReturnType<typeof useAuth>);

    renderGuard();
    expect(screen.getByText(/Public Content/i)).toBeInTheDocument();
    expect(screen.queryByText(/Dashboard/i)).not.toBeInTheDocument();
  });
});
