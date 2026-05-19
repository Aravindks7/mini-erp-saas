import * as React from 'react';
import { toast } from 'sonner';
import { RefreshCw, XCircle, UserPlus } from 'lucide-react';
import {
  useInvitationsQuery,
  useInvitationsActions,
  useResendInvite,
  useCancelInvite,
} from '../hooks/invitations.hooks';
import { columns } from './columns';
import { EntityTable } from '@/components/shared/data-table/EntityTable';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/shared/ErrorState';
import { InviteMemberDialog } from './InviteMemberDialog';
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

export function InvitationList() {
  const { data: invitations, isLoading, isError } = useInvitationsQuery();
  const { invalidateInvitations } = useInvitationsActions();
  const resendInvite = useResendInvite();
  const cancelInvite = useCancelInvite();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = React.useState(false);

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

  if (isError) {
    return (
      <ErrorState
        title="Failed to load invitations"
        description="We couldn't retrieve the list of pending invites. Please try again."
        onRetry={invalidateInvitations}
      />
    );
  }

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
