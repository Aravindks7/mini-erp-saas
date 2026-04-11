import { type ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { useOrganizations } from '@/features/organizations/hooks/organizations.hooks';
import type { OrganizationResponse } from '@/features/organizations/api/organizations.api';

/**
 * Hook to synchronize the full activeOrganization object when the ID or data changes.
 */
function useSyncActiveOrg(
  organizations: OrganizationResponse[] | undefined,
  activeId: string | null,
  activeOrg: OrganizationResponse | null,
  setActiveOrg: (org: OrganizationResponse | null) => void,
) {
  useEffect(() => {
    if (!organizations || !activeId) {
      if (activeOrg) setActiveOrg(null);
      return;
    }

    const currentOrg = organizations.find((o) => o.id === activeId);
    if (!currentOrg) {
      if (activeOrg) setActiveOrg(null);
      return;
    }

    // Only update if it's a different organization to prevent render loops
    if (activeOrg?.id !== currentOrg.id) {
      setActiveOrg(currentOrg);
    }
  }, [organizations, activeId, activeOrg, setActiveOrg]);
}

export const TenantGuard = ({ children }: { children: ReactNode }) => {
  const {
    activeOrganizationId,
    setActiveOrganizationId,
    activeOrganization,
    setActiveOrganization,
  } = useTenant();
  const location = useLocation();

  const { data: organizations, isLoading, isFetching, isError, error } = useOrganizations();

  // Sync the full organization object to the context
  useSyncActiveOrg(organizations, activeOrganizationId, activeOrganization, setActiveOrganization);

  // CLINICAL OBSERVABILITY: Monitor the tenant-state transition in development
  console.log('[TenantGuard] Checking Tenant State:', {
    id: activeOrganizationId,
    organizationsFound: organizations?.length || 0,
    isFetching,
    isLoading,
    isError,
  });

  // AUTO-SELECTION LOGIC: Snap to the first organization if none is selected
  useEffect(() => {
    if (
      !isLoading &&
      !isError &&
      organizations &&
      organizations.length > 0 &&
      !activeOrganizationId
    ) {
      console.log(
        '[TenantGuard] Auto-selecting first available organization:',
        organizations[0].id,
      );
      setActiveOrganizationId(organizations[0].id);
    }
  }, [isLoading, isError, organizations, activeOrganizationId, setActiveOrganizationId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <div className="text-sm text-muted-foreground animate-pulse font-medium">
            Verifying organization access...
          </div>
        </div>
      </div>
    );
  }

  // FAIL-FAST REDIRECTION
  if (isError) {
    console.error('[TenantGuard] Failed to fetch organizations:', error);
    return <Navigate to="/login" replace />;
  }

  // AUTOMATED ONBOARDING REDIRECTION
  if (!organizations || (organizations.length === 0 && !isFetching)) {
    if (activeOrganizationId) {
      console.warn(
        '[TenantGuard] No organizations found for current user. Clearing stale activeOrganizationId.',
      );
      setActiveOrganizationId(null);
    }

    if (location.pathname === '/onboarding') return <>{children}</>;
    return <Navigate to="/onboarding" state={{ from: location }} replace />;
  }

  // TENANT ISOLATION VALIDATION
  const isValidTenant = organizations.some((org) => org.id === activeOrganizationId);

  if (!activeOrganizationId || !isValidTenant) {
    // If we have organizations but no selection yet, show loading while the useEffect snaps into place
    if (organizations && organizations.length > 0 && !activeOrganizationId) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <div className="text-sm text-muted-foreground animate-pulse font-medium">
              Loading workspace...
            </div>
          </div>
        </div>
      );
    }

    if (activeOrganizationId && !isValidTenant) {
      console.warn('[TenantGuard] Stale organization ID detected. Clearing active organization.');
      setActiveOrganizationId(null);
    }

    if (location.pathname === '/select-organization') return <>{children}</>;
    return <Navigate to="/select-organization" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
