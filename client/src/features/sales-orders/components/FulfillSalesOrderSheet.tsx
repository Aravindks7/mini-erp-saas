import * as React from 'react';
import { z } from 'zod';
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

import {
  createShipmentSchema,
  type CreateShipmentInput,
} from '@shared/contracts/shipments.contract';
import { ACTION_REASONS } from '@shared/config/activity-actions.config';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const extendedShipmentSchema = createShipmentSchema.extend({
  reasonId: z.string().min(1, 'Please select a reason'),
  customReason: z.string().optional(),
});
type ExtendedShipmentInput = z.infer<typeof extendedShipmentSchema>;
import type { SalesOrderResponse } from '../api/sales-orders.api';
import { useCreateShipment } from '@/features/shipments/hooks/shipments.hooks';
import { useWarehouses } from '@/features/warehouses/hooks/warehouses.hooks';
import type { WarehouseResponse } from '@/features/warehouses/api/warehouses.api';

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
  form: UseFormReturn<ExtendedShipmentInput>;
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
}: {
  index: number;
  field: FieldArrayWithId<ExtendedShipmentInput, 'lines'>;
  form: UseFormReturn<ExtendedShipmentInput>;
  so?: SalesOrderResponse;
  warehouseOptions: { label: string; value: string }[];
  warehouses: WarehouseResponse[];
}) {
  const soLine = so?.lines.find(
    (l) => l.id === (field as { salesOrderLineId: string }).salesOrderLineId,
  );
  const warehouseId = useWatch({
    control: form.control,
    name: `lines.${index}.warehouseId`,
  });

  const ordered = Number(soLine?.quantity || 0);
  const shipped = Number(soLine?.quantityShipped || 0);
  const remaining = Math.max(0, ordered - shipped);

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
      <FormField name={`lines.${index}.quantityShipped`} label="Quantity to Ship">
        {({ field: inputField }) => <Input {...inputField} type="text" />}
      </FormField>
    </div>
  );
}

export function FulfillSalesOrderSheet({ isOpen, onClose, so }: FulfillSalesOrderSheetProps) {
  const { mutateAsync: createShipment, isPending: isLoading } = useCreateShipment();
  const { data: warehouses } = useWarehouses();

  // Dynamically create schema with contextual validation against 'so'
  const fulfillmentSchema = React.useMemo(() => {
    return extendedShipmentSchema.superRefine((data, ctx) => {
      data.lines.forEach((line, index) => {
        const soLine = so?.lines.find((l) => l.id === line.salesOrderLineId);
        if (soLine) {
          const ordered = Number(soLine.quantity);
          const shipped = Number(soLine.quantityShipped || 0);
          const remaining = Math.max(0, ordered - shipped);
          const requested = Number(line.quantityShipped);

          if (requested > remaining) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Maximum remaining: ${remaining}`,
              path: ['lines', index, 'quantityShipped'],
            });
          }
        }
      });
    });
  }, [so]);

  const form = useForm<ExtendedShipmentInput>({
    resolver: zodResolver(fulfillmentSchema),
    defaultValues: {
      salesOrderId: '',
      lines: [],
      reasonId: 'standard_fulfillment',
      customReason: '',
    },
    mode: 'onChange',
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: 'lines',
  });

  const reasonId = useWatch({
    control: form.control,
    name: 'reasonId',
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

  // Auto-select fulfillment reason based on quantities
  const watchedLines = useWatch({
    control: form.control,
    name: 'lines',
  });

  const watchedLinesString = JSON.stringify(watchedLines);

  React.useEffect(() => {
    if (!so || !watchedLines) return;

    let isPartial = false;
    watchedLines.forEach((line: ExtendedShipmentInput['lines'][number]) => {
      const soLine = so.lines.find((l) => l.id === line.salesOrderLineId);
      if (soLine) {
        const ordered = Number(soLine.quantity);
        const shippedAlready = Number(soLine.quantityShipped || 0);
        const remaining = Math.max(0, ordered - shippedAlready);
        const requested = Number(line.quantityShipped);

        if (requested < remaining) {
          isPartial = true;
        }
      }
    });

    const currentReasonId = form.getValues('reasonId');
    const newReasonId = isPartial ? 'partial_fulfillment' : 'standard_fulfillment';
    const isAutoReason =
      !currentReasonId ||
      currentReasonId === 'standard_fulfillment' ||
      currentReasonId === 'partial_fulfillment';

    if (currentReasonId !== newReasonId && isAutoReason) {
      form.setValue('reasonId', newReasonId, { shouldDirty: true, shouldValidate: true });
    }
  }, [watchedLines, watchedLinesString, so, form]);

  const onSubmit = async (data: ExtendedShipmentInput) => {
    if (!so) return;

    try {
      const reasons = ACTION_REASONS.ORDER_SHIPPED || [];
      const selectedReason = reasons.find((r) => r.value === data.reasonId);
      let finalReasonText = selectedReason?.label || data.reasonId;

      if (data.reasonId === 'other' && data.customReason) {
        finalReasonText = data.customReason;
      }

      const payload: CreateShipmentInput = {
        ...data,
        action: 'ORDER_SHIPPED',
        reason: finalReasonText,
      };

      await createShipment(payload);
      toast.success('Inventory allocated and shipment recorded.');
      onClose();
    } catch (error) {
      console.error('Failed to ship stock:', error);
      // The backend error will be caught here if validation somehow bypasses the frontend
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

        <Form<ExtendedShipmentInput, typeof extendedShipmentSchema>
          form={form}
          schema={extendedShipmentSchema}
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
                  />
                ))}

                <div className="pt-6 border-t mt-6 space-y-4">
                  <FormField name="reasonId" label="Fulfillment Reason">
                    {({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <SelectTrigger id={field.id} className="w-full">
                          <SelectValue placeholder="Select a reason" />
                        </SelectTrigger>
                        <SelectContent>
                          {(ACTION_REASONS.ORDER_SHIPPED || []).map((reason) => (
                            <SelectItem key={reason.value} value={reason.value}>
                              {reason.label}
                            </SelectItem>
                          ))}
                          <SelectItem value="other">Other (Please specify)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </FormField>

                  {reasonId === 'other' && (
                    <div className="animate-in fade-in slide-in-from-top-1">
                      <FormField name="customReason" label="Custom Reason">
                        {({ field }) => (
                          <Textarea placeholder="Enter your reason here..." {...field} />
                        )}
                      </FormField>
                    </div>
                  )}
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
