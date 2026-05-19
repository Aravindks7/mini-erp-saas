import { createHash } from 'crypto';

/**
 * Generates a valid, deterministic UUID v4 format string from any input string.
 * This guarantees idempotency for seeding based on scenario IDs or Document Numbers.
 */
export function generateDeterministicId(
  namespace: string,
  key: string | number,
  type: string = 'base',
): string {
  const input = `${namespace}-${key}-${type}`;
  const hash = createHash('sha256').update(input).digest('hex');

  // Format as UUID: 8-4-4-4-12
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}
