import {
  type LucideIcon,
  ShoppingCart,
  ShoppingBag,
  Package,
  Factory,
  DollarSign,
} from 'lucide-react';
import type { AppRoute } from './types/navigation';

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
  Manufacturing: { icon: Factory, order: 40 },
  Financials: { icon: DollarSign, order: 50 },
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

  for (const route of routes) {
    if (!route.handle?.showInSidebar || route.handle?.hidden) {
      continue;
    }

    const routePath = route.index ? '' : `/${route.path}`;
    const fullPath = tenantSlug ? `/${tenantSlug}${routePath}` : routePath || '/';

    // For index routes (like dashboard), we want exact match.
    // For others, any sub-path makes it active.
    const isActive = route.index ? currentPath === fullPath : currentPath.startsWith(fullPath);

    const sidebarItem: SidebarItem = { route, path: fullPath, isActive };
    const groupName = route.handle.sidebarGroup;

    if (!groupName) {
      const order = route.handle.order ?? 0;
      if (order >= 90) {
        tree.ungroupedBottom.push(sidebarItem);
      } else {
        tree.ungroupedTop.push(sidebarItem);
      }
      continue;
    }

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
    group.items.push(sidebarItem);

    if (isActive) {
      group.isActive = true;
      tree.activeGroupId = group.id;
    }
  }

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
