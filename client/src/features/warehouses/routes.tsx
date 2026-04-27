import { lazy } from 'react';
import { Warehouse } from 'lucide-react';
import type { AppRoute } from '@/lib/types/navigation';
import { queryClient } from '@/lib/query-client';
import { warehouseDetailQuery } from './hooks/warehouses.hooks';
import type { WarehouseResponse } from './api/warehouses.api';

const WarehousesListPage = lazy(() => import('./pages/WarehousesListPage'));
const WarehouseFormPage = lazy(() => import('./pages/WarehouseFormPage'));
const WarehouseDetailsPage = lazy(() => import('./pages/WarehouseDetailsPage'));

export const warehouseRoutes: AppRoute[] = [
  {
    path: 'warehouses',
    handle: {
      title: 'Warehouses',
      icon: Warehouse,
      showInSidebar: true,
      sidebarGroup: 'Inventory',
      order: 30,
      crumb: 'Warehouses',
    },
    children: [
      {
        index: true,
        element: <WarehousesListPage />,
      },
      {
        path: 'new',
        element: <WarehouseFormPage />,
        handle: { crumb: 'Add Warehouse' },
      },
      {
        path: ':id',
        element: <WarehouseDetailsPage />,
        loader: async ({ params }) => {
          if (!params.id) throw new Error('No id provided');
          return queryClient.ensureQueryData(warehouseDetailQuery(params.id));
        },
        handle: {
          crumb: (data: WarehouseResponse) => data?.name ?? 'Details',
        },
      },
      {
        path: ':id/edit',
        element: <WarehouseFormPage />,
        loader: async ({ params }) => {
          if (!params.id) throw new Error('No id provided');
          return queryClient.ensureQueryData(warehouseDetailQuery(params.id));
        },
        handle: {
          crumb: (data: WarehouseResponse) => (data ? `Edit ${data.name}` : 'Edit'),
        },
      },
    ],
  },
];
