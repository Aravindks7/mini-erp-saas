import { db } from '../index.js';
import { accounts, journalEntries, journalEntryLines } from '../schema/index.js';
import { SEED_DATA } from './constants.js';
import { generateDeterministicId } from './engine/utils.js';
import { subMonths, startOfMonth } from 'date-fns';

export async function seedFinance() {
  console.log('🌱 Seeding Finance (COA & Historical GL)...');
  const { ORGANIZATION_ID, USER_ID, ACCOUNTS } = SEED_DATA;

  // 1. Seed Chart of Accounts
  const coa = [
    { id: ACCOUNTS.BANK, name: 'Main Operating Account', code: '1020', type: 'asset' },
    { id: ACCOUNTS.ACCOUNTS_RECEIVABLE, name: 'Accounts Receivable', code: '1200', type: 'asset' },
    { id: ACCOUNTS.INVENTORY, name: 'Inventory Asset', code: '1400', type: 'asset' },
    { id: ACCOUNTS.PREPAID_EXPENSES, name: 'Prepaid Expenses', code: '1600', type: 'asset' },
    { id: ACCOUNTS.ACCOUNTS_PAYABLE, name: 'Accounts Payable', code: '2000', type: 'liability' },
    {
      id: ACCOUNTS.INVENTORY_CLEARING,
      name: 'Inventory Clearing',
      code: '2100',
      type: 'liability',
    },
    { id: ACCOUNTS.VAT_PAYABLE, name: 'VAT Payable', code: '2200', type: 'liability' },
    { id: ACCOUNTS.SALARIES_PAYABLE, name: 'Salaries Payable', code: '2400', type: 'liability' },
    {
      id: ACCOUNTS.OPENING_BALANCE_EQUITY,
      name: 'Opening Balance Equity',
      code: '3000',
      type: 'equity',
    },
    { id: ACCOUNTS.RETAINED_EARNINGS, name: 'Retained Earnings', code: '3200', type: 'equity' },
    { id: ACCOUNTS.OWNER_CONTRIBUTION, name: 'Owner Contribution', code: '3400', type: 'equity' },
    { id: ACCOUNTS.PRODUCT_SALES, name: 'Product Sales', code: '4000', type: 'revenue' },
    { id: ACCOUNTS.SERVICE_REVENUE, name: 'Service Revenue', code: '4200', type: 'revenue' },
    { id: ACCOUNTS.INTEREST_INCOME, name: 'Interest Income', code: '4400', type: 'revenue' },
    { id: ACCOUNTS.COST_OF_GOODS_SOLD, name: 'Cost of Goods Sold', code: '5000', type: 'expense' },
    { id: ACCOUNTS.RENT_EXPENSE, name: 'Rent or Lease', code: '5100', type: 'expense' },
    { id: ACCOUNTS.UTILITIES_EXPENSE, name: 'Utilities', code: '6100', type: 'expense' },
    { id: ACCOUNTS.SALARY_EXPENSE, name: 'Salaries and Wages', code: '6200', type: 'expense' },
    {
      id: ACCOUNTS.MARKETING_EXPENSE,
      name: 'Marketing & Advertising',
      code: '6300',
      type: 'expense',
    },
    { id: ACCOUNTS.BANK_FEES, name: 'Bank Fees', code: '6400', type: 'expense' },
  ];

  for (const account of coa) {
    console.log(`   - Account: ${account.name} (${account.id})`);
    await db
      .insert(accounts)
      .values({
        ...account,
        type: account.type as 'asset' | 'liability' | 'equity' | 'revenue' | 'expense',
        organizationId: ORGANIZATION_ID,
        isActive: true,
        createdBy: USER_ID,
        updatedBy: USER_ID,
      })
      .onConflictDoUpdate({
        target: [accounts.id],
        set: {
          name: account.name,
          code: account.code,
          type: account.type as 'asset' | 'liability' | 'equity' | 'revenue' | 'expense',
        },
      });
  }

  // 2. Seed Historical GL Entries (Opening Balance & Fixed Expenses)
  const now = new Date();

  // A. Opening Balance (6 months ago)
  const openingDate = subMonths(now, 6);
  const openingJeId = generateDeterministicId(ORGANIZATION_ID, 'JE-OPENING');
  await db
    .insert(journalEntries)
    .values({
      id: openingJeId,
      organizationId: ORGANIZATION_ID,
      date: openingDate,
      reference: 'OPEN-001',
      description: 'Initial Opening Balance',
      status: 'posted',
      createdBy: USER_ID,
      updatedBy: USER_ID,
    })
    .onConflictDoNothing();

  await db
    .insert(journalEntryLines)
    .values([
      {
        id: generateDeterministicId(ORGANIZATION_ID, 'JE-OPENING-L1'),
        organizationId: ORGANIZATION_ID,
        journalEntryId: openingJeId,
        accountId: ACCOUNTS.BANK,
        debit: '250000.00',
        credit: '0.00',
      },
      {
        id: generateDeterministicId(ORGANIZATION_ID, 'JE-OPENING-L2'),
        organizationId: ORGANIZATION_ID,
        journalEntryId: openingJeId,
        accountId: ACCOUNTS.OPENING_BALANCE_EQUITY,
        debit: '0.00',
        credit: '250000.00',
      },
    ])
    .onConflictDoNothing();

  // B. Monthly Recurring Expenses (Rent, Utilities, Marketing, Fees) for last 6 months
  console.log('   - Generating Monthly Recurring Expenses (Last 6 Months)...');
  for (let i = 0; i < 6; i++) {
    const periodDate = startOfMonth(subMonths(now, i));
    const jeId = generateDeterministicId(ORGANIZATION_ID, `JE-MONTHLY-EXP-${i}`);

    await db
      .insert(journalEntries)
      .values({
        id: jeId,
        organizationId: ORGANIZATION_ID,
        date: periodDate,
        reference: `EXP-2026-M${6 - i}`,
        description: `Monthly Fixed Expenses - Month ${6 - i}`,
        status: 'posted',
        createdBy: USER_ID,
        updatedBy: USER_ID,
      })
      .onConflictDoNothing();

    await db
      .insert(journalEntryLines)
      .values([
        {
          id: generateDeterministicId(ORGANIZATION_ID, `JE-MONTHLY-EXP-${i}-L1`),
          organizationId: ORGANIZATION_ID,
          journalEntryId: jeId,
          accountId: ACCOUNTS.RENT_EXPENSE,
          debit: '2000.00',
          credit: '0.00',
        },
        {
          id: generateDeterministicId(ORGANIZATION_ID, `JE-MONTHLY-EXP-${i}-L2`),
          organizationId: ORGANIZATION_ID,
          journalEntryId: jeId,
          accountId: ACCOUNTS.UTILITIES_EXPENSE,
          debit: '350.00',
          credit: '0.00',
        },
        {
          id: generateDeterministicId(ORGANIZATION_ID, `JE-MONTHLY-EXP-${i}-L3`),
          organizationId: ORGANIZATION_ID,
          journalEntryId: jeId,
          accountId: ACCOUNTS.MARKETING_EXPENSE,
          debit: '800.00',
          credit: '0.00',
        },
        {
          id: generateDeterministicId(ORGANIZATION_ID, `JE-MONTHLY-EXP-${i}-L4`),
          organizationId: ORGANIZATION_ID,
          journalEntryId: jeId,
          accountId: ACCOUNTS.BANK_FEES,
          debit: '45.00',
          credit: '0.00',
        },
        {
          id: generateDeterministicId(ORGANIZATION_ID, `JE-MONTHLY-EXP-${i}-L5`),
          organizationId: ORGANIZATION_ID,
          journalEntryId: jeId,
          accountId: ACCOUNTS.BANK,
          debit: '0.00',
          credit: '3195.00',
        },
      ])
      .onConflictDoNothing();
  }

  // C. Draft Journal Entries (Testing unposted state)
  const draftJeId = generateDeterministicId(ORGANIZATION_ID, 'JE-DRAFT-01');
  await db
    .insert(journalEntries)
    .values({
      id: draftJeId,
      organizationId: ORGANIZATION_ID,
      date: now,
      reference: 'DRAFT-001',
      description: 'Pending Office Supply Purchase',
      status: 'draft',
      createdBy: USER_ID,
      updatedBy: USER_ID,
    })
    .onConflictDoNothing();

  await db
    .insert(journalEntryLines)
    .values([
      {
        id: generateDeterministicId(ORGANIZATION_ID, 'JE-DRAFT-01-L1'),
        organizationId: ORGANIZATION_ID,
        journalEntryId: draftJeId,
        accountId: ACCOUNTS.MARKETING_EXPENSE,
        debit: '150.00',
        credit: '0.00',
      },
      {
        id: generateDeterministicId(ORGANIZATION_ID, 'JE-DRAFT-01-L2'),
        organizationId: ORGANIZATION_ID,
        journalEntryId: draftJeId,
        accountId: ACCOUNTS.ACCOUNTS_PAYABLE,
        debit: '0.00',
        credit: '150.00',
      },
    ])
    .onConflictDoNothing();
}
