import { lazy } from 'react';
import { FileText } from 'lucide-react';
import type { AppRoute } from '@/lib/types/navigation';
import { queryClient } from '@/lib/query-client';
import { invoiceDetailQuery } from './hooks/invoices.hooks';
import type { InvoiceResponse } from './api/invoices.api';

const InvoicesListPage = lazy(() => import('./pages/InvoicesListPage'));
const InvoiceDetailsPage = lazy(() => import('./pages/InvoiceDetailsPage'));
const InvoiceFormPage = lazy(() => import('./pages/InvoiceFormPage'));

export const invoiceRoutes: AppRoute[] = [
  {
    path: 'invoices',
    handle: {
      title: 'Invoices',
      icon: FileText,
      showInSidebar: true,
      sidebarGroup: 'Sales',
      order: 20,
      crumb: 'Invoices',
    },
    children: [
      {
        index: true,
        element: <InvoicesListPage />,
      },
      {
        path: 'new',
        element: <InvoiceFormPage />,
        handle: {
          crumb: 'New Invoice',
        },
      },
      {
        path: ':id',
        element: <InvoiceDetailsPage />,
        loader: async ({ params }) => {
          if (!params.id) throw new Error('No id provided');
          return queryClient.ensureQueryData(invoiceDetailQuery(params.id));
        },
        handle: {
          crumb: (data: InvoiceResponse) => data?.documentNumber || 'Invoice Details',
        },
      },
    ],
  },
];
