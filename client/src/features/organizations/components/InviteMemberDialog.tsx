import { toast } from 'sonner';
import { Loader2, Shield } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { useInviteMember } from '../hooks/organizations.hooks';
import { useRoles } from '@/features/auth/hooks/rbac.hooks';
import {
  inviteMemberSchema,
  type InviteMemberInput,
} from '@shared/contracts/organizations.contract';
import { Form } from '@/components/shared/form/Form';
import { FormField } from '@/components/shared/form/FormField';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

interface InviteMemberDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteMemberDialog({ isOpen, onOpenChange }: InviteMemberDialogProps) {
  const { activeOrganizationId } = useTenant();
  const inviteMember = useInviteMember(activeOrganizationId || '');
  const { data: roles, isLoading: isLoadingRoles } = useRoles();

  const handleSubmit = async (data: InviteMemberInput) => {
    try {
      await inviteMember.mutateAsync(data);
      toast.success('Invitation sent successfully');
      onOpenChange(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send invitation';
      toast.error(errorMessage);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Member</DialogTitle>
          <DialogDescription>
            Invite a new member to your organization. They will receive an email to join.
          </DialogDescription>
        </DialogHeader>

        {isLoadingRoles ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <div className="flex justify-end gap-3">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        ) : (
          <Form<InviteMemberInput, typeof inviteMemberSchema>
            schema={inviteMemberSchema}
            onSubmit={handleSubmit}
            defaultValues={{
              userEmail: '',
              roleId: roles?.find((r) => r.name === 'Employee')?.id || roles?.[0]?.id || '',
            }}
          >
            {() => (
              <div className="space-y-4">
                <FormField name="userEmail" label="Email Address">
                  {({ field }) => <Input {...field} type="email" placeholder="email@example.com" />}
                </FormField>

                <FormField name="roleId" label="Role">
                  {({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles?.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-muted-foreground" />
                              {role.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </FormField>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={inviteMember.isPending} className="min-w-[140px]">
                    {inviteMember.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Invitation'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
