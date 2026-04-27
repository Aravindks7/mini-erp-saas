import { lazy } from 'react';
import { Truck } from 'lucide-react';
import type { AppRoute } from '@/lib/types/navigation';

const ShipmentsListPage = lazy(() => import('./pages/ShipmentsListPage'));

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
    ],
  },
];
