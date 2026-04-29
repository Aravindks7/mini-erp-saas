import { lazy } from 'react';
import { ReceiptText } from 'lucide-react';
import type { AppRoute } from '@/lib/types/navigation';
import { queryClient } from '@/lib/query-client';
import { billDetailQuery } from './hooks/bills.hooks';
import type { BillResponse } from './api/bills.api';

const BillsListPage = lazy(() => import('./pages/BillsListPage'));
const BillFormPage = lazy(() => import('./pages/BillFormPage'));
const BillDetailsPage = lazy(() => import('./pages/BillDetailsPage'));

export const billRoutes: AppRoute[] = [
  {
    path: 'bills',
    handle: {
      title: 'Vendor Bills',
      icon: ReceiptText,
      showInSidebar: true,
      sidebarGroup: 'Purchasing',
      order: 40,
      crumb: 'Vendor Bills',
    },
    children: [
      {
        index: true,
        element: <BillsListPage />,
      },
      {
        path: 'new',
        element: <BillFormPage />,
        handle: { crumb: 'Record Bill' },
      },
      {
        path: ':id',
        element: <BillDetailsPage />,
        loader: async ({ params }) => {
          if (!params.id) throw new Error('No id provided');
          return queryClient.ensureQueryData(billDetailQuery(params.id));
        },
        handle: {
          crumb: (data: BillResponse) => data?.referenceNumber ?? 'Details',
        },
      },
      {
        path: ':id/edit',
        element: <BillFormPage />,
        loader: async ({ params }) => {
          if (!params.id) throw new Error('No id provided');
          return queryClient.ensureQueryData(billDetailQuery(params.id));
        },
        handle: {
          crumb: (data: BillResponse) => (data ? `Edit ${data.referenceNumber}` : 'Edit'),
        },
      },
    ],
  },
];
