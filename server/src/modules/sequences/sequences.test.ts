import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sequencesService } from './sequences.service.js';
import { db } from '../../db/index.js';

vi.mock('../../db/index.js', () => ({
  db: {
    insert: vi.fn(),
    update: vi.fn(),
    execute: vi.fn().mockResolvedValue({ rows: [] }),
    query: {
      documentSequences: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
    },
    transaction: vi.fn((cb) => cb(db)),
  },
}));

vi.mock('../../lib/activity-logger.js', () => ({
  ActivityLogger: {
    recordUpdate: vi.fn(),
    record: vi.fn(),
  },
}));

describe('SequencesService', () => {
  const mockOrgId = 'org-123';
  const mockUserId = 'user-456';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should list sequences for an organization', async () => {
    const mockSequences = [{ id: '1', type: 'INV' }];
    vi.mocked(db.query.documentSequences.findMany).mockResolvedValue(mockSequences as any);

    const result = await sequencesService.listSequences(mockOrgId);
    expect(result).toEqual(mockSequences);
    expect(db.query.documentSequences.findMany).toHaveBeenCalled();
  });

  it('should update a sequence configuration', async () => {
    const mockUpdate = { prefix: 'NEW-', padding: 6, reason: 'Testing change' };
    const mockResult = { id: '1', type: 'INV', ...mockUpdate };
    const oldSequence = { id: '1', type: 'INV', prefix: 'OLD-', padding: 4, nextValue: 10 };

    vi.mocked(db.query.documentSequences.findFirst).mockResolvedValue(oldSequence as any);
    vi.mocked(db.update).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockResult]),
        }),
      }),
    } as any);

    const result = await sequencesService.updateSequence(mockOrgId, mockUserId, '1', mockUpdate);
    expect(result).toEqual(mockResult);
    expect(db.update).toHaveBeenCalled();
  });

  it('should generate first sequence correctly with tokens (inserted)', async () => {
    const mockSequence = {
      prefix: 'INV-[YYYY]-',
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

    const result = await sequencesService.getNextSequence(mockOrgId, 'INV', mockUserId);
    const currentYear = new Date().getFullYear().toString();
    expect(result).toBe(`INV-${currentYear}-0001`);
  });

  it('should resolve multiple tokens correctly', async () => {
    const mockSequence = {
      prefix: '[YYYY][MM][DD]-',
      nextValue: 2,
      padding: 3,
    };

    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockSequence]),
        }),
      }),
    } as any);

    const result = await sequencesService.getNextSequence(mockOrgId, 'TEST', mockUserId);
    const now = new Date();
    const expected = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-001`;
    expect(result).toBe(expected);
  });
});
