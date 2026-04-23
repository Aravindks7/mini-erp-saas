import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import SelectOrganizationPage from '../SelectOrganization';
import { useTenant } from '@/contexts/TenantContext';
import { useOrganizations } from '@/features/organizations/hooks/organizations.hooks';
import { useAuth } from '@/contexts/AuthContext';

// Mock the dependencies
vi.mock('@/contexts/TenantContext', () => ({
  useTenant: vi.fn(),
}));

vi.mock('@/features/organizations/hooks/organizations.hooks', () => ({
  useOrganizations: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock the CreateOrganizationDialog to avoid portal issues
vi.mock('@/features/organizations/components/CreateOrganizationDialog', () => ({
  CreateOrganizationDialog: () => <div data-testid="create-org-dialog" />,
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
  const syncActiveOrganizationId = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTenant).mockReturnValue({ syncActiveOrganizationId } as any);
    vi.mocked(useAuth).mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      isLoading: false,
    } as any);
  });

  it('should render loading state when fetching organizations', () => {
    vi.mocked(useOrganizations).mockReturnValue({ isLoading: true } as any);

    render(
      <MemoryRouter>
        <SelectOrganizationPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Loading organizations.../i)).toBeInTheDocument();
  });

  it('should render a list of organizations', () => {
    const mockOrgs = [
      { id: 'org-1', name: 'Acme Corp', slug: 'acme', roleName: 'admin' },
      { id: 'org-2', name: 'Globex', slug: 'globex', roleName: 'employee' },
    ];
    vi.mocked(useOrganizations).mockReturnValue({
      isLoading: false,
      data: mockOrgs,
    } as any);

    render(
      <MemoryRouter>
        <SelectOrganizationPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Globex')).toBeInTheDocument();
    expect(screen.getByText('/acme')).toBeInTheDocument();
    expect(screen.getByText('/globex')).toBeInTheDocument();
  });

  it('should call syncActiveOrganizationId and navigate on selection', () => {
    const mockOrgs = [{ id: 'org-1', name: 'Acme Corp', slug: 'acme', roleName: 'admin' }];
    vi.mocked(useOrganizations).mockReturnValue({
      isLoading: false,
      data: mockOrgs,
    } as any);

    render(
      <MemoryRouter>
        <SelectOrganizationPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText('Acme Corp'));

    expect(syncActiveOrganizationId).toHaveBeenCalledWith('org-1');
    expect(mockNavigate).toHaveBeenCalledWith('/acme');
  });

  it('should navigate to onboarding when no organizations found', () => {
    vi.mocked(useOrganizations).mockReturnValue({
      isLoading: false,
      data: [],
    } as any);

    render(
      <MemoryRouter>
        <SelectOrganizationPage />
      </MemoryRouter>,
    );

    // useEffect handles this, and navigate is called
    expect(mockNavigate).toHaveBeenCalledWith('/onboarding');
  });

  it('should open create dialog when "Create New Organization" is clicked', () => {
    vi.mocked(useOrganizations).mockReturnValue({
      isLoading: false,
      data: [],
    } as any);

    render(
      <MemoryRouter>
        <SelectOrganizationPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText(/Create New Organization/i));
    // The dialog should be visible (mocked)
    expect(screen.getByTestId('create-org-dialog')).toBeInTheDocument();
  });
});
