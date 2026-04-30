import * as React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { CreditCard, Receipt, Building, User, FileText } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form } from '@/components/shared/form/Form';
import { FormField } from '@/components/shared/form/FormField';
import { SearchableSelect } from '@/components/shared/form/SearchableSelect';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatePicker } from '@/components/shared/form/DatePicker';
import { AmountInput } from '@/components/shared/form/AmountInput';

import type { CreatePaymentInput } from '@shared/contracts/payments.contract';
import { createPaymentSchema } from '@shared/contracts/payments.contract';
import { useCustomers } from '@/features/customers/hooks/customers.hooks';
import { useSuppliers } from '@/features/suppliers/hooks/suppliers.hooks';
import { useInvoices } from '@/features/invoices/hooks/invoices.hooks';
import { useBills } from '@/features/bills/hooks/bills.hooks';

interface PaymentFormProps {
  form: UseFormReturn<CreatePaymentInput, unknown>;
  onSubmit: (data: CreatePaymentInput) => Promise<void>;
  formId?: string;
}

export function PaymentForm({ form, onSubmit, formId }: PaymentFormProps) {
  const paymentType = form.watch('paymentType');

  const { data: customers } = useCustomers();
  const { data: suppliers } = useSuppliers();
  const { data: invoices } = useInvoices();
  const { data: bills } = useBills();

  // Reset dependent fields when payment type changes
  React.useEffect(() => {
    form.setValue('customerId', null);
    form.setValue('supplierId', null);
    form.setValue('invoiceId', null);
    form.setValue('billId', null);
  }, [paymentType, form]);

  const customerOptions = (customers || []).map((c) => ({
    label: c.companyName,
    value: c.id,
  }));

  const supplierOptions = (suppliers || []).map((s) => ({
    label: s.companyName,
    value: s.id,
  }));

  const invoiceOptions = (invoices || [])
    .filter((inv) => inv.status !== 'paid')
    .map((inv) => ({
      label: `${inv.documentNumber} (${new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(Number(inv.totalAmount))})`,
      value: inv.id,
    }));

  const billOptions = (bills || [])
    .filter((b) => b.status !== 'paid')
    .map((b) => ({
      label: `${b.documentNumber} (${new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(Number(b.totalAmount))})`,
      value: b.id,
    }));

  return (
    <Form<CreatePaymentInput, typeof createPaymentSchema>
      form={form}
      onSubmit={onSubmit}
      id={formId}
      className="space-y-8"
    >
      {() => (
        <div className="space-y-8">
          <Card className="border-muted-foreground/20">
            <CardHeader className="bg-muted/30 py-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Payment Details</CardTitle>
              </div>
              <CardDescription>Record the core details of the transaction.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <FormField name="paymentType" label="Transaction Type">
                  {({ field }) => (
                    <Tabs onValueChange={field.onChange} value={field.value} className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="inbound">Inbound (Sales)</TabsTrigger>
                        <TabsTrigger value="outbound">Outbound (Purchase)</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  )}
                </FormField>

                <FormField name="paymentMethod" label="Payment Method">
                  {({ field }) => (
                    <Tabs onValueChange={field.onChange} value={field.value} className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="cash">Cash</TabsTrigger>
                        <TabsTrigger value="bank_transfer">Bank</TabsTrigger>
                        <TabsTrigger value="check">Check</TabsTrigger>
                        <TabsTrigger value="credit_card">Card</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  )}
                </FormField>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <FormField name="amount" label="Amount">
                  {({ field }) => <AmountInput {...field} currency="USD" />}
                </FormField>

                <FormField name="paymentDate" label="Payment Date">
                  {({ field }) => <DatePicker value={field.value} onChange={field.onChange} />}
                </FormField>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <FormField name="referenceNumber" label="Reference Number (Optional)">
                  {({ field }) => (
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      placeholder="Check #, Tx ID, etc."
                    />
                  )}
                </FormField>
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted-foreground/20">
            <CardHeader className="bg-muted/30 py-4">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Allocation & References</CardTitle>
              </div>
              <CardDescription>Link this payment to a specific entity or document.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid gap-6 sm:grid-cols-2">
                {paymentType === 'inbound' ? (
                  <>
                    <FormField name="customerId" label="Customer">
                      {({ field }) => (
                        <SearchableSelect
                          options={customerOptions}
                          value={field.value ?? ''}
                          onChange={field.onChange}
                          placeholder="Select a customer..."
                          icon={Building}
                        />
                      )}
                    </FormField>

                    <FormField name="invoiceId" label="Link to Invoice (Optional)">
                      {({ field }) => (
                        <SearchableSelect
                          options={invoiceOptions}
                          value={field.value ?? ''}
                          onChange={field.onChange}
                          placeholder="Select an open invoice..."
                          icon={FileText}
                        />
                      )}
                    </FormField>
                  </>
                ) : (
                  <>
                    <FormField name="supplierId" label="Supplier">
                      {({ field }) => (
                        <SearchableSelect
                          options={supplierOptions}
                          value={field.value ?? ''}
                          onChange={field.onChange}
                          placeholder="Select a supplier..."
                          icon={Building}
                        />
                      )}
                    </FormField>

                    <FormField name="billId" label="Link to Bill (Optional)">
                      {({ field }) => (
                        <SearchableSelect
                          options={billOptions}
                          value={field.value ?? ''}
                          onChange={field.onChange}
                          placeholder="Select an open bill..."
                          icon={FileText}
                        />
                      )}
                    </FormField>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted-foreground/20">
            <CardHeader className="bg-muted/30 py-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Additional Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <FormField name="notes" label="Notes (Optional)">
                {({ field }) => (
                  <Textarea
                    {...field}
                    value={field.value ?? ''}
                    placeholder="Internal notes about this payment..."
                    className="min-h-[100px]"
                  />
                )}
              </FormField>
            </CardContent>
          </Card>
        </div>
      )}
    </Form>
  );
}
