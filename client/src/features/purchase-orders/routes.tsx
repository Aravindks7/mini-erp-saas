import { lazy } from 'react';
import { ShoppingCart } from 'lucide-react';
import type { AppRoute } from '@/lib/types/navigation';
import { queryClient } from '@/lib/query-client';
import { purchaseOrderDetailQuery } from './hooks/purchase-orders.hooks';
import type { PurchaseOrderResponse } from './api/purchase-orders.api';

const PurchaseOrdersListPage = lazy(() => import('./pages/PurchaseOrdersListPage'));
const PurchaseOrderFormPage = lazy(() => import('./pages/PurchaseOrderFormPage'));
const PurchaseOrderDetailsPage = lazy(() => import('./pages/PurchaseOrderDetailsPage'));

export const purchaseOrdersRoutes: AppRoute[] = [
  {
    path: 'purchase-orders',
    handle: {
      title: 'Purchase Orders',
      icon: ShoppingCart,
      showInSidebar: true,
      crumb: 'Purchase Orders',
    },
    children: [
      {
        index: true,
        element: <PurchaseOrdersListPage />,
      },
      {
        path: 'new',
        element: <PurchaseOrderFormPage />,
        handle: { crumb: 'Create Order' },
      },
      {
        path: ':id',
        element: <PurchaseOrderDetailsPage />,
        loader: async ({ params }) => {
          if (!params.id) throw new Error('No id provided');
          return queryClient.ensureQueryData(purchaseOrderDetailQuery(params.id));
        },
        handle: {
          crumb: (data: PurchaseOrderResponse) => data?.documentNumber ?? 'Details',
        },
      },
      {
        path: ':id/edit',
        element: <PurchaseOrderFormPage />,
        loader: async ({ params }) => {
          if (!params.id) throw new Error('No id provided');
          return queryClient.ensureQueryData(purchaseOrderDetailQuery(params.id));
        },
        handle: {
          crumb: (data: PurchaseOrderResponse) => (data ? `Edit ${data.documentNumber}` : 'Edit'),
        },
      },
    ],
  },
];
