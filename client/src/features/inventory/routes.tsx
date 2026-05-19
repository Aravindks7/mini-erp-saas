import { lazy } from 'react';
import { Boxes, ClipboardList, History, ArrowLeftRight } from 'lucide-react';
import type { AppRoute } from '@/lib/types/navigation';
import InventoryModulePage from './pages/InventoryModulePage';
import { productRoutes } from '../products/routes';
import { queryClient } from '@/lib/query-client';
import {
  inventoryLevelDetailQuery,
  inventoryAdjustmentDetailQuery,
  inventoryTransferDetailQuery,
} from './hooks/inventory.hooks';
import type {
  InventoryLevelResponse,
  InventoryAdjustmentResponse,
  InventoryTransferResponse,
} from './api/inventory.api';

const InventoryLevelsPage = lazy(() => import('./pages/InventoryLevelsPage'));
const InventoryLevelDetailsPage = lazy(() => import('./pages/InventoryLevelDetailsPage'));
const AdjustmentsListPage = lazy(() => import('./pages/AdjustmentsListPage'));
const AdjustmentFormPage = lazy(() => import('./pages/AdjustmentFormPage'));
const AdjustmentDetailsPage = lazy(() => import('./pages/AdjustmentDetailsPage'));
const InventoryLedgerPage = lazy(() => import('./pages/InventoryLedgerPage'));
const TransfersListPage = lazy(() => import('./pages/TransfersListPage'));
const TransferFormPage = lazy(() => import('./pages/TransferFormPage'));
const TransferDetailsPage = lazy(() => import('./pages/TransferDetailsPage'));

export const inventoryRoutes: AppRoute[] = [
  {
    path: 'inventory',
    handle: {
      title: 'Inventory',
      icon: Boxes,
      crumb: 'Inventory',
      sidebarGroup: 'Inventory',
      isModuleRoot: true,
      showInSidebar: true,
      hidden: true,
    },
    children: [
      {
        index: true,
        element: <InventoryModulePage />,
      },
      ...productRoutes,
      {
        path: 'levels',
        handle: {
          title: 'Stock Levels',
          icon: Boxes,
          showInSidebar: true,
          sidebarGroup: 'Inventory',
          order: 20,
          crumb: 'Stock Levels',
        },
        children: [
          {
            index: true,
            element: <InventoryLevelsPage />,
          },
          {
            path: ':id',
            element: <InventoryLevelDetailsPage />,
            loader: async ({ params }) => {
              if (!params.id) throw new Error('No id provided');
              return queryClient.ensureQueryData(inventoryLevelDetailQuery(params.id));
            },
            handle: {
              crumb: (data: InventoryLevelResponse) => data?.product?.name || 'Level Details',
            },
          },
        ],
      },
      {
        path: 'ledger',
        element: <InventoryLedgerPage />,
        handle: {
          title: 'Ledger',
          icon: History,
          showInSidebar: true,
          sidebarGroup: 'Inventory',
          order: 40,
          crumb: 'Ledger',
        },
      },
      {
        path: 'adjustments',
        handle: {
          title: 'Adjustments',
          icon: ClipboardList,
          showInSidebar: true,
          sidebarGroup: 'Inventory',
          order: 30,
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
            loader: async ({ params }) => {
              if (!params.id) throw new Error('No id provided');
              return queryClient.ensureQueryData(inventoryAdjustmentDetailQuery(params.id));
            },
            handle: {
              crumb: (data: InventoryAdjustmentResponse) => data?.reference || 'Adjustment Details',
            },
          },
        ],
      },
      {
        path: 'transfers',
        handle: {
          title: 'Transfers',
          icon: ArrowLeftRight,
          showInSidebar: true,
          sidebarGroup: 'Inventory',
          order: 35,
          crumb: 'Transfers',
        },
        children: [
          {
            index: true,
            element: <TransfersListPage />,
          },
          {
            path: 'new',
            element: <TransferFormPage />,
            handle: {
              crumb: 'New Transfer',
            },
          },
          {
            path: ':id',
            element: <TransferDetailsPage />,
            loader: async ({ params }) => {
              if (!params.id) throw new Error('No id provided');
              return queryClient.ensureQueryData(inventoryTransferDetailQuery(params.id));
            },
            handle: {
              crumb: (data: InventoryTransferResponse) => data?.reference || 'Transfer Details',
            },
          },
        ],
      },
    ],
  },
];
