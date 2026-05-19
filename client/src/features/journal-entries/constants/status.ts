import { createStatusMap } from '@/lib/status-utils';

export const JOURNAL_STATUS = {
  DRAFT: 'draft',
  POSTED: 'posted',
  CANCELLED: 'cancelled',
} as const;

export type JournalStatus = (typeof JOURNAL_STATUS)[keyof typeof JOURNAL_STATUS];

export const journalStatusMap = createStatusMap({
  [JOURNAL_STATUS.DRAFT]: 'Draft',
  [JOURNAL_STATUS.POSTED]: 'Posted',
  [JOURNAL_STATUS.CANCELLED]: 'Cancelled',
});
