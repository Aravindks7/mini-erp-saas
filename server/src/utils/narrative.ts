import type { Delta } from './diff.js';

/**
 * NarrativeGenerator
 *
 * A specialized utility for synthesizing human-readable narratives from structural deltas.
 * This ensures audit logs are descriptive and consistent across the platform.
 */
export class NarrativeGenerator {
  /**
   * Generates a "user-friendly" narrative from a Delta object.
   *
   * @param delta The structural difference between two entity states.
   * @returns A human-readable string (e.g., "Adjusted: Customer, Total Amount").
   */
  static fromDelta(delta: Delta): string {
    const keys = Object.keys(delta);

    if (keys.length === 0) {
      return 'No significant changes detected';
    }

    const labels = keys.map((key) => this.formatLabel(key));

    // Deduplicate labels (in case multiple fields map to the same human concept)
    const uniqueLabels = Array.from(new Set(labels));

    return `Adjusted: ${uniqueLabels.join(', ')}`;
  }

  /**
   * Maps technical field names to human-readable labels.
   */
  private static formatLabel(key: string): string {
    const mapping: Record<string, string> = {
      customerId: 'Customer',
      totalAmount: 'Total Amount',
      status: 'Status',
      lines: 'Order Line Items',
      documentNumber: 'Order Number',
      notes: 'Notes',
      shippingAddress: 'Shipping Address',
      billingAddress: 'Billing Address',
      taxAmount: 'Tax Amount',
      // Add more mappings as needed
    };

    if (mapping[key]) {
      return mapping[key];
    }

    // Fallback: Convert camelCase to Title Case
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }
}
