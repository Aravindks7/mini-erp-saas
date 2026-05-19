import {
  type LucideIcon,
  ShoppingCart,
  ShoppingBag,
  Package,
  DollarSign,
  Settings2,
} from 'lucide-react';
import type { AppRoute } from './types/navigation';
import { getTenantPath } from './path-utils';

export interface SidebarItem {
  route: AppRoute;
  path: string;
  isActive: boolean;
}

export interface SidebarGroupData {
  id: string;
  name: string;
  icon?: LucideIcon;
  order: number;
  items: SidebarItem[];
  isActive: boolean;
  indexPath?: string;
}

export interface SidebarTree {
  ungroupedTop: SidebarItem[];
  groups: SidebarGroupData[];
  ungroupedBottom: SidebarItem[];
  activeGroupId: string | null;
}

export const SIDEBAR_GROUP_CONFIG: Record<string, { icon: LucideIcon; order: number }> = {
  Sales: { icon: ShoppingCart, order: 10 },
  Purchasing: { icon: ShoppingBag, order: 20 },
  Inventory: { icon: Package, order: 30 },
  Finance: { icon: DollarSign, order: 40 },
  Setup: { icon: Settings2, order: 100 },
};

export function buildSidebarTree(
  routes: AppRoute[],
  currentPath: string,
  tenantSlug?: string,
): SidebarTree {
  const tree: SidebarTree = {
    ungroupedTop: [],
    groups: [],
    ungroupedBottom: [],
    activeGroupId: null,
  };

  const groupMap = new Map<string, SidebarGroupData>();

  // Helper to process routes and their children
  const processRoute = (route: AppRoute, parentPath = '') => {
    // Determine the full path for this route (relative to parent)
    const routePath = route.index ? '' : route.path ? `/${route.path}` : '';
    const absolutePath = `${parentPath}${routePath}`.replace(/\/+/g, '/');
    const tenantPath = getTenantPath(absolutePath, tenantSlug);

    // If this route is a module root, assign its path to the group
    const groupName = route.handle?.sidebarGroup;
    if (groupName) {
      if (!groupMap.has(groupName)) {
        const config = SIDEBAR_GROUP_CONFIG[groupName];
        groupMap.set(groupName, {
          id: groupName,
          name: groupName,
          icon: config?.icon,
          order: config?.order ?? 99,
          items: [],
          isActive: false,
        });
      }

      const group = groupMap.get(groupName)!;
      if (route.handle?.isModuleRoot) {
        group.indexPath = tenantPath;
      }
    }

    // Check if this specific route entry should be in the sidebar items
    if (route.handle?.showInSidebar && !route.handle?.hidden) {
      const isActive = route.index
        ? currentPath === tenantPath
        : currentPath.startsWith(tenantPath);
      const sidebarItem: SidebarItem = { route, path: tenantPath, isActive };

      if (!groupName) {
        const order = route.handle.order ?? 0;
        if (order >= 90) {
          tree.ungroupedBottom.push(sidebarItem);
        } else {
          tree.ungroupedTop.push(sidebarItem);
        }
      } else {
        const group = groupMap.get(groupName)!;
        group.items.push(sidebarItem);

        if (isActive) {
          group.isActive = true;
          tree.activeGroupId = group.id;
        }
      }
    }

    // Recursively process children
    if (route.children) {
      for (const child of route.children) {
        processRoute(child, absolutePath);
      }
    }
  };

  // Start processing all top-level routes
  for (const route of routes) {
    processRoute(route);
  }

  // Sort groups and items
  for (const group of groupMap.values()) {
    group.items.sort((a, b) => (a.route.handle?.order ?? 99) - (b.route.handle?.order ?? 99));
  }

  tree.groups = Array.from(groupMap.values()).sort((a, b) => a.order - b.order);
  tree.ungroupedTop.sort((a, b) => (a.route.handle?.order ?? 99) - (b.route.handle?.order ?? 99));
  tree.ungroupedBottom.sort(
    (a, b) => (a.route.handle?.order ?? 99) - (b.route.handle?.order ?? 99),
  );

  return tree;
}

/**
 * Resets all sidebar-related local storage state.
 * Used during login/logout to ensure a fresh UI state for the user.
 */
export function resetSidebarState() {
  localStorage.removeItem('mini-erp-sidebar-collapsed');

  // Clear all group expansion states
  // We collect keys first to avoid issues with removing items while iterating
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('sidebar-group-')) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));
}
