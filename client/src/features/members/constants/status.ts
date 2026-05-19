import { createStatusMap } from '@/lib/status-utils';

export const memberRoleStatusMap = createStatusMap(
  {
    Admin: 'Admin',
    Member: 'Member',
    Owner: 'Owner',
  },
  {
    Admin: 'danger',
    Member: 'info',
    Owner: 'purple',
  },
);
