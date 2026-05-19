import type { UseFormReturn } from 'react-hook-form';
import { useFieldArray } from 'react-hook-form';
import { Plus, Trash2, Box, ArrowRightLeft } from 'lucide-react';
import * as React from 'react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form } from '@/components/shared/form/Form';
import { FormField } from '@/components/shared/form/FormField';
import { SearchableSelect } from '@/components/shared/form/SearchableSelect';
import { Separator } from '@/components/ui/separator';

import type { CreateInventoryTransferInput } from '@shared/contracts/inventory-transfers.contract';
import { createInventoryTransferSchema } from '@shared/contracts/inventory-transfers.contract';
import { useProductsQuery } from '@/features/products/hooks/products.hooks';
import { useWarehousesQuery } from '@/features/warehouses/hooks/warehouses.hooks';

interface TransferFormProps {
  form: UseFormReturn<CreateInventoryTransferInput>;
  onSubmit: (data: CreateInventoryTransferInput) => Promise<void>;
  formId?: string;
}

export function TransferForm({ form, onSubmit, formId }: TransferFormProps) {
  const { data: products = [] } = useProductsQuery();
  const { data: warehouses = [] } = useWarehousesQuery();

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lines',
  });

  const productOptions = React.useMemo(
    () =>
      products.map((p) => ({
        label: `${p.name} (${p.sku})`,
        value: p.id,
      })),
    [products],
  );

  const warehouseOptions = React.useMemo(
    () =>
      warehouses.map((w) => ({
        label: w.name,
        value: w.id,
      })),
    [warehouses],
  );

  const handleAddLine = () => {
    append({
      productId: '',
      quantity: 1, // Using number as expected by schema
    });
  };

  return (
    <Form<CreateInventoryTransferInput, typeof createInventoryTransferSchema>
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
                <ArrowRightLeft className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Transfer Details</CardTitle>
              </div>
              <CardDescription>
                Select source and destination warehouses for this stock transfer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid gap-6 sm:grid-cols-3">
                <FormField name="fromWarehouseId" label="From Warehouse">
                  {({ field }) => (
                    <SearchableSelect
                      options={warehouseOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select Source..."
                    />
                  )}
                </FormField>

                <FormField name="toWarehouseId" label="To Warehouse">
                  {({ field }) => (
                    <SearchableSelect
                      options={warehouseOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select Destination..."
                    />
                  )}
                </FormField>

                <FormField name="reference" label="Reference (Optional)">
                  {({ field }) => (
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      placeholder="Transfer #, Internal Note, etc."
                    />
                  )}
                </FormField>
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted-foreground/20">
            <CardHeader className="flex flex-row items-center justify-between bg-muted/30 py-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Box className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Transfer Lines</CardTitle>
                </div>
                <CardDescription>
                  Add the products and quantities to be transferred.
                </CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleAddLine}>
                <Plus className="mr-2 h-4 w-4" />
                Add Line
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-0">
                {fields.map((field, index) => (
                  <TransferLine
                    key={field.id}
                    index={index}
                    productOptions={productOptions}
                    onRemove={() => remove(index)}
                    isOnlyLine={fields.length === 1}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Form>
  );
}

interface TransferLineProps {
  index: number;
  productOptions: { label: string; value: string }[];
  onRemove: () => void;
  isOnlyLine: boolean;
}

function TransferLine({ index, productOptions, onRemove, isOnlyLine }: TransferLineProps) {
  return (
    <div className="group relative">
      <div className="grid gap-4 p-6 sm:grid-cols-12 sm:items-end">
        <div className="sm:col-span-8">
          <FormField name={`lines.${index}.productId`} label={index === 0 ? 'Product' : undefined}>
            {({ field }) => (
              <SearchableSelect
                options={productOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder="Select Product..."
              />
            )}
          </FormField>
        </div>

        <div className="sm:col-span-3">
          <FormField name={`lines.${index}.quantity`} label={index === 0 ? 'Quantity' : undefined}>
            {({ field }) => (
              <Input
                type="number"
                {...field}
                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                min={0.01}
                step="any"
                placeholder="0.00"
              />
            )}
          </FormField>
        </div>

        <div className="flex justify-end sm:col-span-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            disabled={isOnlyLine}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <Separator />
    </div>
  );
}
