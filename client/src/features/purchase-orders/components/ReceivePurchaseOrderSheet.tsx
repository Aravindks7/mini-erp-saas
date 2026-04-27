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
  receivePurchaseOrderSchema,
  type ReceivePurchaseOrderInput,
} from '@shared/contracts/purchase-orders.contract';
import type { PurchaseOrderResponse } from '../api/purchase-orders.api';
import { useReceivePurchaseOrder } from '../hooks/purchase-orders.hooks';
import { useWarehouses } from '@/features/warehouses/hooks/warehouses.hooks';

interface ReceivePurchaseOrderSheetProps {
  isOpen: boolean;
  onClose: () => void;
  po?: PurchaseOrderResponse;
}

export function ReceivePurchaseOrderSheet({ isOpen, onClose, po }: ReceivePurchaseOrderSheetProps) {
  const { mutateAsync: receivePO, status } = useReceivePurchaseOrder();
  const { data: warehouses } = useWarehouses();

  const form = useForm<ReceivePurchaseOrderInput>({
    resolver: zodResolver(receivePurchaseOrderSchema),
    defaultValues: {
      lines: [],
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: 'lines',
  });

  useEffect(() => {
    if (po && isOpen) {
      form.reset({
        lines: po.lines.map((line) => ({
          purchaseOrderLineId: line.id,
          warehouseId: '',
          binId: null,
          quantityReceived: line.quantity,
        })),
      });
    }
  }, [po, form, isOpen]);

  const onSubmit = async (data: ReceivePurchaseOrderInput) => {
    if (!po) return;
    try {
      await receivePO({ id: po.id, data });
      toast.success('Stock intaken successfully');
      onClose();
    } catch {
      toast.error('Failed to intake stock');
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
          <ResponsiveDrawerTitle>Receive Purchase Order</ResponsiveDrawerTitle>
          <ResponsiveDrawerDescription>
            Confirm the quantities and select the destination warehouse for document{' '}
            <span className="font-semibold">{po?.documentNumber}</span>.
          </ResponsiveDrawerDescription>
        </ResponsiveDrawerHeader>

        <Form<ReceivePurchaseOrderInput, typeof receivePurchaseOrderSchema>
          form={form}
          schema={receivePurchaseOrderSchema}
          onSubmit={onSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          {() => (
            <>
              <div className="space-y-6 px-4 py-4 flex-1 overflow-y-auto">
                {fields.map((field, index) => {
                  const poLine = po?.lines.find((l) => l.id === field.purchaseOrderLineId);
                  return (
                    <div key={field.id} className="p-4 border rounded-lg bg-muted/30 space-y-4">
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
                        <FormField
                          name={`lines.${index}.quantityReceived`}
                          label="Quantity to Receive"
                        >
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
                  Receive Stock
                </Button>
              </ResponsiveDrawerFooter>
            </>
          )}
        </Form>
      </ResponsiveDrawerContent>
    </ResponsiveDrawer>
  );
}
