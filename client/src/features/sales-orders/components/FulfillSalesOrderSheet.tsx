import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
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
  fulfillSalesOrderSchema,
  type FulfillSalesOrderInput,
} from '@shared/contracts/sales-orders.contract';
import type { SalesOrderResponse } from '../api/sales-orders.api';
import { useFulfillSalesOrder } from '../hooks/sales-orders.hooks';
import { useWarehouses } from '@/features/warehouses/hooks/warehouses.hooks';

interface FulfillSalesOrderSheetProps {
  isOpen: boolean;
  onClose: () => void;
  so?: SalesOrderResponse;
}

export function FulfillSalesOrderSheet({ isOpen, onClose, so }: FulfillSalesOrderSheetProps) {
  const { mutateAsync: fulfillSO, status } = useFulfillSalesOrder();
  const { data: warehouses } = useWarehouses();

  const form = useForm<FulfillSalesOrderInput>({
    resolver: zodResolver(fulfillSalesOrderSchema),
    defaultValues: {
      lines: [],
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: 'lines',
  });

  useEffect(() => {
    if (so && isOpen) {
      form.reset({
        lines: so.lines.map((line) => ({
          salesOrderLineId: line.id,
          warehouseId: '',
          binId: undefined,
          quantityShipped: line.quantity,
        })),
      });
    }
  }, [so, form, isOpen]);

  const onSubmit = async (data: FulfillSalesOrderInput) => {
    if (!so) return;
    try {
      await fulfillSO({ id: so.id, data });
      toast.success('Order fulfilled and stock outtaken successfully');
      onClose();
    } catch {
      toast.error('Failed to fulfill order');
    }
  };

  const isLoading = status === 'pending';
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
            Confirm fulfillment quantities and select the source warehouse for order{' '}
            <span className="font-semibold">{so?.documentNumber}</span>.
          </ResponsiveDrawerDescription>
        </ResponsiveDrawerHeader>

        <Form<FulfillSalesOrderInput, typeof fulfillSalesOrderSchema>
          form={form}
          schema={fulfillSalesOrderSchema}
          onSubmit={onSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          {() => (
            <>
              <div className="space-y-6 px-4 py-4 flex-1 overflow-y-auto">
                {fields.map((field, index) => {
                  const soLine = so?.lines.find((l) => l.id === field.salesOrderLineId);
                  return (
                    <div key={field.id} className="p-4 border rounded-lg bg-muted/30 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{soLine?.product.name}</p>
                          <p className="text-xs text-muted-foreground">{soLine?.product.sku}</p>
                        </div>
                        <p className="text-xs font-semibold">Ordered: {soLine?.quantity}</p>
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
                        <FormField name={`lines.${index}.quantityShipped`} label="Quantity to Ship">
                          {({ field: inputField }) => <Input {...inputField} type="text" />}
                        </FormField>
                      </div>
                    </div>
                  );
                })}
              </div>

              <ResponsiveDrawerFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" loading={isLoading}>
                  Ship Order
                </Button>
              </ResponsiveDrawerFooter>
            </>
          )}
        </Form>
      </ResponsiveDrawerContent>
    </ResponsiveDrawer>
  );
}
