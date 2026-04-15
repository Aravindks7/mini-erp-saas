import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { useInviteMember } from '../hooks/organizations.hooks';
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

interface InviteMemberDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteMemberDialog({ isOpen, onOpenChange }: InviteMemberDialogProps) {
  const { activeOrganizationId } = useTenant();
  const inviteMember = useInviteMember(activeOrganizationId || '');

  const handleSubmit = async (data: InviteMemberInput) => {
    try {
      await inviteMember.mutateAsync(data);
      toast.success('Invitation sent successfully');
      onOpenChange(false);
    } catch {
      toast.error('Failed to send invitation');
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
        <Form<InviteMemberInput, typeof inviteMemberSchema>
          schema={inviteMemberSchema}
          onSubmit={handleSubmit}
          defaultValues={{ userEmail: '', role: 'employee' }}
        >
          {() => (
            <div className="space-y-4">
              <FormField name="userEmail" label="Email Address">
                {({ field }) => <Input {...field} type="email" placeholder="email@example.com" />}
              </FormField>
              <FormField name="role" label="Role">
                {({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
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
      </DialogContent>
    </Dialog>
  );
}
