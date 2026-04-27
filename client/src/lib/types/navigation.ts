/* eslint-disable @typescript-eslint/no-explicit-any */
import { type LucideIcon } from 'lucide-react';
import type { RouteObject } from 'react-router-dom';

export interface RouteManifest {
  /** The human-readable title for sidebars and breadcrumbs */
  title?: string;
  /** The lucide-react icon component */
  icon?: LucideIcon;
  /** Should this route project into the primary sidebar? */
  showInSidebar?: boolean;
  /** The group this module belongs to in the sidebar (e.g., 'Sales') */
  sidebarGroup?: string;
  /** Sort order within the group or sidebar */
  order?: number;
  /** Whether the route is completely hidden from navigation */
  hidden?: boolean;
  /** RBAC: Minimum clearance required to view this link */
  requiredRoles?: ('admin' | 'manager' | 'user')[];
  /** Breadcrumb handler */
  crumb?: string | ((data: any) => string);
}

export type AppRoute = RouteObject & {
  handle?: RouteManifest;
  children?: AppRoute[];
};
