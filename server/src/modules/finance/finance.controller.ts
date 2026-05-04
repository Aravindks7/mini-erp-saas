import { Request, Response } from 'express';
import { accountsService } from './accounts.service.js';
import { journalEntriesService } from './journal-entries.service.js';
import {
  createAccountSchema,
  updateAccountSchema,
  createJournalEntrySchema,
} from '#shared/contracts/finance.contract.js';
import { logger } from '../../utils/logger.js';
import { generateCsv } from '../../utils/csv.js';

// --- Accounts ---

export async function listAccounts(req: Request, res: Response) {
  const organizationId = req.organizationId;
  try {
    const results = await accountsService.listAccounts(organizationId);
    res.json(results);
  } catch (error) {
    logger.error({ error, organizationId }, 'Failed to list accounts');
    throw error;
  }
}

export async function createAccount(req: Request, res: Response) {
  const parseResult = createAccountSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const newAccount = await accountsService.createAccount(
      organizationId,
      userId,
      parseResult.data,
    );
    res.status(201).json(newAccount);
  } catch (error) {
    logger.error({ error, organizationId, userId }, 'Failed to create account');
    throw error;
  }
}

export async function updateAccount(req: Request, res: Response) {
  const { id } = req.params;
  const parseResult = updateAccountSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const updatedAccount = await accountsService.updateAccount(
      organizationId,
      userId,
      id as string,
      parseResult.data,
    );
    if (!updatedAccount) {
      return res.status(404).json({ error: 'Account not found' });
    }
    res.json(updatedAccount);
  } catch (error) {
    logger.error({ error, organizationId, userId, id }, 'Failed to update account');
    throw error;
  }
}

// --- Journal Entries ---

export async function listJournalEntries(req: Request, res: Response) {
  const organizationId = req.organizationId;
  try {
    const results = await journalEntriesService.listJournalEntries(organizationId);
    res.json(results);
  } catch (error) {
    logger.error({ error, organizationId }, 'Failed to list journal entries');
    throw error;
  }
}

export async function getJournalEntry(req: Request, res: Response) {
  const { id } = req.params;
  const organizationId = req.organizationId;

  try {
    const entry = await journalEntriesService.getJournalEntryById(organizationId, id as string);
    if (!entry) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }
    res.json(entry);
  } catch (error) {
    logger.error({ error, organizationId, id }, 'Failed to get journal entry');
    throw error;
  }
}

export async function createJournalEntry(req: Request, res: Response) {
  const parseResult = createJournalEntrySchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const newEntry = await journalEntriesService.createJournalEntry(
      organizationId,
      userId,
      parseResult.data,
    );
    res.status(201).json(newEntry);
  } catch (error: unknown) {
    logger.error({ error, organizationId, userId }, 'Failed to create journal entry');
    const message = error instanceof Error ? error.message : 'Failed to create journal entry';
    if (message === 'Journal entry is not balanced.') {
      return res.status(400).json({ error: message });
    }
    throw error;
  }
}

export async function voidJournalEntry(req: Request, res: Response) {
  const { id } = req.params;
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const voided = await journalEntriesService.voidJournalEntry(
      organizationId,
      userId,
      id as string,
    );
    if (!voided) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }
    res.json(voided);
  } catch (error) {
    logger.error({ error, organizationId, userId, id }, 'Failed to void journal entry');
    throw error;
  }
}

// --- Reports ---

export async function getProfitAndLoss(req: Request, res: Response) {
  const organizationId = req.organizationId;
  const startDate = req.query.startDate
    ? new Date(req.query.startDate as string)
    : new Date(new Date().getFullYear(), 0, 1);
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

  try {
    const { financeService } = await import('./finance.service.js');
    const result = await financeService.getProfitAndLoss(organizationId, startDate, endDate);

    // Handle CSV Export
    if (req.headers.accept?.includes('text/csv')) {
      const rows = [
        // Revenue Section
        { section: 'OPERATING REVENUE', accountName: '', balance: '' },
        ...result.details
          .filter((d) => d.type === 'revenue')
          .map((d) => ({ section: '', accountName: d.accountName, balance: d.balance.toFixed(2) })),
        { section: 'TOTAL OPERATING REVENUE', accountName: '', balance: result.revenue.toFixed(2) },

        // Empty row
        { section: '', accountName: '', balance: '' },

        // Expense Section
        { section: 'OPERATING EXPENSES', accountName: '', balance: '' },
        ...result.details
          .filter((d) => d.type === 'expense')
          .map((d) => ({ section: '', accountName: d.accountName, balance: d.balance.toFixed(2) })),
        {
          section: 'TOTAL OPERATING EXPENSES',
          accountName: '',
          balance: result.expenses.toFixed(2),
        },

        // Summary
        { section: '', accountName: '', balance: '' },
        { section: 'NET INCOME', accountName: '', balance: result.netIncome.toFixed(2) },
      ];

      const csv = generateCsv(rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=profit-and-loss-${req.query.startDate}-${req.query.endDate}.csv`,
      );
      return res.send(csv);
    }

    res.json(result);
  } catch (error) {
    logger.error({ error, organizationId }, 'Failed to generate P&L report');
    throw error;
  }
}

export async function getBalanceSheet(req: Request, res: Response) {
  const organizationId = req.organizationId;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

  try {
    const { financeService } = await import('./finance.service.js');
    const result = await financeService.getBalanceSheet(organizationId, endDate);

    // Handle CSV Export
    if (req.headers.accept?.includes('text/csv')) {
      const rows = [
        // Assets
        { section: 'ASSETS', accountName: '', balance: '' },
        ...result.details
          .filter((d) => d.type === 'asset')
          .map((d) => ({ section: '', accountName: d.accountName, balance: d.balance.toFixed(2) })),
        { section: 'TOTAL ASSETS', accountName: '', balance: result.assets.toFixed(2) },

        { section: '', accountName: '', balance: '' },

        // Liabilities
        { section: 'LIABILITIES', accountName: '', balance: '' },
        ...result.details
          .filter((d) => d.type === 'liability')
          .map((d) => ({ section: '', accountName: d.accountName, balance: d.balance.toFixed(2) })),
        { section: 'TOTAL LIABILITIES', accountName: '', balance: result.liabilities.toFixed(2) },

        { section: '', accountName: '', balance: '' },

        // Equity
        { section: 'EQUITY', accountName: '', balance: '' },
        ...result.details
          .filter((d) => d.type === 'equity')
          .map((d) => ({ section: '', accountName: d.accountName, balance: d.balance.toFixed(2) })),
        { section: 'TOTAL EQUITY', accountName: '', balance: result.equity.toFixed(2) },

        { section: '', accountName: '', balance: '' },

        // Grand Total
        {
          section: 'TOTAL LIABILITIES & EQUITY',
          accountName: '',
          balance: (result.liabilities + result.equity).toFixed(2),
        },
      ];

      const csv = generateCsv(rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=balance-sheet-${req.query.endDate}.csv`,
      );
      return res.send(csv);
    }

    res.json(result);
  } catch (error) {
    logger.error({ error, organizationId }, 'Failed to generate Balance Sheet report');
    throw error;
  }
}
