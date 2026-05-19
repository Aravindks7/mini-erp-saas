import { useEffect } from 'react';
import { z } from 'zod';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ACTION_REASONS, type ActivityAction } from '@shared/config/activity-actions.config';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/shared/form/Form';
import { FormField } from '@/components/shared/form/FormField';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const reasonSchema = z.object({
  reasonId: z.string().min(1, 'Please select a reason'),
  customReason: z.string().optional(),
});

type ReasonFormValues = z.infer<typeof reasonSchema>;

interface ActionReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (action: ActivityAction, reasonText: string) => void;
  action: ActivityAction;
  title?: string;
  description?: string;
  isLoading?: boolean;
}

export function ActionReasonModal({
  isOpen,
  onClose,
  onConfirm,
  action,
  title,
  description,
  isLoading,
}: ActionReasonModalProps) {
  const reasons = ACTION_REASONS[action] || [];

  const form = useForm<ReasonFormValues>({
    resolver: zodResolver(reasonSchema),
    defaultValues: {
      reasonId: '',
      customReason: '',
    },
  });

  const reasonId = useWatch({
    control: form.control,
    name: 'reasonId',
  });
  const showCustom = reasonId === 'other';

  // Reset form when modal opens with new action
  useEffect(() => {
    if (isOpen) {
      const reasons = ACTION_REASONS[action] || [];
      const defaultReason = reasons.length > 0 ? reasons[0].value : '';
      form.reset({ reasonId: defaultReason, customReason: '' });
    }
  }, [isOpen, action, form]);

  const onSubmit = (data: ReasonFormValues) => {
    const selectedReason = reasons.find((r) => r.value === data.reasonId);
    let finalReasonText = selectedReason?.label || data.reasonId;

    if (data.reasonId === 'other' && data.customReason) {
      finalReasonText = data.customReason;
    }

    onConfirm(action, finalReasonText);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{title || 'Provide a Reason'}</DialogTitle>
          <DialogDescription>
            {description || 'Please select a reason for this action to proceed.'}
          </DialogDescription>
        </DialogHeader>

        <Form<ReasonFormValues, typeof reasonSchema>
          form={form}
          schema={reasonSchema}
          onSubmit={onSubmit}
        >
          {() => (
            <div className="space-y-4">
              <FormField name="reasonId" label="Reason">
                {({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <SelectTrigger id={field.id} className="w-full">
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {reasons.map((reason) => (
                        <SelectItem key={reason.value} value={reason.value}>
                          {reason.label}
                        </SelectItem>
                      ))}
                      {reasons.length === 0 && (
                        <SelectItem value="manual_update">Manual Update</SelectItem>
                      )}
                      <SelectItem value="other">Other (Please specify)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </FormField>

              {showCustom && (
                <div className="animate-in fade-in slide-in-from-top-1">
                  <FormField name="customReason" label="Custom Reason">
                    {({ field }) => <Textarea placeholder="Enter your reason here..." {...field} />}
                  </FormField>
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Processing...' : 'Confirm'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </Form>
      </DialogContent>
    </Dialog>
  );
}
