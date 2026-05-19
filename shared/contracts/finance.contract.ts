import { z } from 'zod';

export const accountTypeEnumSchema = z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']);

export const createAccountSchema = z.object({
  code: z.string().min(1, 'Account code is required').max(20),
  name: z.string().min(1, 'Account name is required').max(100),
  type: accountTypeEnumSchema,
  subtype: z.string().max(50).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateAccountSchema = createAccountSchema.partial();

export const journalEntryLineSchema = z
  .object({
    accountId: z.string().uuid('Invalid account ID'),
    debit: z.number().min(0).default(0),
    credit: z.number().min(0).default(0),
    description: z.string().max(500).optional().nullable(),
  })
  .refine(
    (data) => (data.debit > 0 && data.credit === 0) || (data.debit === 0 && data.credit > 0),
    { message: 'A line must have either a debit or a credit, but not both or neither.' },
  );

export const createJournalEntrySchema = z
  .object({
    date: z
      .string()
      .datetime()
      .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    reference: z.string().max(100).optional().nullable(),
    description: z.string().max(500).optional().nullable(),
    lines: z.array(journalEntryLineSchema).min(2, 'A journal entry must have at least two lines'),
  })
  .refine(
    (data) => {
      const totalDebit = data.lines.reduce((sum, line) => sum + line.debit, 0);
      const totalCredit = data.lines.reduce((sum, line) => sum + line.credit, 0);
      // Use a small epsilon for floating point comparison if needed,
      // but for precision we usually handle cents/decimals carefully.
      return Math.abs(totalDebit - totalCredit) < 0.01;
    },
    { message: 'Journal entry is not balanced. Total debits must equal total credits.' },
  );

export const updateJournalEntrySchema = createJournalEntrySchema.extend({
  reason: z.string().max(500).optional().nullable(),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type CreateJournalEntryInput = z.infer<typeof createJournalEntrySchema>;
export type UpdateJournalEntryInput = z.infer<typeof updateJournalEntrySchema>;
export type JournalEntryLineInput = z.infer<typeof journalEntryLineSchema>;

// Reports
export const profitAndLossSchema = z.object({
  revenue: z.number(),
  expenses: z.number(),
  netIncome: z.number(),
  details: z.array(
    z.object({
      accountName: z.string(),
      type: z.string(),
      balance: z.number(),
    }),
  ),
});

export const balanceSheetSchema = z.object({
  assets: z.number(),
  liabilities: z.number(),
  equity: z.number(),
  isBalanced: z.boolean(),
  details: z.array(
    z.object({
      accountName: z.string(),
      type: z.string(),
      balance: z.number(),
    }),
  ),
});

export type ProfitAndLossResponse = z.infer<typeof profitAndLossSchema>;
export type BalanceSheetResponse = z.infer<typeof balanceSheetSchema>;
