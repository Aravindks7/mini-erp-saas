import { ShoppingCart } from 'lucide-react';
import type { AppRoute } from '@/lib/types/navigation';
import PurchasingModulePage from './pages/PurchasingModulePage';
import { supplierRoutes } from '../suppliers/routes';
import { purchaseOrdersRoutes } from '../purchase-orders/routes';
import { receiptRoutes } from '../receipts/routes';
import { billRoutes } from '../bills/routes';

export const purchasingRoutes: AppRoute[] = [
  {
    path: 'purchasing',
    handle: {
      title: 'Purchasing',
      icon: ShoppingCart,
      crumb: 'Purchasing',
      sidebarGroup: 'Purchasing',
      isModuleRoot: true,
      showInSidebar: true,
      hidden: true,
    },
    children: [
      {
        index: true,
        element: <PurchasingModulePage />,
      },
      ...supplierRoutes,
      ...purchaseOrdersRoutes,
      ...receiptRoutes,
      ...billRoutes,
    ],
  },
];
