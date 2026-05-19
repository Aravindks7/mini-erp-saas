export interface CurrencyMapEntry {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

export const COUNTRY_CURRENCY_MAP: Record<string, CurrencyMapEntry> = {
  US: { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  GB: { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  IN: { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  AE: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', locale: 'ar-AE' },
  EU: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'en-EU' },
  DE: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  FR: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'fr-FR' },
  JP: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
};

/**
 * Resolves the primary currency for a given country code.
 * Defaults to USD if no mapping is found.
 */
export function getCurrencyByCountry(countryCode: string): CurrencyMapEntry {
  return (COUNTRY_CURRENCY_MAP[countryCode.toUpperCase()] ||
    COUNTRY_CURRENCY_MAP['US']) as CurrencyMapEntry;
}
