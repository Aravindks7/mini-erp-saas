import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { AddButton } from '../AddButton';
import { BrowserRouter } from 'react-router-dom';
import { usePermission } from '@/hooks/usePermission';
import { useTenantPath } from '@/hooks/useTenantPath';
import type { Permission } from '@shared/index';

// Mock the hooks
vi.mock('@/hooks/usePermission', () => ({
  usePermission: vi.fn(),
}));

vi.mock('@/hooks/useTenantPath', () => ({
  useTenantPath: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('AddButton', () => {
  const defaultProps = {
    to: '/test-path',
    permission: 'customers:create' as Permission,
    label: 'Add Item',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useTenantPath as Mock).mockReturnValue({
      getPath: (path: string) => `/org-slug${path}`,
    });
  });

  it('renders correctly when user has permission', () => {
    (usePermission as Mock).mockReturnValue(true);

    render(
      <BrowserRouter>
        <AddButton {...defaultProps} />
      </BrowserRouter>,
    );

    const button = screen.getByRole('button', { name: /add item/i });
    expect(button).toBeInTheDocument();
    expect(screen.getByText('Add Item')).toBeInTheDocument();
  });

  it('does not render when user lacks permission', () => {
    (usePermission as Mock).mockReturnValue(false);

    render(
      <BrowserRouter>
        <AddButton {...defaultProps} />
      </BrowserRouter>,
    );

    expect(screen.queryByRole('button', { name: /add item/i })).not.toBeInTheDocument();
  });

  it('navigates to the correct path on click', () => {
    (usePermission as Mock).mockReturnValue(true);

    render(
      <BrowserRouter>
        <AddButton {...defaultProps} />
      </BrowserRouter>,
    );

    const button = screen.getByRole('button', { name: /add item/i });
    fireEvent.click(button);

    expect(mockNavigate).toHaveBeenCalledWith('/org-slug/test-path');
  });

  it('renders with a custom icon if provided', () => {
    (usePermission as Mock).mockReturnValue(true);

    render(
      <BrowserRouter>
        <AddButton {...defaultProps} icon={<span data-testid="custom-icon">Icon</span>} />
      </BrowserRouter>,
    );

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    (usePermission as Mock).mockReturnValue(true);

    render(
      <BrowserRouter>
        <AddButton {...defaultProps} className="custom-class" />
      </BrowserRouter>,
    );

    const button = screen.getByRole('button', { name: /add item/i });
    expect(button).toHaveClass('custom-class');
  });
});
