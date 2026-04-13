import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, describe, it, expect } from 'vitest';
import { AuthGuard } from '../AuthGuard';
import { useAuth } from '../../../contexts/AuthContext';

// Mock the AuthContext hook
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('AuthGuard (Perimeter Defense)', () => {
  const ProtectedComponent = () => <div>Protected Content</div>;
  const LoginComponent = () => <div>Login Page</div>;

  const renderGuard = () => {
    return render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <AuthGuard>
                <ProtectedComponent />
              </AuthGuard>
            }
          />
          <Route path="/login" element={<LoginComponent />} />
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
    expect(screen.getByText(/Verifying session.../i)).toBeInTheDocument();
  });

  it('should redirect to /login when unauthenticated (no session)', () => {
    vi.mocked(useAuth).mockReturnValue({
      isPending: false,
      data: null,
      isError: false,
    } as unknown as ReturnType<typeof useAuth>);

    renderGuard();
    expect(screen.getByText(/Login Page/i)).toBeInTheDocument();
    expect(screen.queryByText(/Protected Content/i)).not.toBeInTheDocument();
  });

  it('should redirect to /login when session check fails (isError)', () => {
    vi.mocked(useAuth).mockReturnValue({
      isPending: false,
      data: null,
      isError: true,
      error: new Error('Network error'),
    } as unknown as ReturnType<typeof useAuth>);

    renderGuard();
    expect(screen.getByText(/Login Page/i)).toBeInTheDocument();
  });

  it('should render protected content when authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      isPending: false,
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      isError: false,
    } as unknown as ReturnType<typeof useAuth>);

    renderGuard();
    expect(screen.getByText(/Protected Content/i)).toBeInTheDocument();
    expect(screen.queryByText(/Login Page/i)).not.toBeInTheDocument();
  });
});
