/**
 * IGNORE_FIELDS
 *
 * Fields that should be excluded from the audit log to reduce noise.
 * These are internal metadata fields that change frequently but don't
 * represent a meaningful change in business state.
 */
export const IGNORE_FIELDS = [
  'id',
  'organizationId',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'createdBy',
  'updatedBy',
  'version',
  // Foreign Key IDs (should use names/labels instead)
  'customerId',
  'supplierId',
  'productId',
  'accountId',
  'warehouseId',
  'binId',
];

export interface DeltaValue {
  from: unknown;
  to: unknown;
}

export type Delta = Record<string, DeltaValue>;

/**
 * DiffUtility
 *
 * A specialized utility for computing structural differences between two entity states.
 * Designed for the Activity Logger to capture exactly what changed in a record.
 */
export class DiffUtility {
  /**
   * Compares two objects and returns a Delta object containing only the changed fields.
   *
   * @param oldObj The original state of the object.
   * @param newObj The updated state of the object.
   * @returns A Delta object mapping field names to { from, to } values.
   */
  static getDelta(oldObj: Record<string, unknown>, newObj: Record<string, unknown>): Delta {
    const delta: Delta = {};

    // Only compare keys that are present in the new object (Partial Update Logic)
    const keysToCompare = Object.keys(newObj);

    for (const key of keysToCompare) {
      // Skip ignored fields
      if (IGNORE_FIELDS.includes(key)) continue;

      const oldVal = oldObj[key];
      const newVal = newObj[key];

      // Deep comparison for basic types and Dates
      if (!this.isEqual(oldVal, newVal)) {
        delta[key] = {
          from: this.formatValue(oldVal),
          to: this.formatValue(newVal),
        };
      }
    }

    return delta;
  }

  /**
   * Helper to format values for storage (e.g., converting Dates to strings).
   */
  private static formatValue(val: unknown): unknown {
    if (val instanceof Date) return val.toISOString();
    if (Array.isArray(val)) return `Array(${val.length})`;
    if (typeof val === 'object' && val !== null) return 'Object';
    return val;
  }

  /**
   * Performs a robust equality check.
   */
  private static isEqual(a: unknown, b: unknown): boolean {
    // Strict equality
    if (a === b) return true;

    // Handle null/undefined comparison
    if (a == null && b == null) return true;
    if (a == null || b == null) return false;

    // Handle Dates
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime();
    }

    // Handle Numbers (convert strings to numbers if one is a number)
    if (typeof a === 'number' && typeof b === 'string') {
      return a === Number(b);
    }
    if (typeof a === 'string' && typeof b === 'number') {
      return Number(a) === b;
    }

    // Handle string-string numeric comparison (e.g., "10.0000" vs "10")
    if (typeof a === 'string' && typeof b === 'string') {
      const numA = Number(a);
      const numB = Number(b);
      if (!isNaN(numA) && !isNaN(numB) && a.trim() !== '' && b.trim() !== '') {
        return numA === numB;
      }
    }

    // Handle nested objects (shallow for now as Drizzle models are flat)
    if (typeof a === 'object' && typeof b === 'object') {
      return JSON.stringify(a) === JSON.stringify(b);
    }

    return false;
  }
}
