import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreditCard, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  ResponsiveDrawer,
  ResponsiveDrawerContent,
  ResponsiveDrawerDescription,
  ResponsiveDrawerHeader,
  ResponsiveDrawerTitle,
  ResponsiveDrawerFooter,
} from '@/components/shared/ResponsiveDrawer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form } from '@/components/shared/form/Form';
import { FormField } from '@/components/shared/form/FormField';
import { AmountInput } from '@/components/shared/form/AmountInput';
import { DatePicker } from '@/components/shared/form/DatePicker';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { createPaymentSchema, type CreatePaymentInput } from '@shared/contracts/payments.contract';
import { useCreatePayment } from '@/features/payments/hooks/payments.hooks';
import type { BillResponse } from '../api/bills.api';

interface PayBillSheetProps {
  bill: BillResponse;
  isOpen: boolean;
  onClose: () => void;
}

export function PayBillSheet({ bill, isOpen, onClose }: PayBillSheetProps) {
  const createPaymentMutation = useCreatePayment();

  const amountToPay = Number(bill.totalAmount);

  const form = useForm<CreatePaymentInput>({
    resolver: zodResolver(createPaymentSchema),
    defaultValues: {
      paymentType: 'outbound',
      paymentMethod: 'bank_transfer',
      amount: amountToPay.toString(),
      paymentDate: new Date(),
      billId: bill.id,
      supplierId: bill.supplierId,
      status: 'completed',
    },
  });

  const onSubmit = async (data: CreatePaymentInput) => {
    try {
      await createPaymentMutation.mutateAsync(data);
      toast.success('Payment recorded successfully');
      onClose();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to record payment';
      toast.error(message);
    }
  };

  return (
    <ResponsiveDrawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ResponsiveDrawerContent className="sm:max-w-[500px]">
        <ResponsiveDrawerHeader>
          <ResponsiveDrawerTitle>Pay Bill</ResponsiveDrawerTitle>
          <ResponsiveDrawerDescription>
            Record a payment for Bill{' '}
            <span className="font-mono font-bold text-primary">{bill.referenceNumber}</span>
          </ResponsiveDrawerDescription>
        </ResponsiveDrawerHeader>

        <div className="px-4 space-y-6 flex-1 overflow-y-auto pb-4">
          <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                Total Amount
              </p>
              <p className="text-2xl font-bold text-primary">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                  amountToPay,
                )}
              </p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-primary/20" />
          </div>

          <Form form={form} onSubmit={onSubmit} className="space-y-6">
            {() => (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormField name="amount" label="Payment Amount">
                    {({ field }) => <AmountInput {...field} currency="USD" />}
                  </FormField>
                  <FormField name="paymentDate" label="Payment Date">
                    {({ field }) => <DatePicker value={field.value} onChange={field.onChange} />}
                  </FormField>
                </div>

                <FormField name="paymentMethod" label="Payment Method">
                  {({ field }) => (
                    <Tabs onValueChange={field.onChange} value={field.value} className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="cash">Cash</TabsTrigger>
                        <TabsTrigger value="bank_transfer">Bank</TabsTrigger>
                        <TabsTrigger value="check">Check</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  )}
                </FormField>

                <FormField name="referenceNumber" label="Reference Number (Optional)">
                  {({ field }) => (
                    <Input {...field} value={field.value ?? ''} placeholder="e.g. Check #1234" />
                  )}
                </FormField>

                <FormField name="notes" label="Internal Notes">
                  {({ field }) => (
                    <Textarea
                      {...field}
                      value={field.value ?? ''}
                      placeholder="Any additional details..."
                    />
                  )}
                </FormField>

                <ResponsiveDrawerFooter className="px-0 pt-4">
                  <Button type="button" variant="ghost" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={createPaymentMutation.isPending}>
                    Record Payment
                  </Button>
                </ResponsiveDrawerFooter>
              </>
            )}
          </Form>
        </div>
      </ResponsiveDrawerContent>
    </ResponsiveDrawer>
  );
}
