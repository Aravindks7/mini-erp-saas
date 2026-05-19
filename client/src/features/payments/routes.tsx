import { lazy } from 'react';
import { CreditCard } from 'lucide-react';
import type { AppRoute } from '@/lib/types/navigation';
import { queryClient } from '@/lib/query-client';
import { paymentDetailQuery } from './hooks/payments.hooks';
import type { PaymentResponse } from './api/payments.api';

const PaymentsListPage = lazy(() => import('./pages/PaymentsListPage'));
const PaymentFormPage = lazy(() => import('./pages/PaymentFormPage'));
const PaymentDetailsPage = lazy(() => import('./pages/PaymentDetailsPage'));

export const paymentRoutes: AppRoute[] = [
  {
    path: 'payments',
    handle: {
      title: 'Payments',
      icon: CreditCard,
      showInSidebar: true,
      sidebarGroup: 'Finance',
      order: 30,
      crumb: 'Payments',
    },
    children: [
      {
        index: true,
        element: <PaymentsListPage />,
      },
      {
        path: 'new',
        element: <PaymentFormPage />,
        handle: { crumb: 'Record Payment' },
      },
      {
        path: ':id',
        element: <PaymentDetailsPage />,
        loader: async ({ params }) => {
          if (!params.id) throw new Error('No id provided');
          return queryClient.ensureQueryData(paymentDetailQuery(params.id));
        },
        handle: {
          crumb: (data: PaymentResponse) => data?.referenceNumber ?? 'Payment Details',
        },
      },
    ],
  },
];
