import type { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/shared/data-table/DataTableColumnHeader';
import { UserDisplay } from '@/components/shared/UserDisplay';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatDate } from '@shared/utils/date';
import type { MemberResponse } from '@shared/contracts/members.contract';

export const columns: ColumnDef<MemberResponse>[] = [
  {
    accessorKey: 'user.name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Member" />,
    cell: ({ row }) => (
      <UserDisplay
        name={row.original.user.name}
        email={row.original.user.email}
        avatarUrl={row.original.user.image || undefined}
      />
    ),
  },
  {
    accessorKey: 'roleName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
    cell: ({ row }) => (
      <StatusBadge
        value={row.original.roleName}
        statusMap={{
          [row.original.roleName]: {
            label: row.original.roleName,
            tone: row.original.roleName === 'Admin' ? 'danger' : 'info',
          },
        }}
      />
    ),
  },
  {
    accessorKey: 'joinedAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Joined Date" />,
    cell: ({ row }) => formatDate(row.original.joinedAt),
  },
];
