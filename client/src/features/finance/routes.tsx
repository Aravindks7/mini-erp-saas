import { Wallet } from 'lucide-react';
import type { AppRoute } from '@/lib/types/navigation';
import FinanceModulePage from './pages/FinanceModulePage';
import { accountRoutes } from '../accounts/routes';
import { journalEntryRoutes } from '../journal-entries/routes';
import { paymentRoutes } from '../payments/routes';
import { financeReportsRoutes } from '../finance-reports/routes';

export const financeRoutes: AppRoute[] = [
  {
    path: 'finance',
    handle: {
      title: 'Finance',
      icon: Wallet,
      crumb: 'Finance',
      sidebarGroup: 'Finance',
      isModuleRoot: true,
      showInSidebar: true,
      hidden: true,
    },
    children: [
      {
        index: true,
        element: <FinanceModulePage />,
      },
      ...accountRoutes,
      ...journalEntryRoutes,
      ...paymentRoutes,
      ...financeReportsRoutes,
    ],
  },
];
