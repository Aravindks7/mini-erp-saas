import * as React from 'react';
import type { UseFormReturn, FieldArrayWithId } from 'react-hook-form';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  ResponsiveDrawer,
  ResponsiveDrawerContent,
  ResponsiveDrawerDescription,
  ResponsiveDrawerHeader,
  ResponsiveDrawerTitle,
  ResponsiveDrawerFooter,
} from '@/components/shared/ResponsiveDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form } from '@/components/shared/form/Form';
import { FormField } from '@/components/shared/form/FormField';
import { SearchableSelect } from '@/components/shared/form/SearchableSelect';

import { createReceiptSchema, type CreateReceiptInput } from '@shared/contracts/receipts.contract';
import type { PurchaseOrderResponse } from '../api/purchase-orders.api';
import { useCreateReceipt } from '@/features/receipts/hooks/receipts.hooks';
import { useWarehousesQuery } from '@/features/warehouses/hooks/warehouses.hooks';
import type { WarehouseResponse } from '@/features/warehouses/api/warehouses.api';

interface ReceivePurchaseOrderSheetProps {
  isOpen: boolean;
  onClose: () => void;
  po?: PurchaseOrderResponse;
}

function BinSelector({
  index,
  form,
  warehouseId,
  warehouses,
}: {
  index: number;
  form: UseFormReturn<CreateReceiptInput, unknown>;
  warehouseId: string;
  warehouses: WarehouseResponse[];
}) {
  const binOptions = React.useMemo(() => {
    const selectedWh = warehouses.find((w) => w.id === warehouseId);
    return (selectedWh?.bins || []).map((b) => ({
      label: b.name || 'Unnamed Bin',
      value: b.id || '',
    }));
  }, [warehouseId, warehouses]);

  React.useEffect(() => {
    const currentBinId = form.getValues(`lines.${index}.binId`);
    const isValidBin = binOptions.some((b) => b.value === currentBinId);

    if (!isValidBin && binOptions.length > 0) {
      form.setValue(`lines.${index}.binId`, binOptions[0].value);
    } else if (binOptions.length === 0) {
      form.setValue(`lines.${index}.binId`, null);
    }
  }, [warehouseId, binOptions, form, index]);

  return (
    <FormField name={`lines.${index}.binId`} label="Bin">
      {({ field }) => (
        <SearchableSelect
          {...field}
          value={field.value ?? ''}
          options={binOptions}
          placeholder="Select Bin"
          disabled={!warehouseId || binOptions.length === 0}
        />
      )}
    </FormField>
  );
}

function ReceiptLineItem({
  index,
  field,
  form,
  po,
  warehouseOptions,
  warehouses,
}: {
  index: number;
  field: FieldArrayWithId<CreateReceiptInput, 'lines'>;
  form: UseFormReturn<CreateReceiptInput>;
  po?: PurchaseOrderResponse;
  warehouseOptions: { label: string; value: string }[];
  warehouses: WarehouseResponse[];
}) {
  const poLine = po?.lines.find((l) => l.id === field.purchaseOrderLineId);
  const warehouseId = useWatch({
    control: form.control,
    name: `lines.${index}.warehouseId`,
  });

  return (
    <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium text-sm">{poLine?.product.name}</p>
          <p className="text-xs text-muted-foreground">{poLine?.product.sku}</p>
        </div>
        <p className="text-xs font-semibold">Ordered: {poLine?.quantity}</p>
      </div>

      <div className="space-y-4">
        <FormField name={`lines.${index}.warehouseId`} label="Warehouse">
          {({ field: selectField }) => (
            <SearchableSelect
              {...selectField}
              options={warehouseOptions}
              placeholder="Select Warehouse"
            />
          )}
        </FormField>
        <BinSelector index={index} form={form} warehouseId={warehouseId} warehouses={warehouses} />
      </div>
      <FormField name={`lines.${index}.quantityReceived`} label="Quantity to Receive">
        {({ field: inputField }) => <Input {...inputField} type="text" />}
      </FormField>
    </div>
  );
}

export function ReceivePurchaseOrderSheet({ isOpen, onClose, po }: ReceivePurchaseOrderSheetProps) {
  const { mutateAsync: createReceipt, isPending: isLoading } = useCreateReceipt();
  const { data: warehouses } = useWarehousesQuery();

  const form = useForm<CreateReceiptInput>({
    resolver: zodResolver(createReceiptSchema),
    defaultValues: {
      purchaseOrderId: '',
      lines: [],
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: 'lines',
  });

  React.useEffect(() => {
    if (po && isOpen) {
      form.reset({
        purchaseOrderId: po.id,
        lines: po.lines.map((line) => ({
          purchaseOrderLineId: line.id,
          productId: line.productId,
          warehouseId: '',
          binId: null,
          quantityReceived: line.quantity,
        })),
      });
    }
  }, [po, form, isOpen]);

  const onSubmit = async (data: CreateReceiptInput) => {
    if (!po) return;
    try {
      await createReceipt(data);
      onClose();
    } catch (error) {
      // toast.error is handled in the hook
      console.error('Failed to intake stock:', error);
    }
  };

  const warehouseOptions = (warehouses || []).map((w) => ({
    label: w.name,
    value: w.id,
  }));

  return (
    <ResponsiveDrawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ResponsiveDrawerContent className="sm:max-w-xl">
        <ResponsiveDrawerHeader>
          <ResponsiveDrawerTitle>Receive Purchase Order</ResponsiveDrawerTitle>
          <ResponsiveDrawerDescription>
            Confirm the quantities and select the destination warehouse for document{' '}
            <span className="font-semibold">{po?.documentNumber}</span>.
          </ResponsiveDrawerDescription>
        </ResponsiveDrawerHeader>

        <Form<CreateReceiptInput, typeof createReceiptSchema>
          form={form}
          schema={createReceiptSchema}
          onSubmit={onSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          {() => (
            <>
              <div className="space-y-6 px-4 py-4 flex-1 overflow-y-auto">
                {fields.map((field, index) => (
                  <ReceiptLineItem
                    key={field.id}
                    index={index}
                    field={field}
                    form={form}
                    po={po}
                    warehouseOptions={warehouseOptions}
                    warehouses={warehouses || []}
                  />
                ))}
              </div>

              <ResponsiveDrawerFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Processing...' : 'Receive Stock'}
                </Button>
              </ResponsiveDrawerFooter>
            </>
          )}
        </Form>
      </ResponsiveDrawerContent>
    </ResponsiveDrawer>
  );
}
