import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TenantGuard } from '../TenantGuard';
import { useTenant } from '../../../contexts/TenantContext';
import { useOrganizations } from '@/features/organizations/hooks/organizations.hooks';
import type { OrganizationResponse } from '@/features/organizations/api/organizations.api';

// Mock the context and hooks
vi.mock('../../../contexts/TenantContext', () => ({
  useTenant: vi.fn(),
}));

vi.mock('@/features/organizations/hooks/organizations.hooks', () => ({
  useOrganizations: vi.fn(),
}));

describe('TenantGuard (Multi-Tenant Perimeter)', () => {
  const ProtectedComponent = () => <div>Dashboard Content</div>;
  const OnboardingComponent = () => <div>Onboarding Page</div>;
  const SelectOrgComponent = () => <div>Select Organization Page</div>;
  const LoginComponent = () => <div>Login Page</div>;

  const setActiveOrganizationId = vi.fn();
  const setActiveOrganization = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderGuard = (initialPath = '/dashboard') => {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route
            path="/:slug/dashboard"
            element={
              <TenantGuard>
                <ProtectedComponent />
              </TenantGuard>
            }
          />
          <Route
            path="/dashboard"
            element={
              <TenantGuard>
                <ProtectedComponent />
              </TenantGuard>
            }
          />
          <Route path="/onboarding" element={<OnboardingComponent />} />
          <Route path="/select-organization" element={<SelectOrgComponent />} />
          <Route path="/login" element={<LoginComponent />} />
        </Routes>
      </MemoryRouter>,
    );
  };

  it('should render loading state when organizations are loading', () => {
    vi.mocked(useTenant).mockReturnValue({
      activeOrganizationId: null,
      setActiveOrganizationId,
      activeOrganization: null,
      setActiveOrganization,
    } as unknown as ReturnType<typeof useTenant>);
    vi.mocked(useOrganizations).mockReturnValue({
      isLoading: true,
      data: undefined,
    } as unknown as ReturnType<typeof useOrganizations>);

    renderGuard();
    expect(screen.getByText(/Verifying organization access.../i)).toBeInTheDocument();
  });

  it('should redirect to /login on organization fetch error', () => {
    vi.mocked(useTenant).mockReturnValue({
      activeOrganizationId: null,
      setActiveOrganizationId,
      activeOrganization: null,
      setActiveOrganization,
    } as unknown as ReturnType<typeof useTenant>);
    vi.mocked(useOrganizations).mockReturnValue({
      isLoading: false,
      isError: true,
      error: new Error('Network error'),
    } as unknown as ReturnType<typeof useOrganizations>);

    renderGuard();
    expect(screen.getByText(/Login Page/i)).toBeInTheDocument();
  });

  it('should redirect to /onboarding when user has no organizations', () => {
    vi.mocked(useTenant).mockReturnValue({
      activeOrganizationId: null,
      setActiveOrganizationId,
      activeOrganization: null,
      setActiveOrganization,
    } as unknown as ReturnType<typeof useTenant>);
    vi.mocked(useOrganizations).mockReturnValue({
      isLoading: false,
      data: [],
    } as unknown as ReturnType<typeof useOrganizations>);

    renderGuard();
    expect(screen.getByText(/Onboarding Page/i)).toBeInTheDocument();
  });

  it('should auto-select the first organization if none selected', () => {
    const mockOrgs = [{ id: 'org-1', name: 'Org 1', slug: 'org-1' }];
    vi.mocked(useTenant).mockReturnValue({
      activeOrganizationId: null,
      setActiveOrganizationId,
      activeOrganization: null,
      setActiveOrganization,
    } as unknown as ReturnType<typeof useTenant>);
    vi.mocked(useOrganizations).mockReturnValue({
      isLoading: false,
      data: mockOrgs as unknown as OrganizationResponse[],
    } as unknown as ReturnType<typeof useOrganizations>);

    renderGuard();

    // In the first render, it shows "Loading workspace..." because it hasn't synced yet
    expect(screen.getByText(/Loading workspace.../i)).toBeInTheDocument();

    // Verify that the auto-selection effect was triggered
    expect(setActiveOrganizationId).toHaveBeenCalledWith('org-1');
  });

  it('should redirect to /select-organization if activeOrganizationId is invalid/stale', () => {
    const mockOrgs = [{ id: 'org-1', name: 'Org 1', slug: 'org-1' }];
    vi.mocked(useTenant).mockReturnValue({
      activeOrganizationId: 'stale-id',
      setActiveOrganizationId,
      activeOrganization: null,
      setActiveOrganization,
    } as unknown as ReturnType<typeof useTenant>);
    vi.mocked(useOrganizations).mockReturnValue({
      isLoading: false,
      data: mockOrgs as unknown as OrganizationResponse[],
    } as unknown as ReturnType<typeof useOrganizations>);

    renderGuard();
    expect(screen.getByText(/Select Organization Page/i)).toBeInTheDocument();
    expect(setActiveOrganizationId).toHaveBeenCalledWith(null);
  });

  it('should render content when authenticated with a valid organization', () => {
    const mockOrgs = [{ id: 'org-1', name: 'Org 1', slug: 'org-1' }];
    vi.mocked(useTenant).mockReturnValue({
      activeOrganizationId: 'org-1',
      setActiveOrganizationId,
      activeOrganization: mockOrgs[0] as unknown as OrganizationResponse,
      setActiveOrganization,
    } as unknown as ReturnType<typeof useTenant>);
    vi.mocked(useOrganizations).mockReturnValue({
      isLoading: false,
      data: mockOrgs as unknown as OrganizationResponse[],
    } as unknown as ReturnType<typeof useOrganizations>);

    // Use a slug-prefixed path in the test
    renderGuard('/org-1/dashboard');
    expect(screen.getByText(/Dashboard Content/i)).toBeInTheDocument();
  });
});
