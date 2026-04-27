import { lazy } from 'react';
import { Users } from 'lucide-react';
import type { AppRoute } from '@/lib/types/navigation';
import { queryClient } from '@/lib/query-client';
import { customerDetailQuery } from './hooks/customers.hooks';
import type { CustomerResponse } from './api/customers.api';

const CustomersListPage = lazy(() => import('./pages/CustomersListPage'));
const CustomerFormPage = lazy(() => import('./pages/CustomerFormPage'));
const CustomerDetailsPage = lazy(() => import('./pages/CustomerDetailsPage'));

export const customerRoutes: AppRoute[] = [
  {
    path: 'customers',
    handle: {
      title: 'Customers',
      icon: Users,
      showInSidebar: true,
      sidebarGroup: 'Sales',
      order: 10,
      crumb: 'Customers',
    },
    children: [
      {
        index: true,
        element: <CustomersListPage />,
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
