import { useState, useCallback } from 'react';
import { getCountryByName } from '@shared/utils/countries';

export interface GeoLocation {
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export type GeoLookupError = 'invalid_zip_format' | 'not_found' | 'network_error' | null;

export function useGeoLookup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<GeoLookupError>(null);

  const lookup = useCallback(
    async (countryName: string, postalCode: string): Promise<GeoLocation | null> => {
      if (!countryName || !postalCode) return null;

      setError(null);

      const country = getCountryByName(countryName);
      if (!country) return null;

      // PRE-VALIDATION: Check regex before triggering network request
      if (country.postalCodeRegex && !country.postalCodeRegex.test(postalCode)) {
        setError('invalid_zip_format');
        return null;
      }

      const cacheKey = `geo:${country.code.toLowerCase()}:${postalCode.toLowerCase()}`;

      // Check sessionStorage cache
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          sessionStorage.removeItem(cacheKey);
        }
      }

      setLoading(true);
      try {
        const response = await fetch(
          `https://api.zippopotam.us/${country.code.toLowerCase()}/${postalCode}`,
        );

        if (!response.ok) {
          if (response.status === 404) {
            setError('not_found');
          } else {
            setError('network_error');
          }
          return null;
        }

        const data = await response.json();

        if (data.places && data.places.length > 0) {
          const place = data.places[0];
          const location: GeoLocation = {
            city: place['place name'],
            state: place['state'],
            country: data['country'],
            postalCode: data['post code'],
          };

          // Cache result
          sessionStorage.setItem(cacheKey, JSON.stringify(location));
          return location;
        }

        setError('not_found');
        return null;
      } catch (err) {
        console.error('GeoLookup failed:', err);
        setError('network_error');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { lookup, loading, error };
}
