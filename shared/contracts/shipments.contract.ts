import { z } from 'zod';

export const shipmentStatusEnumSchema = z.enum(['draft', 'shipped', 'cancelled']);

export const createShipmentSchema = z.object({
  salesOrderId: z.string().uuid('Invalid Sales Order ID'),
  action: z.string().optional(),
  reason: z.string().optional(),
  shipmentDate: z.string().or(z.date()).optional(),
  reference: z.string().max(100).optional().nullable(),
  status: shipmentStatusEnumSchema.optional(),
  lines: z
    .array(
      z.object({
        salesOrderLineId: z.string().uuid('Invalid Sales Order Line ID'),
        productId: z.string().uuid('Invalid Product ID'),
        warehouseId: z.string().uuid('Please select a source warehouse'),
        binId: z.string().uuid('Invalid Bin ID').optional().nullable(),
        quantityShipped: z
          .string()
          .or(z.number())
          .refine((val) => Number(val) > 0, {
            message: 'Quantity shipped must be greater than 0',
          }),
      }),
    )
    .min(1, 'At least one shipment line is required'),
});

export const updateShipmentSchema = createShipmentSchema.partial().extend({
  lines: z.array(z.any()).optional(), // Any for now, ideally reused line schema
});

export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;
export type UpdateShipmentInput = z.infer<typeof updateShipmentSchema>;
export type ShipmentStatus = z.infer<typeof shipmentStatusEnumSchema>;
