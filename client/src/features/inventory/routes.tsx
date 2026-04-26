import { lazy } from 'react';
import { Boxes, ClipboardList } from 'lucide-react';
import type { AppRoute } from '@/lib/types/navigation';

const InventoryLevelsPage = lazy(() =>
  import('./pages/InventoryLevelsPage').then((m) => ({ default: m.InventoryLevelsPage })),
);
const AdjustmentsListPage = lazy(() =>
  import('./pages/AdjustmentsListPage').then((m) => ({ default: m.AdjustmentsListPage })),
);
const AdjustmentFormPage = lazy(() =>
  import('./pages/AdjustmentFormPage').then((m) => ({ default: m.AdjustmentFormPage })),
);
const AdjustmentDetailsPage = lazy(() =>
  import('./pages/AdjustmentDetailsPage').then((m) => ({ default: m.AdjustmentDetailsPage })),
);
const InventoryLedgerPage = lazy(() =>
  import('./pages/InventoryLedgerPage').then((m) => ({ default: m.InventoryLedgerPage })),
);

export const inventoryRoutes: AppRoute[] = [
  {
    path: 'inventory',
    handle: {
      title: 'Inventory',
      icon: Boxes,
      showInSidebar: true,
      crumb: 'Inventory',
    },
    children: [
      {
        index: true,
        element: <InventoryLevelsPage />,
      },
    ],
  },
  {
    path: 'ledger',
    element: <InventoryLedgerPage />,
    handle: {
      title: 'Ledger',
      crumb: 'Movement Ledger',
    },
  },
  {
    path: 'adjustments',
    handle: {
      title: 'Adjustments',
      icon: ClipboardList,
      showInSidebar: true,
      crumb: 'Adjustments',
    },
    children: [
      {
        index: true,
        element: <AdjustmentsListPage />,
      },
      {
        path: 'new',
        element: <AdjustmentFormPage />,
        handle: { crumb: 'New Adjustment' },
      },
      {
        path: ':id',
        element: <AdjustmentDetailsPage />,
        handle: {
          crumb: 'Adjustment Details',
        },
      },
    ],
  },
];
