export interface Country {
  name: string;
  code: string; // ISO 3166-1 alpha-2
  postalCodeRegex?: RegExp;
  postalCodePlaceholder?: string;
}

/**
 * Comprehensive ISO Country List for ERP SaaS localization.
 * Powers searchable selects and postal validation logic.
 */
export const COUNTRIES: Country[] = [
  { name: 'Afghanistan', code: 'AF' },
  { name: 'Albania', code: 'AL' },
  { name: 'Algeria', code: 'DZ' },
  { name: 'Andorra', code: 'AD' },
  { name: 'Angola', code: 'AO' },
  { name: 'Argentina', code: 'AR' },
  { name: 'Australia', code: 'AU', postalCodeRegex: /^\d{4}$/, postalCodePlaceholder: 'e.g. 2000' },
  { name: 'Austria', code: 'AT' },
  { name: 'Belgium', code: 'BE' },
  {
    name: 'Brazil',
    code: 'BR',
    postalCodeRegex: /^\d{5}-\d{3}$/,
    postalCodePlaceholder: 'e.g. 01000-000',
  },
  {
    name: 'Canada',
    code: 'CA',
    postalCodeRegex: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
    postalCodePlaceholder: 'e.g. K1A 0B1',
  },
  { name: 'China', code: 'CN' },
  { name: 'Denmark', code: 'DK' },
  { name: 'Egypt', code: 'EG' },
  { name: 'Finland', code: 'FI' },
  { name: 'France', code: 'FR', postalCodeRegex: /^\d{5}$/, postalCodePlaceholder: 'e.g. 75001' },
  { name: 'Germany', code: 'DE', postalCodeRegex: /^\d{5}$/, postalCodePlaceholder: 'e.g. 10115' },
  { name: 'Greece', code: 'GR' },
  { name: 'Hong Kong', code: 'HK' },
  { name: 'Iceland', code: 'IS' },
  { name: 'India', code: 'IN', postalCodeRegex: /^\d{6}$/, postalCodePlaceholder: 'e.g. 560001' },
  { name: 'Indonesia', code: 'ID' },
  { name: 'Ireland', code: 'IE' },
  { name: 'Israel', code: 'IL' },
  { name: 'Italy', code: 'IT' },
  {
    name: 'Japan',
    code: 'JP',
    postalCodeRegex: /^\d{3}-\d{4}$/,
    postalCodePlaceholder: 'e.g. 100-0001',
  },
  { name: 'Malaysia', code: 'MY' },
  { name: 'Mexico', code: 'MX' },
  { name: 'Netherlands', code: 'NL' },
  { name: 'New Zealand', code: 'NZ' },
  { name: 'Norway', code: 'NO' },
  { name: 'Pakistan', code: 'PK' },
  { name: 'Philippines', code: 'PH' },
  { name: 'Poland', code: 'PL' },
  { name: 'Portugal', code: 'PT' },
  { name: 'Singapore', code: 'SG' },
  { name: 'South Africa', code: 'ZA' },
  { name: 'South Korea', code: 'KR' },
  { name: 'Spain', code: 'ES' },
  { name: 'Sweden', code: 'SE' },
  { name: 'Switzerland', code: 'CH' },
  { name: 'Taiwan', code: 'TW' },
  { name: 'Thailand', code: 'TH' },
  { name: 'Turkey', code: 'TR' },
  { name: 'United Arab Emirates', code: 'AE' },
  {
    name: 'United Kingdom',
    code: 'GB',
    postalCodeRegex: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i,
    postalCodePlaceholder: 'e.g. SW1W 0NY',
  },
  {
    name: 'United States',
    code: 'US',
    postalCodeRegex: /^\d{5}(-\d{4})?$/,
    postalCodePlaceholder: 'e.g. 90210',
  },
  { name: 'Vietnam', code: 'VN' },
].sort((a, b) => a.name.localeCompare(b.name));

export const getCountryByName = (name: string) => COUNTRIES.find((c) => c.name === name);
export const getCountryByCode = (code: string) => COUNTRIES.find((c) => c.code === code);
