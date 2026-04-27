import { lazy } from 'react';
import { LayoutList } from 'lucide-react';
import type { AppRoute } from '@/lib/types/navigation';
import { queryClient } from '@/lib/query-client';
import { salesOrderDetailQuery } from './hooks/sales-orders.hooks';
import type { SalesOrderResponse } from './api/sales-orders.api';

const SalesOrdersListPage = lazy(() => import('./pages/SalesOrdersListPage'));
const SalesOrderFormPage = lazy(() => import('./pages/SalesOrderFormPage'));
const SalesOrderDetailsPage = lazy(() => import('./pages/SalesOrderDetailsPage'));

export const salesOrdersRoutes: AppRoute[] = [
  {
    path: 'sales-orders',
    handle: {
      title: 'Sales Orders',
      icon: LayoutList,
      showInSidebar: true,
      crumb: 'Sales Orders',
    },
    children: [
      {
        index: true,
        element: <SalesOrdersListPage />,
      },
      {
        path: 'new',
        element: <SalesOrderFormPage />,
        handle: { crumb: 'Create Order' },
      },
      {
        path: ':id',
        element: <SalesOrderDetailsPage />,
        loader: async ({ params }) => {
          if (!params.id) throw new Error('No id provided');
          return queryClient.ensureQueryData(salesOrderDetailQuery(params.id));
        },
        handle: {
          crumb: (data: SalesOrderResponse) => data?.documentNumber ?? 'Details',
        },
      },
      {
        path: ':id/edit',
        element: <SalesOrderFormPage />,
        loader: async ({ params }) => {
          if (!params.id) throw new Error('No id provided');
          return queryClient.ensureQueryData(salesOrderDetailQuery(params.id));
        },
        handle: {
          crumb: (data: SalesOrderResponse) => (data ? `Edit ${data.documentNumber}` : 'Edit'),
        },
      },
    ],
  },
];
