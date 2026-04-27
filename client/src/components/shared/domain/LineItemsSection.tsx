import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import type { FieldValues, ArrayPath, Control, Path, PathValue } from 'react-hook-form';
import { useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/shared/form/FormField';
import { SearchableSelect } from '@/components/shared/form/SearchableSelect';
import { FormSection } from '@/components/shared/form/FormSection';

import { useProducts } from '@/features/products/hooks/products.hooks';
import { useTaxes } from '@/features/taxes/hooks/taxes.hooks';

interface LineItemsSectionProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: ArrayPath<TFieldValues>;
  title?: string;
  description?: string;
}

/**
 * Standard ERP Line Items component.
 * Encapsulates the product selection, quantity/price inputs, and tax auto-calculations.
 * Axiom: Reusable across POs, SOs, and Invoices to ensure consistent financial precision.
 */
export function LineItemsSection<TFieldValues extends FieldValues>({
  name,
  title = 'Line Items',
  description = 'Add products and specify quantities.',
}: LineItemsSectionProps<TFieldValues>) {
  const { control, setValue } = useFormContext<TFieldValues>();
  const { fields, append, remove } = useFieldArray({ control, name });

  const { data: products } = useProducts();
  const { data: taxes } = useTaxes();

  const lines = useWatch({
    control,
    name: name as unknown as Path<TFieldValues>,
  });

  const productOptions = (products || []).map((p) => ({
    label: `${p.name} (${p.sku})`,
    value: p.id,
  }));

  // Auto-calculate line totals and tax when product/quantity/price changes
  useEffect(() => {
    if (!Array.isArray(lines)) return;

    lines.forEach((line: Record<string, unknown>, index: number) => {
      const productId = line.productId as string;
      const product = products?.find((p) => p.id === productId);
      if (product) {
        const tax = taxes?.find((t) => t.id === product.taxId);
        const rate = tax ? Number(tax.rate) / 100 : 0;
        const subtotal = Number(line.quantity || 0) * Number(line.unitPrice || 0);
        const taxAmount = (subtotal * rate).toFixed(2);

        // Only update if changed to avoid infinite loops
        const currentTaxRate = (rate * 100).toString();
        if (line.taxRateAtOrder !== currentTaxRate || line.taxAmount !== taxAmount) {
          setValue(
            `${name}.${index}.taxRateAtOrder` as Path<TFieldValues>,
            currentTaxRate as PathValue<TFieldValues, Path<TFieldValues>>,
          );
          setValue(
            `${name}.${index}.taxAmount` as Path<TFieldValues>,
            taxAmount as PathValue<TFieldValues, Path<TFieldValues>>,
          );
        }
      }
    });
  }, [lines, products, taxes, setValue, name]);

  return (
    <FormSection title={title} description={description} columns={1}>
      <div className="space-y-4">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="grid grid-cols-12 gap-4 items-end border p-4 rounded-lg bg-muted/20 relative group"
          >
            <div className="col-span-4">
              <FormField name={`${name}.${index}.productId`} label="Product">
                {({ field: pField }) => (
                  <SearchableSelect
                    {...pField}
                    options={productOptions}
                    placeholder="Select Product"
                    onChange={(val) => {
                      pField.onChange(val);
                      const product = products?.find((p) => p.id === val);
                      if (product) {
                        setValue(
                          `${name}.${index}.unitPrice` as Path<TFieldValues>,
                          product.basePrice as PathValue<TFieldValues, Path<TFieldValues>>,
                        );
                      }
                    }}
                  />
                )}
              </FormField>
            </div>
            <div className="col-span-2">
              <FormField name={`${name}.${index}.quantity`} label="Quantity">
                {({ field: qField }) => <Input {...qField} type="text" />}
              </FormField>
            </div>
            <div className="col-span-2">
              <FormField name={`${name}.${index}.unitPrice`} label="Unit Price">
                {({ field: priceField }) => <Input {...priceField} type="text" />}
              </FormField>
            </div>
            <div className="col-span-2">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">
                  Tax ({String((lines as Record<string, unknown>[])?.[index]?.taxRateAtOrder || 0)}
                  %)
                </label>
                <Input
                  value={String((lines as Record<string, unknown>[])?.[index]?.taxAmount || '0')}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
            <div className="col-span-2 flex justify-end pb-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full border-dashed"
          onClick={() =>
            append({
              productId: '',
              quantity: '1',
              unitPrice: '0',
              taxRateAtOrder: '0',
              taxAmount: '0',
            } as PathValue<TFieldValues, ArrayPath<TFieldValues>>[number])
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Line Item
        </Button>
      </div>
    </FormSection>
  );
}
