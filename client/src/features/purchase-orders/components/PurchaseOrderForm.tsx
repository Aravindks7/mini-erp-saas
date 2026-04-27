import { useWatch, type UseFormReturn } from 'react-hook-form';
import { useMemo } from 'react';

import { Form } from '@/components/shared/form/Form';
import { FormField } from '@/components/shared/form/FormField';
import { SearchableSelect } from '@/components/shared/form/SearchableSelect';
import { FormSection } from '@/components/shared/form/FormSection';
import { LineItemsSection } from '@/components/shared/domain/LineItemsSection';

import {
  createPurchaseOrderSchema,
  type CreatePurchaseOrderInput,
} from '@shared/contracts/purchase-orders.contract';
import { useSuppliers } from '@/features/suppliers/hooks/suppliers.hooks';

interface PurchaseOrderFormProps {
  form: UseFormReturn<CreatePurchaseOrderInput, undefined, CreatePurchaseOrderInput>;
  onSubmit: (data: CreatePurchaseOrderInput) => Promise<void>;
  formId?: string;
}

export function PurchaseOrderForm({ form, onSubmit, formId }: PurchaseOrderFormProps) {
  const { data: suppliers } = useSuppliers();

  const lines = useWatch({
    control: form.control,
    name: 'lines',
  });

  const supplierOptions = (suppliers || []).map((s) => ({
    label: s.name,
    value: s.id,
  }));

  const orderTotal = useMemo(() => {
    return (lines || []).reduce((acc, line) => {
      const lineTotal =
        Number(line?.quantity || 0) * Number(line?.unitPrice || 0) + Number(line?.taxAmount || 0);
      return acc + lineTotal;
    }, 0);
  }, [lines]);

  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  return (
    <Form<CreatePurchaseOrderInput, typeof createPurchaseOrderSchema>
      form={form}
      schema={createPurchaseOrderSchema}
      onSubmit={onSubmit}
      id={formId}
    >
      {() => (
        <div className="space-y-8 pb-20">
          <FormSection
            title="Supplier Information"
            description="Select the supplier for this procurement."
          >
            <FormField name="supplierId" label="Supplier">
              {({ field }) => (
                <SearchableSelect
                  {...field}
                  options={supplierOptions}
                  placeholder="Select a Supplier"
                />
              )}
            </FormField>
          </FormSection>

          <LineItemsSection control={form.control} name="lines" />

          <div className="flex justify-end pt-6 border-t">
            <div className="text-right space-y-1">
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                Estimated Total
              </p>
              <p className="text-3xl font-bold tracking-tight text-primary">
                {currencyFormatter.format(orderTotal)}
              </p>
            </div>
          </div>
        </div>
      )}
    </Form>
  );
}
