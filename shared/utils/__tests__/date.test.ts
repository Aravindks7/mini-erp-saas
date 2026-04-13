import { describe, it, expect } from 'vitest';
import { formatDate, formatFullDate } from '../date.js';

describe('Date Utilities', () => {
  const testDate = new Date('2026-04-13T12:00:00Z');

  it('should format date to dd/MM/yyyy', () => {
    // Note: formatDate uses new Date() which might depend on local timezone
    // We should ideally test with ISO strings to ensure consistency
    expect(formatDate('2026-04-13')).toBe('13/04/2026');
  });

  it('should handle timestamp inputs', () => {
    const timestamp = testDate.getTime();
    expect(formatDate(timestamp)).toBe('13/04/2026');
  });

  it('should format full date with time', () => {
    const formatted = formatFullDate('2026-04-13T10:00:00');
    // We use a regex or partial match to avoid exact time/timezone issues in CI
    expect(formatted).toMatch(/April 13th, 2026/);
  });
});
