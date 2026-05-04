import { lazy } from 'react';
import { LayoutGrid } from 'lucide-react';
import type { AppRoute } from '@/lib/types/navigation';
import { queryClient } from '@/lib/query-client';
import { accountDetailQuery } from './hooks/accounts.hooks';
import type { AccountResponse } from './api/accounts.api';

const AccountsListPage = lazy(() => import('./pages/AccountsPage'));
const AccountDetailsPage = lazy(() => import('./pages/AccountDetailsPage'));

export const accountRoutes: AppRoute[] = [
  {
    path: 'finance/accounts',
    handle: {
      title: 'Chart of Accounts',
      icon: LayoutGrid,
      showInSidebar: true,
      sidebarGroup: 'Finance',
      order: 10,
      crumb: 'Chart of Accounts',
    },
    children: [
      {
        index: true,
        element: <AccountsListPage />,
      },
      {
        path: ':id',
        element: <AccountDetailsPage />,
        loader: async ({ params }) => {
          if (!params.id) throw new Error('No id provided');
          return queryClient.ensureQueryData(accountDetailQuery(params.id));
        },
        handle: {
          crumb: (data: AccountResponse) => (data ? `${data.code} - ${data.name}` : 'Details'),
        },
      },
    ],
  },
];
