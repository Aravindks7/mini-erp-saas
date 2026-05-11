import { useLocation } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useMutationState } from '@tanstack/react-query';
import { useTenant } from '@/contexts/TenantContext';
import { useTenantPath } from '@/hooks/useTenantPath';
import { useSignOutMutation } from '@/features/auth/hooks/auth.hooks';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useSidebarCollapse } from '@/hooks/useSidebarCollapse';
import { buildSidebarTree } from '@/lib/navigation-utils';
import { dashboardRoutes } from '@/lib/router-registry';
import { APP_PATHS } from '@/lib/paths';

export function useSidebarData() {
  const { pathname } = useLocation();
  const { activeOrganization } = useTenant();
  const { getPath } = useTenantPath();
  const { mutate: handleSignOut } = useSignOutMutation();
  const isLoggingOut =
    useMutationState({
      filters: { mutationKey: ['logout'], status: 'pending' },
    }).length > 0;
  const { isCollapsed, toggle } = useSidebarCollapse();
  const isDesktop = useBreakpoint('lg');

  const [searchQuery, setSearchQuery] = useState('');
  const slug = activeOrganization?.slug;

  // Memoize the raw tree build to prevent recalculation on every render
  const rawTree = useMemo(
    () => buildSidebarTree(dashboardRoutes, pathname, slug),
    [pathname, slug],
  );

  // Memoize the filtered tree based on search query
  const filteredTree = useMemo(() => {
    if (!searchQuery) return rawTree;

    const query = searchQuery.toLowerCase();

    return {
      ...rawTree,
      ungroupedTop: rawTree.ungroupedTop.filter((item) =>
        item.route.handle?.title?.toLowerCase().includes(query),
      ),
      ungroupedBottom: rawTree.ungroupedBottom.filter((item) =>
        item.route.handle?.title?.toLowerCase().includes(query),
      ),
      groups: rawTree.groups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) =>
            item.route.handle?.title?.toLowerCase().includes(query),
          ),
        }))
        .filter((group) => group.items.length > 0),
    };
  }, [rawTree, searchQuery]);

  // System paths for footer
  const systemPaths = useMemo(
    () => ({
      activity: getPath(APP_PATHS.system.activity()),
      settings: getPath(APP_PATHS.system.settings()),
    }),
    [getPath],
  );

  return {
    pathname,
    isCollapsed,
    toggle,
    isDesktop,
    searchQuery,
    setSearchQuery,
    filteredTree,
    handleSignOut,
    isLoggingOut,
    systemPaths,
  };
}

export type SidebarData = ReturnType<typeof useSidebarData>;
