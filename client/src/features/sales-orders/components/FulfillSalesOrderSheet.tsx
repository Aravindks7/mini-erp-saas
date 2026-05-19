import * as React from 'react';
import type { UseFormReturn, FieldArrayWithId } from 'react-hook-form';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Input } from '@/components/ui/input';
import { Form } from '@/components/shared/form/Form';
import { FormField } from '@/components/shared/form/FormField';
import { SearchableSelect } from '@/components/shared/form/SearchableSelect';
import { Textarea } from '@/components/ui/textarea';

import {
  createShipmentSchema,
  type CreateShipmentInput,
} from '@shared/contracts/shipments.contract';
import type { SalesOrderResponse } from '../api/sales-orders.api';
import { useCreateShipment } from '@/features/shipments/hooks/shipments.hooks';
import { useWarehousesQuery } from '@/features/warehouses/hooks/warehouses.hooks';
import { useInventoryLevelsQuery } from '@/features/inventory/hooks/inventory.hooks';
import type { WarehouseResponse } from '@/features/warehouses/api/warehouses.api';
import type { InventoryLevelResponse } from '@/features/inventory/api/inventory.api';

interface FulfillSalesOrderSheetProps {
  isOpen: boolean;
  onClose: () => void;
  so?: SalesOrderResponse;
}

function BinSelector({
  index,
  form,
  warehouseId,
  warehouses,
}: {
  index: number;
  form: UseFormReturn<CreateShipmentInput>;
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
    <FormField name={`lines.${index}.binId`} label="Source Bin">
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

function ShipmentLineItem({
  index,
  field,
  form,
  so,
  warehouseOptions,
  warehouses,
  inventoryLevels,
}: {
  index: number;
  field: FieldArrayWithId<CreateShipmentInput, 'lines'>;
  form: UseFormReturn<CreateShipmentInput>;
  so?: SalesOrderResponse;
  warehouseOptions: { label: string; value: string }[];
  warehouses: WarehouseResponse[];
  inventoryLevels: InventoryLevelResponse[];
}) {
  const soLine = so?.lines.find(
    (l) => l.id === (field as unknown as { salesOrderLineId: string }).salesOrderLineId,
  );
  const warehouseId = useWatch({
    control: form.control,
    name: `lines.${index}.warehouseId`,
  });
  const binId = useWatch({
    control: form.control,
    name: `lines.${index}.binId`,
  });
  const requestedQty = useWatch({
    control: form.control,
    name: `lines.${index}.quantityShipped`,
  });

  const ordered = Number(soLine?.quantity || 0);
  const shipped = Number(soLine?.quantityShipped || 0);
  const remaining = Math.max(0, ordered - shipped);

  const currentLevel = inventoryLevels.find(
    (l) =>
      l.productId === soLine?.productId &&
      l.warehouseId === warehouseId &&
      (l.binId === binId || (!l.binId && !binId)),
  );
  const available = Number(currentLevel?.quantityOnHand || 0);
  const isInsufficient = Number(requestedQty) > available;

  return (
    <div key={field.id} className="p-4 border rounded-lg bg-muted/30 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium text-sm">{soLine?.product.name}</p>
          <p className="text-xs text-muted-foreground">{soLine?.product.sku}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold">Remaining: {remaining}</p>
          <p className="text-[10px] text-muted-foreground">Ordered: {ordered}</p>
        </div>
      </div>

      <div className="space-y-4">
        <FormField name={`lines.${index}.warehouseId`} label="Source Warehouse">
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
      <div className="grid grid-cols-2 gap-4">
        <FormField name={`lines.${index}.quantityShipped`} label="Quantity to Ship">
          {({ field: inputField }) => <Input {...inputField} type="text" />}
        </FormField>
        <div className="">
          {warehouseId && (
            <div className="animate-in fade-in slide-in-from-right-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Availability
              </p>
              <p className={`text-sm font-medium ${isInsufficient ? 'text-destructive' : ''}`}>
                {available} available
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function FulfillSalesOrderSheet({ isOpen, onClose, so }: FulfillSalesOrderSheetProps) {
  const { mutateAsync: createShipment, isPending: isLoading } = useCreateShipment();
  const { data: warehouses } = useWarehousesQuery();
  const { data: inventoryLevels } = useInventoryLevelsQuery();

  const fulfillmentSchema = createShipmentSchema;

  const form = useForm<CreateShipmentInput>({
    resolver: zodResolver(fulfillmentSchema),
    defaultValues: {
      salesOrderId: '',
      lines: [],
      reason: '',
    },
    mode: 'onChange',
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: 'lines',
  });

  // Effect to handle SO changes and form reset
  React.useEffect(() => {
    if (so && isOpen) {
      const fulfillableLines = so.lines
        .map((line) => {
          const ordered = Number(line.quantity);
          const shipped = Number(line.quantityShipped || 0);
          const remaining = Math.max(0, ordered - shipped);

          return {
            salesOrderLineId: line.id,
            productId: line.productId,
            warehouseId: '',
            binId: null,
            quantityShipped: remaining > 0 ? remaining.toString() : '',
            remaining,
          };
        })
        .filter((l) => l.remaining > 0);

      form.reset({
        salesOrderId: so.id,
        lines: fulfillableLines.map((line) => ({
          salesOrderLineId: line.salesOrderLineId,
          productId: line.productId,
          warehouseId: line.warehouseId,
          binId: line.binId,
          quantityShipped: line.quantityShipped,
        })),
      });
    }
  }, [so, isOpen, form]);

  // (Auto-reason logic removed as it's now handled by backend)

  const onSubmit = async (data: CreateShipmentInput) => {
    if (!so) return;

    try {
      const payload: CreateShipmentInput = {
        ...data,
        action: 'ORDER_SHIPPED',
      };

      await createShipment(payload);
      toast.success('Inventory allocated and shipment recorded.');
      onClose();
    } catch (error) {
      console.error('Failed to ship stock:', error);
      const msg = error instanceof Error ? error.message : 'Failed to create shipment';
      toast.error(msg);
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
          <ResponsiveDrawerTitle>Fulfill Sales Order</ResponsiveDrawerTitle>
          <ResponsiveDrawerDescription>
            Select source warehouse and confirm quantities to ship for document{' '}
            <span className="font-semibold">{so?.documentNumber}</span>.
          </ResponsiveDrawerDescription>
        </ResponsiveDrawerHeader>

        <Form<CreateShipmentInput, typeof createShipmentSchema>
          form={form}
          schema={createShipmentSchema}
          onSubmit={onSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          {(form) => (
            <>
              <div className="space-y-6 px-4 py-4 flex-1 overflow-y-auto">
                {fields.map((field, index) => (
                  <ShipmentLineItem
                    key={field.id}
                    index={index}
                    field={field}
                    form={form}
                    so={so}
                    warehouseOptions={warehouseOptions}
                    warehouses={warehouses || []}
                    inventoryLevels={inventoryLevels || []}
                  />
                ))}

                <div className="pt-6 border-t mt-6 space-y-4">
                  <FormField name="reason" label="Shipment Notes (Optional)">
                    {({ field }) => (
                      <Textarea
                        placeholder="Add any specific context about this shipment (e.g. expedited, carrier details)..."
                        {...field}
                        value={field.value ?? ''}
                      />
                    )}
                  </FormField>
                </div>
              </div>

              <ResponsiveDrawerFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Processing...' : 'Allocate & Ship'}
                </Button>
              </ResponsiveDrawerFooter>
            </>
          )}
        </Form>
      </ResponsiveDrawerContent>
    </ResponsiveDrawer>
  );
}
