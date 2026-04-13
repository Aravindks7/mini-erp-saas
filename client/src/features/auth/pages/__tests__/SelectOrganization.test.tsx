import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import SelectOrganizationPage from '../SelectOrganization';
import { useTenant } from '@/contexts/TenantContext';
import { useOrganizations } from '@/features/organizations/hooks/organizations.hooks';

// Mock the dependencies
vi.mock('@/contexts/TenantContext', () => ({
  useTenant: vi.fn(),
}));

vi.mock('@/features/organizations/hooks/organizations.hooks', () => ({
  useOrganizations: vi.fn(),
}));

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: { from: { pathname: '/customers' } } }),
  };
});

describe('SelectOrganizationPage', () => {
  const setActiveOrganizationId = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTenant).mockReturnValue({ setActiveOrganizationId } as unknown as ReturnType<
      typeof useTenant
    >);
  });

  it('should render loading state when fetching organizations', () => {
    vi.mocked(useOrganizations).mockReturnValue({ isLoading: true } as unknown as ReturnType<
      typeof useOrganizations
    >);

    render(
      <MemoryRouter>
        <SelectOrganizationPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Loading workspaces.../i)).toBeInTheDocument();
  });

  it('should render a list of organizations', () => {
    const mockOrgs = [
      { id: 'org-1', name: 'Acme Corp', role: 'admin' },
      { id: 'org-2', name: 'Globex', role: 'employee' },
    ];
    vi.mocked(useOrganizations).mockReturnValue({
      isLoading: false,
      data: mockOrgs,
    } as unknown as ReturnType<typeof useOrganizations>);

    render(
      <MemoryRouter>
        <SelectOrganizationPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Globex')).toBeInTheDocument();
    expect(screen.getByText(/admin/i)).toBeInTheDocument();
    expect(screen.getByText(/employee/i)).toBeInTheDocument();
  });

  it('should call setActiveOrganizationId and navigate on selection', () => {
    const mockOrgs = [{ id: 'org-1', name: 'Acme Corp', role: 'admin' }];
    vi.mocked(useOrganizations).mockReturnValue({
      isLoading: false,
      data: mockOrgs,
    } as unknown as ReturnType<typeof useOrganizations>);

    render(
      <MemoryRouter>
        <SelectOrganizationPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText('Acme Corp'));

    expect(setActiveOrganizationId).toHaveBeenCalledWith('org-1');
    expect(mockNavigate).toHaveBeenCalledWith('/customers', { replace: true });
  });

  it('should render empty state when no organizations found', () => {
    vi.mocked(useOrganizations).mockReturnValue({
      isLoading: false,
      data: [],
    } as unknown as ReturnType<typeof useOrganizations>);

    render(
      <MemoryRouter>
        <SelectOrganizationPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/You don't have any organizations yet/i)).toBeInTheDocument();
  });

  it('should navigate to onboarding when "Create New Organization" is clicked', () => {
    vi.mocked(useOrganizations).mockReturnValue({
      isLoading: false,
      data: [],
    } as unknown as ReturnType<typeof useOrganizations>);

    render(
      <MemoryRouter>
        <SelectOrganizationPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText(/Create New Organization/i));
    expect(mockNavigate).toHaveBeenCalledWith('/onboarding');
  });
});
