import Papa from 'papaparse';

/**
 * Sanitizes a value to prevent CSV injection attacks.
 * If a value starts with sensitive characters (=, +, -, @, or \r),
 * it prepends a single quote (').
 */
export function sanitizeCsvValue(val: unknown): string {
  if (val === null || val === undefined) return '';

  const str = String(val);
  const injectionChars = ['=', '+', '-', '@', '\r'];

  if (injectionChars.some((char) => str.startsWith(char))) {
    return `'${str}`;
  }

  return str;
}

/**
 * Sanitizes an object's values for CSV export.
 */
export function sanitizeCsvRow<T extends Record<string, unknown>>(row: T): Record<string, string> {
  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    sanitized[key] = sanitizeCsvValue(value);
  }
  return sanitized;
}

/**
 * Generates a sanitized CSV string from an array of objects.
 */
export function generateCsv<T extends Record<string, unknown>>(data: T[]): string {
  const sanitizedData = data.map(sanitizeCsvRow);
  return Papa.unparse(sanitizedData, {
    header: true,
    skipEmptyLines: true,
  });
}

/**
 * Parses a CSV buffer into an array of objects.
 * Note: This doesn't apply sanitization logic during parsing as parsing is
 * for data ingestion, whereas sanitization is for data display/export.
 */
export function parseCsv<T = unknown>(buffer: Buffer): T[] {
  const csvString = buffer.toString('utf-8');
  const result = Papa.parse<T>(csvString, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
    transform: (value) => value.trim(),
  });

  if (result.errors.length > 0) {
    throw new Error(`Failed to parse CSV: ${result.errors[0]?.message || 'Unknown error'}`);
  }

  return result.data;
}
