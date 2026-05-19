import { z } from 'zod';

export const currencySchema = z.object({
  code: z.string().min(3).max(3).toUpperCase().describe('ISO 4217 Currency Code (e.g., USD)'),
  symbol: z.string().min(1).max(5).describe('Currency symbol (e.g., $)'),
  name: z.string().min(1).max(100).describe('Full name of the currency'),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

export const currencyResponseSchema = currencySchema.extend({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});

export type CurrencyInput = z.infer<typeof currencySchema>;
export type CurrencyResponse = z.infer<typeof currencyResponseSchema>;

export const createCurrencySchema = currencySchema;
export const updateCurrencySchema = currencySchema.partial();

export type CreateCurrencyInput = z.infer<typeof createCurrencySchema>;
export type UpdateCurrencyInput = z.infer<typeof updateCurrencySchema>;
