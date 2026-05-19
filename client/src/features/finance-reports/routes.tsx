import { lazy } from 'react';
import type { AppRoute } from '@/lib/types/navigation';
import { BarChart3, PieChart } from 'lucide-react';

const ProfitAndLossPage = lazy(() => import('./pages/ProfitAndLossPage'));
const BalanceSheetPage = lazy(() => import('./pages/BalanceSheetPage'));

export const financeReportsRoutes: AppRoute[] = [
  {
    path: 'reports/pnl',
    element: <ProfitAndLossPage />,
    handle: {
      title: 'Profit & Loss',
      icon: BarChart3,
      showInSidebar: true,
      sidebarGroup: 'Finance',
      order: 40,
      crumb: 'Profit & Loss',
    },
  },
  {
    path: 'reports/balance-sheet',
    element: <BalanceSheetPage />,
    handle: {
      title: 'Balance Sheet',
      icon: PieChart,
      showInSidebar: true,
      sidebarGroup: 'Finance',
      order: 50,
      crumb: 'Balance Sheet',
    },
  },
];
