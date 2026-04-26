import { Package } from 'lucide-react';
import type { AppRoute } from '@/lib/types/navigation';
import ProductsListPage from './pages/ProductsListPage';
import ProductFormPage from './pages/ProductFormPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import { queryClient } from '@/lib/query-client';
import { productDetailQuery } from './hooks/products.hooks';
import type { ProductResponse } from './api/products.api';

export const productRoutes: AppRoute[] = [
  {
    path: 'products',
    handle: {
      title: 'Products',
      icon: Package,
      showInSidebar: true,
      crumb: 'Products',
    },
    children: [
      {
        index: true,
        element: <ProductsListPage />,
      },
      {
        path: 'new',
        element: <ProductFormPage />,
        handle: { crumb: 'Add Product' },
      },
      {
        path: ':id',
        element: <ProductDetailsPage />,
        loader: async ({ params }) => {
          if (!params.id) throw new Error('No id provided');
          return queryClient.ensureQueryData(productDetailQuery(params.id));
        },
        handle: {
          crumb: (data: ProductResponse) => data?.name || 'Product Details',
        },
      },
      {
        path: ':id/edit',
        element: <ProductFormPage />,
        loader: async ({ params }) => {
          if (!params.id) throw new Error('No id provided');
          return queryClient.ensureQueryData(productDetailQuery(params.id));
        },
        handle: {
          crumb: (data: ProductResponse) => (data ? `Edit ${data.name}` : 'Edit'),
        },
      },
    ],
  },
];
