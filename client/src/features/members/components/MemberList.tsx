import * as React from 'react';
import { toast } from 'sonner';
import { UserCog, UserMinus, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMembersQuery, useUpdateMemberRole, useRemoveMember } from '../hooks/members.hooks';
import { useRolesQuery } from '@/features/roles';
import type { MemberResponse } from '@shared/contracts/members.contract';
import { columns } from './columns';
import { EntityTable } from '@/components/shared/data-table/EntityTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { usePermission } from '@/hooks/usePermission';
import { PERMISSIONS } from '@shared/index';
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';

export function MemberList() {
  const { data: session } = useAuth();
  const { data: members, isLoading } = useMembersQuery();
  const { data: roles } = useRolesQuery();
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const canManageMembers = usePermission(PERMISSIONS.ORGANIZATION.MEMBERS);

  const [confirmRemove, setConfirmRemove] = React.useState<MemberResponse | null>(null);

  const handleRoleChange = async (member: MemberResponse, roleId: string) => {
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

  return (
    <>
      <EntityTable
        data={members || []}
        columns={columns}
        isLoading={isLoading}
        renderRowActions={(member) => {
          if (!canManageMembers) return null;

          const isSelf = member.userId === session?.user?.id;

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
