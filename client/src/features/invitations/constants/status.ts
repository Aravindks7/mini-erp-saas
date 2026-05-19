import { createStatusMap } from '@/lib/status-utils';

export const INVITE_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REVOKED: 'revoked',
} as const;

export type InviteStatus = (typeof INVITE_STATUS)[keyof typeof INVITE_STATUS];

export const inviteStatusMap = createStatusMap({
  [INVITE_STATUS.PENDING]: 'Pending',
  [INVITE_STATUS.ACCEPTED]: 'Accepted',
  [INVITE_STATUS.REVOKED]: 'Revoked',
});
