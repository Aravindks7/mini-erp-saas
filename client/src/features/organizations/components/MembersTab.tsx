import { useState } from 'react';
import { toast } from 'sonner';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMembers, useUpdateMemberRole, useRemoveMember } from '../hooks/organizations.hooks';
import type { OrganizationMember } from '../api/organizations.api';
import { EntityTable } from '@/components/shared/data-table/EntityTable';
import { UserDisplay } from '@/components/shared/UserDisplay';
import { StatusBadge, type StatusMap } from '@/components/shared/StatusBadge';
import { formatDate } from '@shared/utils/date';
import { type ColumnDef } from '@tanstack/react-table';
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { UserCog, UserMinus } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

const roleStatusMap: StatusMap<'admin' | 'employee'> = {
  admin: { label: 'Admin', tone: 'danger' },
  employee: { label: 'Employee', tone: 'info' },
};

export function MembersTab() {
  const { activeOrganizationId } = useTenant();
  const { data: session } = useAuth();
  const { data: members, isLoading } = useMembers(activeOrganizationId || '');
  const updateRole = useUpdateMemberRole(activeOrganizationId || '');
  const removeMember = useRemoveMember(activeOrganizationId || '');

  const [confirmRemove, setConfirmRemove] = useState<OrganizationMember | null>(null);

  const handleRoleChange = async (member: OrganizationMember) => {
    const newRole = member.role === 'admin' ? 'employee' : 'admin';
    try {
      await updateRole.mutateAsync({
        userId: member.userId,
        data: { role: newRole },
      });
      toast.success(`Role updated to ${newRole}`);
    } catch {
      toast.error('Failed to update role');
    }
  };

  const handleRemoveMember = async () => {
    if (!confirmRemove) return;
    try {
      await removeMember.mutateAsync(confirmRemove.userId);
      toast.success('Member removed');
      setConfirmRemove(null);
    } catch {
      toast.error('Failed to remove member');
    }
  };

  const columns: ColumnDef<OrganizationMember>[] = [
    {
      accessorKey: 'user.name',
      header: 'Member',
      cell: ({ row }) => (
        <UserDisplay
          name={row.original.user.name}
          email={row.original.user.email}
          avatarUrl={row.original.user.image || undefined}
        />
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => <StatusBadge value={row.original.role} statusMap={roleStatusMap} />,
    },
    {
      accessorKey: 'joinedAt',
      header: 'Joined Date',
      cell: ({ row }) => formatDate(row.original.joinedAt),
    },
  ];

  return (
    <>
      <EntityTable
        data={members || []}
        columns={columns}
        isLoading={isLoading}
        renderRowActions={(member) => {
          const isSelf = member.userId === session?.user?.id;
          if (isSelf) return null;

          const isAdmin = member.role === 'admin';
          const otherAdmins = (members || []).filter(
            (m) => m.role === 'admin' && m.userId !== session?.user?.id,
          );
          // Lockout protection: Prevent changing own role or removing self if last admin
          const lockout = isSelf && isAdmin && otherAdmins.length === 0;

          return (
            <>
              <DropdownMenuItem
                disabled={lockout || updateRole.isPending}
                onClick={() => handleRoleChange(member)}
              >
                <UserCog className="mr-2 h-4 w-4" />
                Change to {member.role === 'admin' ? 'Employee' : 'Admin'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={isSelf || removeMember.isPending}
                className="text-destructive focus:text-destructive"
                onClick={() => setConfirmRemove(member)}
              >
                <UserMinus className="mr-2 h-4 w-4" />
                Remove Member
              </DropdownMenuItem>
            </>
          );
        }}
      />

      <ConfirmDialog
        isOpen={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        onConfirm={handleRemoveMember}
        title="Remove Member"
        description={`Are you sure you want to remove ${confirmRemove?.user.name} from the organization? They will lose all access immediately.`}
        variant="destructive"
        confirmLabel="Remove"
        isLoading={removeMember.isPending}
      />
    </>
  );
}
