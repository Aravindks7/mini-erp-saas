import { useMemo } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { useCurrencies } from './currencies.hooks';
import { getCurrencyByCountry } from '@shared/utils/currency-map';

/**
 * useCurrency Hook
 *
 * Provides a dynamic currency context based on the active organization's configuration.
 *
 * 1. Priority: Organization's explicit default currency (from database).
 * 2. Fallback: Implicit currency mapping based on organization's country.
 *
 * High-leverage hook used for consistent financial formatting across the ERP.
 */
export function useCurrency() {
  const { activeOrganization } = useTenant();
  const { data: currencies } = useCurrencies();

  const resolvedCurrency = useMemo(() => {
    // 1. Try to find the default currency set by the user in the database
    if (currencies && currencies.length > 0) {
      const dbDefault = currencies.find((c) => c.isDefault && c.isActive);
      if (dbDefault) {
        return {
          code: dbDefault.code,
          symbol: dbDefault.symbol,
          name: dbDefault.name,
        };
      }
    }

    // 2. Fallback to country-based mapping if no default is found (or while loading)
    const country = activeOrganization?.defaultCountry || 'US';
    return getCurrencyByCountry(country);
  }, [activeOrganization, currencies]);

  // 3. Derive formatting locale from organization's country
  const formattingLocale = useMemo(() => {
    const country = activeOrganization?.defaultCountry || 'US';
    return getCurrencyByCountry(country).locale;
  }, [activeOrganization]);

  /**
   * Formats a numeric value into a currency string.
   * Uses Intl.NumberFormat for locale-aware presentation.
   */
  const format = (value: number | string | undefined) => {
    if (value === undefined || value === '') return '';
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numericValue)) return '';

    return new Intl.NumberFormat(formattingLocale, {
      style: 'currency',
      currency: resolvedCurrency.code,
    }).format(numericValue);
  };

  return {
    ...resolvedCurrency,
    format,
  };
}
