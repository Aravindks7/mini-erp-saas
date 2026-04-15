import { type ReactNode, useEffect } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
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
    syncActiveOrganizationId,
  } = useTenant();
  const { slug } = useParams();
  const location = useLocation();

  const { data: organizations, isLoading, isFetching, isError, error } = useOrganizations();

  // Sync the full organization object to the context
  useSyncActiveOrg(organizations, activeOrganizationId, activeOrganization, setActiveOrganization);

  /**
   * RENDER-PHASE SYNCHRONIZATION (Anti-Flicker)
   * If we have organizations and a slug, ensure the context is synced immediately.
   * This prevents child components from firing API requests with the "old" tenant ID
   * during the transition, and avoids the "Switching to..." loading screen flicker.
   */
  if (organizations && slug && !isLoading) {
    const orgBySlug = organizations.find((o) => o.slug === slug);
    if (orgBySlug && activeOrganizationId !== orgBySlug.id) {
      console.log('[TenantGuard] Perform Render-Phase Sync for slug:', slug);
      syncActiveOrganizationId(orgBySlug.id);
      // We don't return early; we let the rest of the guard logic run with the now-synced ID.
    }
  }

  // CLINICAL OBSERVABILITY: Monitor the tenant-state transition in development
  console.log('[TenantGuard] Checking Tenant State:', {
    id: activeOrganizationId,
    slug,
    organizationsFound: organizations?.length || 0,
    isFetching,
    isLoading,
    isError,
  });

  // SLUG SYNCHRONIZATION EFFECT: Backup for non-render-phase updates
  useEffect(() => {
    if (!organizations || isLoading || !slug) return;

    const orgBySlug = organizations.find((o) => o.slug === slug);
    if (orgBySlug && activeOrganizationId !== orgBySlug.id) {
      setActiveOrganizationId(orgBySlug.id);
    }
  }, [slug, organizations, isLoading, activeOrganizationId, setActiveOrganizationId]);

  // AUTO-SELECTION LOGIC: Snap to the first organization if none is selected and NO slug is provided
  useEffect(() => {
    if (
      !isLoading &&
      !isError &&
      organizations &&
      organizations.length > 0 &&
      !activeOrganizationId &&
      !slug
    ) {
      console.log(
        '[TenantGuard] Auto-selecting first available organization:',
        organizations[0].id,
      );
      setActiveOrganizationId(organizations[0].id);
    }
  }, [isLoading, isError, organizations, activeOrganizationId, setActiveOrganizationId, slug]);

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

  // 1. ROOT PATH REDIRECTION: Ensure slug-prefixed URL if user lands on a non-slugged route
  if (!slug) {
    const orgToRedirect = organizations?.find((o) => o.id === activeOrganizationId);
    if (orgToRedirect) {
      const targetPath =
        location.pathname === '/'
          ? `/${orgToRedirect.slug}`
          : `/${orgToRedirect.slug}${location.pathname}`;
      console.log('[TenantGuard] Redirecting to slug-prefixed route:', targetPath);
      return <Navigate to={targetPath} replace />;
    }
  }

  // 2. SLUG VALIDATION: Ensure the slug exists in user's organizations
  if (slug) {
    const isValidSlug = organizations.some((org) => org.slug === slug);
    if (!isValidSlug) {
      console.warn('[TenantGuard] Invalid slug detected. Redirecting to selection.');
      return <Navigate to="/select-organization" replace />;
    }
  }

  // 3. TENANT ISOLATION VALIDATION: Ensure the activeId matches the slug (if provided)
  const activeOrgFromId = organizations.find((org) => org.id === activeOrganizationId);
  const isValidTenant = !!activeOrgFromId;
  const isSlugMismatch = slug && activeOrgFromId?.slug !== slug;

  if (!activeOrganizationId || !isValidTenant || isSlugMismatch) {
    // If we have organizations but no selection yet, OR if we have a slug mismatch,
    // show loading while the useEffect synchronizes the state.
    if (organizations && organizations.length > 0) {
      const targetOrg = slug ? organizations.find((o) => o.slug === slug) : null;

      if (!activeOrganizationId || isSlugMismatch) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <div className="text-sm text-muted-foreground animate-pulse font-medium">
                {isSlugMismatch
                  ? `Switching to ${targetOrg?.name || 'workspace'}...`
                  : 'Loading workspace...'}
              </div>
            </div>
          </div>
        );
      }
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
