import { Users } from 'lucide-react';
import type { AppRoute } from '@/lib/types/navigation';
import CustomersPage from './pages/CustomersPage';
import CustomerFormPage from './pages/CustomerFormPage';
import CustomerDetailsPage from './pages/CustomerDetailsPage';
import { queryClient } from '@/lib/query-client';
import { customerDetailQuery } from './hooks/customers.hooks';
import type { CustomerResponse } from './api/customers.api';

export const customerRoutes: AppRoute[] = [
  {
    path: 'customers',
    handle: {
      title: 'Customers',
      icon: Users,
      showInSidebar: true,
      crumb: 'Customers',
    },
    children: [
      {
        index: true,
        element: <CustomersPage />,
      },
      {
        path: 'new',
        element: <CustomerFormPage />,
        handle: { crumb: 'Add Customer' },
      },
      {
        path: ':id',
        element: <CustomerDetailsPage />,
        loader: async ({ params }) => {
          if (!params.id) throw new Error('No id provided');
          return queryClient.ensureQueryData(customerDetailQuery(params.id));
        },
        handle: {
          crumb: (data: CustomerResponse) => data?.companyName ?? 'Details',
        },
      },
      {
        path: ':id/edit',
        element: <CustomerFormPage />,
        loader: async ({ params }) => {
          if (!params.id) throw new Error('No id provided');
          return queryClient.ensureQueryData(customerDetailQuery(params.id));
        },
        handle: {
          crumb: (data: CustomerResponse) => (data ? `Edit ${data.companyName}` : 'Edit'),
        },
      },
    ],
  },
];
