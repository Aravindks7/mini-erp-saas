import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreditCard, Banknote, Link as LinkIcon, Loader2, CheckCircle2 } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form } from '@/components/shared/form/Form';
import { FormField } from '@/components/shared/form/FormField';
import { AmountInput } from '@/components/shared/form/AmountInput';
import { DatePicker } from '@/components/shared/form/DatePicker';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { createPaymentSchema, type CreatePaymentInput } from '@shared/contracts/payments.contract';
import { useCreatePayment, useCreateStripeSession } from '@/features/payments/hooks/payments.hooks';
import type { InvoiceResponse } from '../api/invoices.api';

interface AddPaymentSheetProps {
  invoice: InvoiceResponse;
  isOpen: boolean;
  onClose: () => void;
}

export function AddPaymentSheet({ invoice, isOpen, onClose }: AddPaymentSheetProps) {
  const createPaymentMutation = useCreatePayment();
  const createStripeMutation = useCreateStripeSession();

  const balanceDue = Number(invoice.balanceDue ?? invoice.totalAmount);

  const form = useForm<CreatePaymentInput>({
    resolver: zodResolver(createPaymentSchema),
    defaultValues: {
      paymentType: 'inbound',
      paymentMethod: 'bank_transfer',
      amount: balanceDue.toString(),
      paymentDate: new Date(),
      invoiceId: invoice.id,
      customerId: invoice.customerId,
      status: 'completed',
    },
  });

  const watchedAmount = form.watch('amount');

  const onManualSubmit = async (data: CreatePaymentInput) => {
    try {
      await createPaymentMutation.mutateAsync(data);
      toast.success('Payment recorded successfully');
      onClose();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to record payment';
      toast.error(message);
    }
  };

  const handleRequestStripe = async () => {
    try {
      const amount = form.getValues('amount');
      const result = await createStripeMutation.mutateAsync({
        invoiceId: invoice.id,
        amount,
        successUrl: window.location.href + '?payment=success',
        cancelUrl: window.location.href + '?payment=cancelled',
      });

      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to generate Stripe session';
      toast.error(message);
    }
  };

  return (
    <ResponsiveDrawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ResponsiveDrawerContent className="sm:max-w-[500px]">
        <ResponsiveDrawerHeader>
          <ResponsiveDrawerTitle>Add Payment</ResponsiveDrawerTitle>
          <ResponsiveDrawerDescription>
            Record a manual payment or request an online payment for Invoice{' '}
            <span className="font-mono font-bold text-primary">{invoice.documentNumber}</span>
          </ResponsiveDrawerDescription>
        </ResponsiveDrawerHeader>

        <div className="px-4 space-y-6 flex-1 overflow-y-auto">
          <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                Balance Due
              </p>
              <p className="text-2xl font-bold text-primary">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                  balanceDue,
                )}
              </p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-primary/20" />
          </div>

          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="manual" className="gap-2">
                <Banknote className="h-4 w-4" />
                Record Manual
              </TabsTrigger>
              <TabsTrigger value="stripe" className="gap-2">
                <CreditCard className="h-4 w-4" />
                Request Online
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-6">
              <Form form={form} onSubmit={onManualSubmit} className="space-y-6">
                {() => (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField name="amount" label="Payment Amount">
                        {({ field }) => <AmountInput {...field} currency="USD" />}
                      </FormField>
                      <FormField name="paymentDate" label="Date Received">
                        {({ field }) => (
                          <DatePicker value={field.value} onChange={field.onChange} />
                        )}
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
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          placeholder="e.g. Check #1234"
                        />
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
            </TabsContent>

            <TabsContent value="stripe" className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg border-dashed text-center space-y-2">
                  <LinkIcon className="h-8 w-8 mx-auto text-muted-foreground/50" />
                  <p className="text-sm font-medium">Stripe Checkout</p>
                  <p className="text-xs text-muted-foreground">
                    Generate a secure checkout link powered by Stripe. Your customer can pay via
                    Credit Card, Apple Pay, or Google Pay.
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-medium">Request Amount</label>
                  <AmountInput
                    value={watchedAmount}
                    onChange={(val) => form.setValue('amount', val)}
                    currency="USD"
                  />
                </div>

                <ResponsiveDrawerFooter className="px-0 pt-4 flex-col gap-3">
                  <Button
                    className="w-full h-11 text-lg font-semibold shadow-lg shadow-primary/20"
                    onClick={handleRequestStripe}
                    disabled={createStripeMutation.isPending || Number(watchedAmount) <= 0}
                  >
                    {createStripeMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Generating Link...
                      </>
                    ) : (
                      'Generate Payment Link'
                    )}
                  </Button>
                  <Button variant="ghost" className="w-full" onClick={onClose}>
                    Cancel
                  </Button>
                </ResponsiveDrawerFooter>

                <p className="text-[10px] text-center text-muted-foreground px-6">
                  A Payment Intent will be created to track this request. Once the customer
                  completes the payment, it will be automatically recorded and reconciled.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ResponsiveDrawerContent>
    </ResponsiveDrawer>
  );
}
