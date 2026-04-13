import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import DashboardLayout from '@/layouts/DashboardLayout';
import { AuthGuard } from '@/components/guards/AuthGuard';
import { TenantGuard } from '@/components/guards/TenantGuard';
import { RouteErrorBoundary } from '@/components/shared/RouteErrorBoundary';

import { dashboardRoutes, publicRoutes } from '@/lib/router-registry';

/**
 * Terminal Module: The App Router Orchestrator.
 * This file is a terminal node in the dependency graph to avoid circularities.
 * All route data is sourced from router-registry.tsx.
 */
export const router = createBrowserRouter([
  ...publicRoutes,
  {
    path: '/',
    errorElement: <RouteErrorBoundary />,
    element: (
      <AuthGuard>
        <TenantGuard>
          <DashboardLayout />
        </TenantGuard>
      </AuthGuard>
    ),
    children: dashboardRoutes as RouteObject[],
  },
]);
