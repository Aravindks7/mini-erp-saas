import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sequencesService } from './sequences.service.js';
import { db } from '../../db/index.js';

vi.mock('../../db/index.js', () => ({
  db: {
    insert: vi.fn(),
    transaction: vi.fn((cb) => cb(db)),
  },
}));

describe('SequencesService', () => {
  const mockOrgId = 'org-123';
  const mockUserId = 'user-456';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate first sequence correctly (inserted)', async () => {
    const mockSequence = {
      prefix: 'ADJ-',
      nextValue: 2,
      padding: 4,
    };

    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockSequence]),
        }),
      }),
    } as any);

    const result = await sequencesService.getNextSequence(mockOrgId, 'ADJ', mockUserId);
    expect(result).toBe('ADJ-0001');
  });

  it('should generate subsequent sequences correctly (updated)', async () => {
    const mockSequence = {
      prefix: 'ADJ-',
      nextValue: 11,
      padding: 4,
    };

    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockSequence]),
        }),
      }),
    } as any);

    const result = await sequencesService.getNextSequence(mockOrgId, 'ADJ', mockUserId);
    expect(result).toBe('ADJ-0010');
  });

  it('should handle custom padding', async () => {
    const mockSequence = {
      prefix: 'INV-',
      nextValue: 2,
      padding: 6,
    };

    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockSequence]),
        }),
      }),
    } as any);

    const result = await sequencesService.getNextSequence(mockOrgId, 'INV', mockUserId);
    expect(result).toBe('INV-000001');
  });
});
