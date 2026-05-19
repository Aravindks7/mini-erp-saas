import { lazy } from 'react';
import { Truck } from 'lucide-react';
import type { AppRoute } from '@/lib/types/navigation';
import { queryClient } from '@/lib/query-client';
import { shipmentDetailQuery } from './hooks/shipments.hooks';
import type { ShipmentResponse } from './api/shipments.api';

const ShipmentsListPage = lazy(() => import('./pages/ShipmentsListPage'));
const ShipmentFormPage = lazy(() => import('./pages/ShipmentFormPage'));
const ShipmentDetailsPage = lazy(() => import('./pages/ShipmentDetailsPage'));

export const shipmentRoutes: AppRoute[] = [
  {
    path: 'shipments',
    handle: {
      title: 'Shipments',
      icon: Truck,
      showInSidebar: true,
      sidebarGroup: 'Sales',
      order: 30,
      crumb: 'Shipments',
    },
    children: [
      {
        index: true,
        element: <ShipmentsListPage />,
      },
      {
        path: 'new',
        element: <ShipmentFormPage />,
        handle: {
          title: 'Create Shipment',
          crumb: 'New Shipment',
        },
      },
      {
        path: ':id',
        element: <ShipmentDetailsPage />,
        loader: async ({ params }) => {
          if (!params.id) throw new Error('No id provided');
          return queryClient.ensureQueryData(shipmentDetailQuery(params.id));
        },
        handle: {
          title: 'Shipment Details',
          crumb: (data: ShipmentResponse) => data?.shipmentNumber || 'Details',
        },
      },
    ],
  },
];
