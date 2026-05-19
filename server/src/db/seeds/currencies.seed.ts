import { db } from '../index.js';
import { currencies } from '../schema/index.js';
import { SEED_DATA } from './constants.js';

const DEFAULT_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
];

export async function seedCurrencies() {
  console.log('🌱 Seeding Currencies...');

  const allOrgs = await db.query.organizations.findMany();

  for (const org of allOrgs) {
    console.log(`   - Seeding for Org: ${org.name} (${org.id})`);

    for (const curr of DEFAULT_CURRENCIES) {
      const existing = await db.query.currencies.findFirst({
        where: (currencies, { and, eq }) =>
          and(eq(currencies.organizationId, org.id), eq(currencies.code, curr.code)),
      });

      if (!existing) {
        // Determine if this should be the default based on organization country
        // e.g. US -> USD, IN -> INR
        const isDefault =
          (org.defaultCountry === 'US' && curr.code === 'USD') ||
          (org.defaultCountry === 'IN' && curr.code === 'INR') ||
          (org.defaultCountry === 'GB' && curr.code === 'GBP') ||
          (org.defaultCountry === 'AE' && curr.code === 'AED') ||
          (!['US', 'IN', 'GB', 'AE'].includes(org.defaultCountry) && curr.code === 'USD');

        await db.insert(currencies).values({
          organizationId: org.id,
          code: curr.code,
          symbol: curr.symbol,
          name: curr.name,
          isActive: true,
          isDefault,
          updatedBy: SEED_DATA.USER_ID,
          createdBy: SEED_DATA.USER_ID,
        });
      }
    }
  }
  console.log('   - Currencies seeded successfully.');
}
