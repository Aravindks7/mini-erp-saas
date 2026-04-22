import { useState } from 'react';
import { toast } from 'sonner';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMembers, useUpdateMemberRole, useRemoveMember } from '../hooks/organizations.hooks';
import { useRoles } from '@/features/auth/hooks/rbac.hooks';
import type { OrganizationMember } from '../api/organizations.api';
import { EntityTable } from '@/components/shared/data-table/EntityTable';
import { UserDisplay } from '@/components/shared/UserDisplay';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatDate } from '@shared/utils/date';
import { type ColumnDef } from '@tanstack/react-table';
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { UserCog, UserMinus, Shield } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { PERMISSIONS } from '@shared/index';
import { usePermission } from '@/hooks/usePermission';

export function MembersTab() {
  const { activeOrganizationId } = useTenant();
  const { data: session } = useAuth();
  const { data: members, isLoading } = useMembers(activeOrganizationId || '');
  const { data: roles } = useRoles();
  const updateRole = useUpdateMemberRole(activeOrganizationId || '');
  const removeMember = useRemoveMember(activeOrganizationId || '');
  const canManageMembers = usePermission(PERMISSIONS.ORGANIZATION.MEMBERS);

  const [confirmRemove, setConfirmRemove] = useState<OrganizationMember | null>(null);

  const handleRoleChange = async (member: OrganizationMember, roleId: string) => {
    try {
      await updateRole.mutateAsync({
        userId: member.userId,
        data: { roleId },
      });
      toast.success('Role updated successfully');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '';
      if (message === 'LAST_ADMIN_LOCKOUT') {
        toast.error('Cannot downgrade the last administrator');
      } else {
        toast.error('Failed to update role');
      }
    }
  };

  const handleRemoveMember = async () => {
    if (!confirmRemove) return;
    try {
      await removeMember.mutateAsync(confirmRemove.userId);
      toast.success('Member removed');
      setConfirmRemove(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '';
      if (message === 'LAST_ADMIN_LOCKOUT') {
        toast.error('Cannot remove the last administrator');
      } else {
        toast.error('Failed to remove member');
      }
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
      accessorKey: 'roleName',
      header: 'Role',
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
          if (!canManageMembers) return null;

          const isSelf = member.userId === session?.user?.id;
          // Note: In a dynamic system, "isLastAdmin" logic is handled by the backend
          // but we can provide a better UI by fetching roles and checking permissions.

          return (
            <>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger disabled={updateRole.isPending}>
                  <UserCog className="mr-2 h-4 w-4" />
                  Change Role
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    {roles?.map((role) => (
                      <DropdownMenuItem
                        key={role.id}
                        disabled={role.id === member.roleId}
                        onClick={() => handleRoleChange(member, role.id)}
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        {role.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
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
