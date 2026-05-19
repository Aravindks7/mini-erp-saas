import { CircleDollarSign } from 'lucide-react';
import type { AppRoute } from '@/lib/types/navigation';
import SalesModulePage from './pages/SalesModulePage';
import { customerRoutes } from '../customers/routes';
import { salesOrdersRoutes } from '../sales-orders/routes';
import { invoiceRoutes } from '../invoices/routes';
import { shipmentRoutes } from '../shipments/routes';

export const salesRoutes: AppRoute[] = [
  {
    path: 'sales',
    handle: {
      title: 'Sales',
      icon: CircleDollarSign,
      crumb: 'Sales',
      sidebarGroup: 'Sales',
      isModuleRoot: true,
      showInSidebar: true,
      hidden: true,
    },
    children: [
      {
        index: true,
        element: <SalesModulePage />,
      },
      ...customerRoutes,
      ...salesOrdersRoutes,
      ...invoiceRoutes,
      ...shipmentRoutes,
    ],
  },
];
