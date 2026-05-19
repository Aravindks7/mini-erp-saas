import { useWatch, type UseFormReturn } from 'react-hook-form';
import { useMemo, useState } from 'react';

import { Form } from '@/components/shared/form/Form';
import { FormField } from '@/components/shared/form/FormField';
import { SearchableSelect } from '@/components/shared/form/SearchableSelect';
import { FormSection } from '@/components/shared/form/FormSection';
import { LineItemsSection } from '@/components/shared/domain/LineItemsSection';
import { useCurrency } from '@/features/currencies/hooks/use-currency';

import {
  createSalesOrderSchema,
  type CreateSalesOrderInput,
} from '@shared/contracts/sales-orders.contract';
import { useCustomersQuery } from '@/features/customers/hooks/customers.hooks';
import { CustomerFormSheet } from '@/features/customers/components/CustomerFormSheet';

interface SalesOrderFormProps {
  form: UseFormReturn<CreateSalesOrderInput, undefined, CreateSalesOrderInput>;
  onSubmit: (data: CreateSalesOrderInput) => Promise<void>;
  formId?: string;
}

export function SalesOrderForm({ form, onSubmit, formId }: SalesOrderFormProps) {
  const [isCustomerSheetOpen, setIsCustomerSheetOpen] = useState(false);
  const { data: customers } = useCustomersQuery();

  const lines = useWatch({
    control: form.control,
    name: 'lines',
  });

  const customerOptions = (customers || []).map((c) => ({
    label: c.companyName,
    value: c.id,
  }));

  const { format: formatCurrency } = useCurrency();

  const orderTotal = useMemo(() => {
    return (lines || []).reduce((acc, line) => {
      const lineTotal =
        Number(line?.quantity || 0) * Number(line?.unitPrice || 0) + Number(line?.taxAmount || 0);
      return acc + lineTotal;
    }, 0);
  }, [lines]);

  return (
    <>
      <Form<CreateSalesOrderInput, typeof createSalesOrderSchema>
        form={form}
        schema={createSalesOrderSchema}
        onSubmit={onSubmit}
        id={formId}
      >
        {() => (
          <div className="space-y-8 pb-20">
            <FormSection
              title="Customer Information"
              description="Select the customer placing this order."
            >
              <FormField name="customerId" label="Customer">
                {({ field }) => (
                  <SearchableSelect
                    {...field}
                    options={customerOptions}
                    placeholder="Select a Customer"
                    action={{
                      label: 'Add New Customer',
                      onClick: () => setIsCustomerSheetOpen(true),
                    }}
                  />
                )}
              </FormField>
            </FormSection>

            <LineItemsSection control={form.control} name="lines" />

            <div className="flex justify-end pt-6 border-t">
              <div className="text-right space-y-1">
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                  Order Total
                </p>
                <p className="text-3xl font-bold tracking-tight text-primary">
                  {formatCurrency(orderTotal)}
                </p>
              </div>
            </div>
          </div>
        )}
      </Form>

      <CustomerFormSheet
        isOpen={isCustomerSheetOpen}
        onClose={() => setIsCustomerSheetOpen(false)}
        onSuccess={(customerId) => {
          form.setValue('customerId', customerId);
        }}
      />
    </>
  );
}
