import { Truck } from 'lucide-react';
import type { AppRoute } from '@/lib/types/navigation';
import SuppliersListPage from './pages/SuppliersListPage';
import SupplierFormPage from './pages/SupplierFormPage';
import SupplierDetailsPage from './pages/SupplierDetailsPage';
import { queryClient } from '@/lib/query-client';
import { supplierDetailQuery } from './hooks/suppliers.hooks';
import type { SupplierResponse } from './api/suppliers.api';

export const supplierRoutes: AppRoute[] = [
  {
    path: 'suppliers',
    handle: {
      title: 'Suppliers',
      icon: Truck,
      showInSidebar: true,
      crumb: 'Suppliers',
    },
    children: [
      {
        index: true,
        element: <SuppliersListPage />,
      },
      {
        path: 'new',
        element: <SupplierFormPage />,
        handle: { crumb: 'Add Supplier' },
      },
      {
        path: ':id',
        element: <SupplierDetailsPage />,
        loader: async ({ params }) => {
          if (!params.id) throw new Error('No id provided');
          return queryClient.ensureQueryData(supplierDetailQuery(params.id));
        },
        handle: {
          crumb: (data: SupplierResponse) => data?.name ?? 'Details',
        },
      },
      {
        path: ':id/edit',
        element: <SupplierFormPage />,
        loader: async ({ params }) => {
          if (!params.id) throw new Error('No id provided');
          return queryClient.ensureQueryData(supplierDetailQuery(params.id));
        },
        handle: {
          crumb: (data: SupplierResponse) => (data ? `Edit ${data.name}` : 'Edit'),
        },
      },
    ],
  },
];
