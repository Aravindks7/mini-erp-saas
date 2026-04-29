import { lazy } from 'react';
import { FileText } from 'lucide-react';
import type { AppRoute } from '@/lib/types/navigation';

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
      order: 40,
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
        handle: {
          crumb: (data: { documentNumber?: string }) => data?.documentNumber || 'Invoice Details',
        },
      },
    ],
  },
];
