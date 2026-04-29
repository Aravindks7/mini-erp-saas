import { useWatch, type UseFormReturn } from 'react-hook-form';
import { useMemo } from 'react';

import { Form } from '@/components/shared/form/Form';
import { FormField } from '@/components/shared/form/FormField';
import { SearchableSelect } from '@/components/shared/form/SearchableSelect';
import { FormSection } from '@/components/shared/form/FormSection';
import { DatePicker } from '@/components/shared/form/DatePicker';
import { LineItemsSection } from '@/components/shared/domain/LineItemsSection';
import { Textarea } from '@/components/ui/textarea';

import { createInvoiceSchema, type CreateInvoiceInput } from '@shared/contracts/invoices.contract';
import { useCustomers } from '@/features/customers/hooks/customers.hooks';

interface InvoiceFormProps {
  form: UseFormReturn<CreateInvoiceInput, undefined, CreateInvoiceInput>;
  onSubmit: (data: CreateInvoiceInput) => Promise<void>;
  formId?: string;
}

export function InvoiceForm({ form, onSubmit, formId }: InvoiceFormProps) {
  const { data: customers } = useCustomers();

  const lines = useWatch({
    control: form.control,
    name: 'lines',
  });

  const customerOptions = (customers || []).map((c) => ({
    label: c.companyName,
    value: c.id,
  }));

  const totals = useMemo(() => {
    return (lines || []).reduce(
      (acc, line) => {
        const subtotal = Number(line?.quantity || 0) * Number(line?.unitPrice || 0);
        const tax = Number(line?.taxAmount || 0);
        return {
          totalAmount: acc.totalAmount + subtotal + tax,
          taxAmount: acc.taxAmount + tax,
        };
      },
      { totalAmount: 0, taxAmount: 0 },
    );
  }, [lines]);

  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  return (
    <Form<CreateInvoiceInput, typeof createInvoiceSchema>
      form={form}
      schema={createInvoiceSchema}
      onSubmit={onSubmit}
      id={formId}
    >
      {() => (
        <div className="space-y-8 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormSection title="Customer Information" description="Select the customer to invoice.">
              <FormField name="customerId" label="Customer">
                {({ field }) => (
                  <SearchableSelect
                    {...field}
                    options={customerOptions}
                    placeholder="Select a Customer"
                  />
                )}
              </FormField>
            </FormSection>

            <FormSection title="Invoice Dates" description="Set the issuance and payment deadline.">
              <div className="grid grid-cols-2 gap-4">
                <FormField name="issueDate" label="Issue Date">
                  {({ field }) => <DatePicker date={field.value} onChange={field.onChange} />}
                </FormField>
                <FormField name="dueDate" label="Due Date">
                  {({ field }) => <DatePicker date={field.value} onChange={field.onChange} />}
                </FormField>
              </div>
            </FormSection>
          </div>

          <LineItemsSection control={form.control} name="lines" />

          <FormSection
            title="Additional Information"
            description="Optional notes for this invoice."
          >
            <FormField name="notes" label="Notes">
              {({ field }) => (
                <Textarea
                  {...field}
                  value={field.value || ''}
                  placeholder="Enter any additional details..."
                  className="min-h-[100px]"
                />
              )}
            </FormField>
          </FormSection>

          <div className="flex justify-end pt-6 border-t">
            <div className="text-right space-y-4 min-w-[200px]">
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Tax Amount</span>
                <span>{currencyFormatter.format(totals.taxAmount)}</span>
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                  Invoice Total
                </p>
                <p className="text-3xl font-bold tracking-tight text-primary">
                  {currencyFormatter.format(totals.totalAmount)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Form>
  );
}
