import { z } from 'zod';

export const paymentTypeEnumSchema = z.enum(['inbound', 'outbound']);
export const paymentMethodEnumSchema = z.enum(['cash', 'bank_transfer', 'check', 'credit_card']);
export const paymentStatusEnumSchema = z.enum(['pending', 'completed', 'failed', 'refunded']);

export const createPaymentSchema = z
  .object({
    paymentType: paymentTypeEnumSchema,
    paymentMethod: paymentMethodEnumSchema,
    amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Amount must be a positive number',
    }),
    paymentDate: z.coerce.date().default(() => new Date()),
    referenceNumber: z.string().max(100).optional().nullable(),
    notes: z.string().max(500).optional().nullable(),

    // References
    invoiceId: z.string().uuid().optional().nullable(),
    billId: z.string().uuid().optional().nullable(),
    customerId: z.string().uuid().optional().nullable(),
    supplierId: z.string().uuid().optional().nullable(),
  })
  .refine(
    (data) => {
      // Ensure we have a target for the payment
      if (data.paymentType === 'inbound') {
        return !!data.customerId || !!data.invoiceId;
      } else {
        return !!data.supplierId || !!data.billId;
      }
    },
    {
      message: 'Inbound payments require a Customer/Invoice; Outbound require a Supplier/Bill',
      path: ['paymentType'],
    },
  );

export const updatePaymentStatusSchema = z.object({
  status: paymentStatusEnumSchema,
});

export const updatePaymentSchema = z.object({
  notes: z.string().max(500).optional().nullable(),
  referenceNumber: z.string().max(100).optional().nullable(),
  paymentDate: z.coerce.date().optional(),
  reason: z.string().max(500).optional().nullable(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentStatusInput = z.infer<typeof updatePaymentStatusSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
