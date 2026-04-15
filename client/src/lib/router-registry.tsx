import type { RouteObject } from 'react-router-dom';
import type { AppRoute } from '@/lib/types/navigation';

import { authRoutes } from '@/features/auth/routes';
import { dashboardRoutes as coreDashboardRoutes } from '@/features/dashboard/routes';
import { customerRoutes } from '@/features/customers/routes';
import { settingsRoutes } from '@/features/settings/routes';

/**
 * Registry of all dashboard-internal routes.
 * Extracted to a separate module to prevent circular dependencies
 * between the app-router and UI components (like SidebarContent).
 */
export const dashboardRoutes: AppRoute[] = [
  ...coreDashboardRoutes,
  ...customerRoutes,
  ...settingsRoutes,
];

/**
 * Registry of all top-level public/auth routes.
 */
export const publicRoutes: RouteObject[] = [...authRoutes];
