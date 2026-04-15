import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { RouteErrorBoundary } from '../RouteErrorBoundary';
import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom';

// Mock react-router-dom
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    useRouteError: vi.fn(),
    isRouteErrorResponse: vi.fn(),
    useNavigate: vi.fn(),
    useParams: vi.fn(() => ({})),
  };
});

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

  it('should show developer diagnostics and copy to clipboard in DEV mode', async () => {
    // Mock import.meta.env.DEV
    vi.stubGlobal('import', { meta: { env: { DEV: true } } });

    // Mock clipboard
    const mockClipboard = {
      writeText: vi.fn().mockResolvedValue(undefined),
    };
    vi.stubGlobal('navigator', { clipboard: mockClipboard });

    const genericError = new Error('Diagnostics test');
    genericError.stack = 'stack trace content';
    vi.mocked(useRouteError).mockReturnValue(
      genericError as unknown as ReturnType<typeof useRouteError>,
    );

    render(<RouteErrorBoundary />);

    expect(screen.getByText(/Developer Diagnostics:/i)).toBeInTheDocument();
    expect(screen.getByText(/stack trace content/i)).toBeInTheDocument();

    const copyButton = screen.getByRole('button', { name: /Copy to clipboard/i });
    fireEvent.click(copyButton);

    expect(mockClipboard.writeText).toHaveBeenCalledWith(genericError.stack);
    expect(screen.getByRole('button', { name: /Copied!/i })).toBeInTheDocument();

    vi.unstubAllGlobals();
  });
});
