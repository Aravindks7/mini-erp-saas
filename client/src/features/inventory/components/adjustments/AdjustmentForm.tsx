import type { UseFormReturn } from 'react-hook-form';
import { useFieldArray, useWatch } from 'react-hook-form';
import { ClipboardList, Plus, Trash2, Box } from 'lucide-react';
import * as React from 'react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form } from '@/components/shared/form/Form';
import { FormField } from '@/components/shared/form/FormField';
import { SearchableSelect } from '@/components/shared/form/SearchableSelect';
import { Separator } from '@/components/ui/separator';

import type { CreateAdjustmentInput } from '@mini-erp/shared';
import { createAdjustmentSchema } from '@mini-erp/shared';
import { useProducts } from '@/features/products/hooks/products.hooks';
import { useWarehouses } from '@/features/warehouses/hooks/warehouses.hooks';

interface AdjustmentFormProps {
  form: UseFormReturn<CreateAdjustmentInput, unknown>;
  onSubmit: (data: CreateAdjustmentInput) => Promise<void>;
  formId?: string;
}

export function AdjustmentForm({ form, onSubmit, formId }: AdjustmentFormProps) {
  const { data: products = [] } = useProducts();
  const { data: warehouses = [] } = useWarehouses();

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
    const firstWh = warehouses[0];
    append({
      productId: '',
      warehouseId: firstWh?.id || '',
      binId: firstWh?.bins?.[0]?.id || '',
      quantityChange: '1',
    });
  };

  return (
    <Form<CreateAdjustmentInput, typeof createAdjustmentSchema>
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
                <ClipboardList className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Adjustment Details</CardTitle>
              </div>
              <CardDescription>
                Provide the reason and optional reference for this stock correction.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <FormField name="reason" label="Reason">
                  {({ field }) => (
                    <Input {...field} placeholder="e.g. Annual Cycle Count, Damage, etc." />
                  )}
                </FormField>

                <FormField name="reference" label="Reference (Optional)">
                  {({ field }) => (
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      placeholder="Internal Ticket #, etc."
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
                  <CardTitle className="text-lg">Adjustment Lines</CardTitle>
                </div>
                <CardDescription>Add the products and quantities to be adjusted.</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleAddLine}>
                <Plus className="mr-2 h-4 w-4" />
                Add Line
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-0">
                {fields.map((field, index) => (
                  <AdjustmentLine
                    key={field.id}
                    index={index}
                    form={form}
                    productOptions={productOptions}
                    warehouseOptions={warehouseOptions}
                    warehouses={warehouses}
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

interface LocalWarehouse {
  id: string;
  name: string;
  bins: { id?: string; name?: string | null }[];
}

interface AdjustmentLineProps {
  index: number;
  form: UseFormReturn<CreateAdjustmentInput, unknown>;
  productOptions: { label: string; value: string }[];
  warehouseOptions: { label: string; value: string }[];
  warehouses: LocalWarehouse[];
  onRemove: () => void;
  isOnlyLine: boolean;
}

function AdjustmentLine({
  index,
  form,
  productOptions,
  warehouseOptions,
  warehouses,
  onRemove,
  isOnlyLine,
}: AdjustmentLineProps) {
  const warehouseId = useWatch({
    control: form.control,
    name: `lines.${index}.warehouseId`,
  });

  const binOptions = React.useMemo(() => {
    const selectedWh = warehouses.find((w) => w.id === warehouseId);
    return (selectedWh?.bins || []).map((b) => ({
      label: b.name || 'Unnamed Bin',
      value: b.id || '',
    }));
  }, [warehouseId, warehouses]);

  // Update binId when warehouse changes if current bin is invalid
  React.useEffect(() => {
    const currentBinId = form.getValues(`lines.${index}.binId`);
    const isValidBin = binOptions.some((b) => b.value === currentBinId);

    if (!isValidBin && binOptions.length > 0) {
      form.setValue(`lines.${index}.binId`, binOptions[0].value);
    } else if (binOptions.length === 0) {
      form.setValue(`lines.${index}.binId`, '');
    }
  }, [warehouseId, binOptions, form, index]);

  return (
    <div className="group relative">
      <div className="grid gap-4 p-6 sm:grid-cols-12 sm:items-end">
        <div className="sm:col-span-4">
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
          <FormField
            name={`lines.${index}.warehouseId`}
            label={index === 0 ? 'Warehouse' : undefined}
          >
            {({ field }) => (
              <SearchableSelect
                options={warehouseOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder="Select Warehouse..."
              />
            )}
          </FormField>
        </div>

        <div className="sm:col-span-2">
          <FormField name={`lines.${index}.binId`} label={index === 0 ? 'Bin' : undefined}>
            {({ field }) => (
              <SearchableSelect
                options={binOptions}
                value={field.value ?? ''}
                onChange={field.onChange}
                placeholder="Select Bin..."
                disabled={binOptions.length === 0}
              />
            )}
          </FormField>
        </div>

        <div className="sm:col-span-2">
          <FormField
            name={`lines.${index}.quantityChange`}
            label={index === 0 ? 'Qty Change' : undefined}
          >
            {({ field }) => <Input {...field} type="number" step="0.00000001" />}
          </FormField>
        </div>

        <div className="flex justify-end sm:col-span-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={onRemove}
            disabled={isOnlyLine}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {index < form.getValues('lines').length - 1 && <Separator />}
    </div>
  );
}
