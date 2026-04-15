import { useState } from 'react';
import { toast } from 'sonner';
import { useTenant } from '@/contexts/TenantContext';
import { useInvitations, useResendInvite, useCancelInvite } from '../hooks/organizations.hooks';
import type { OrganizationInvite } from '../api/organizations.api';
import { EntityTable } from '@/components/shared/data-table/EntityTable';
import { StatusBadge, type StatusMap } from '@/components/shared/StatusBadge';
import { formatDate } from '@shared/utils/date';
import { type ColumnDef } from '@tanstack/react-table';
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { RefreshCw, XCircle, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InviteMemberDialog } from './InviteMemberDialog';

const inviteStatusMap: StatusMap<'pending' | 'accepted' | 'revoked'> = {
  pending: { label: 'Pending', tone: 'warning' },
  accepted: { label: 'Accepted', tone: 'success' },
  revoked: { label: 'Revoked', tone: 'neutral' },
};

export function InvitationsTab() {
  const { activeOrganizationId } = useTenant();
  const { data: invitations, isLoading } = useInvitations(activeOrganizationId || '');
  const resendInvite = useResendInvite(activeOrganizationId || '');
  const cancelInvite = useCancelInvite(activeOrganizationId || '');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  const handleResend = async (id: string) => {
    try {
      await resendInvite.mutateAsync(id);
      toast.success('Invitation resent');
    } catch {
      toast.error('Failed to resend invitation');
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelInvite.mutateAsync(id);
      toast.success('Invitation cancelled');
    } catch {
      toast.error('Failed to cancel invitation');
    }
  };

  const columns: ColumnDef<OrganizationInvite>[] = [
    { accessorKey: 'email', header: 'Email' },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => <span className="capitalize">{row.original.role}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge value={row.original.status} statusMap={inviteStatusMap} />,
    },
    {
      accessorKey: 'createdAt',
      header: 'Sent Date',
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      accessorKey: 'expiresAt',
      header: 'Expires',
      cell: ({ row }) => formatDate(row.original.expiresAt),
    },
  ];

  return (
    <>
      <EntityTable
        data={invitations || []}
        columns={columns}
        isLoading={isLoading}
        headerActions={
          <Button onClick={() => setIsInviteDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        }
        renderRowActions={(invite) => {
          if (invite.status !== 'pending') return null;

          return (
            <>
              <DropdownMenuItem
                disabled={resendInvite.isPending}
                onClick={() => handleResend(invite.id)}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Resend Invite
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={invite.status !== 'pending' || cancelInvite.isPending}
                className="text-destructive focus:text-destructive"
                onClick={() => handleCancel(invite.id)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Invite
              </DropdownMenuItem>
            </>
          );
        }}
      />
      <InviteMemberDialog isOpen={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen} />
    </>
  );
}
