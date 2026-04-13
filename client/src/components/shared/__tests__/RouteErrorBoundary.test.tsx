import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { RouteErrorBoundary } from '../RouteErrorBoundary';
import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useRouteError: vi.fn(),
  isRouteErrorResponse: vi.fn(),
  useNavigate: vi.fn(),
}));

describe('RouteErrorBoundary Component', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(
      mockNavigate as unknown as ReturnType<typeof useNavigate>,
    );
  });

  it('should render 404 state correctly', () => {
    vi.mocked(useRouteError).mockReturnValue({ status: 404 } as unknown as ReturnType<
      typeof useRouteError
    >);
    vi.mocked(isRouteErrorResponse).mockReturnValue(
      true as unknown as ReturnType<typeof isRouteErrorResponse>,
    );

    render(<RouteErrorBoundary />);

    expect(screen.getByText(/404 - Page Not Found/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Try Again/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('should render 401 state correctly', () => {
    vi.mocked(useRouteError).mockReturnValue({ status: 401 } as unknown as ReturnType<
      typeof useRouteError
    >);
    vi.mocked(isRouteErrorResponse).mockReturnValue(
      true as unknown as ReturnType<typeof isRouteErrorResponse>,
    );

    render(<RouteErrorBoundary />);

    expect(screen.getByText(/401 - Unauthorized/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Try Again/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should render generic unexpected error state', () => {
    const genericError = new Error('Sudden crash');
    vi.mocked(useRouteError).mockReturnValue(
      genericError as unknown as ReturnType<typeof useRouteError>,
    );
    vi.mocked(isRouteErrorResponse).mockReturnValue(
      false as unknown as ReturnType<typeof isRouteErrorResponse>,
    );

    render(<RouteErrorBoundary />);

    expect(screen.getByText(/Unexpected Application Error/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Go to Dashboard/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Go to Dashboard/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
