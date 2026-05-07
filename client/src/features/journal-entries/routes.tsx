import { lazy } from 'react';
import { BookOpen } from 'lucide-react';
import type { AppRoute } from '@/lib/types/navigation';
import { queryClient } from '@/lib/query-client';
import { journalEntryDetailQuery } from './hooks/journal-entries.hooks';
import type { JournalEntryResponse } from './api/journal-entries.api';

const JournalEntriesPage = lazy(() => import('./pages/JournalEntriesPage'));
const JournalEntryFormPage = lazy(() => import('./pages/JournalEntryFormPage'));
const JournalEntryDetailsPage = lazy(() => import('./pages/JournalEntryDetailsPage'));

export const journalEntryRoutes: AppRoute[] = [
  {
    path: 'journal-entries',
    handle: {
      title: 'General Ledger',
      icon: BookOpen,
      showInSidebar: true,
      sidebarGroup: 'Finance',
      order: 20,
      crumb: 'General Ledger',
    },
    children: [
      {
        index: true,
        element: <JournalEntriesPage />,
      },
      {
        path: 'new',
        element: <JournalEntryFormPage />,
        handle: { crumb: 'New Entry' },
      },
      {
        path: ':id',
        element: <JournalEntryDetailsPage />,
        loader: async ({ params }) => {
          if (!params.id) throw new Error('No id provided');
          return queryClient.ensureQueryData(journalEntryDetailQuery(params.id));
        },
        handle: {
          crumb: (data: JournalEntryResponse) => data?.reference || 'Entry Details',
        },
      },
    ],
  },
];
