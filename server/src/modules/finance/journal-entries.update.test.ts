import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { auth } from '../auth/auth.js';
import { db } from '../../db/index.js';

vi.mock('../rbac/rbac.service.js', () => ({
  rbacService: {
    getPermissions: vi
      .fn()
      .mockResolvedValue(['finance:read', 'finance:create', 'finance:update', 'finance:delete']),
    invalidateCache: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../auth/auth.js', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
    handler: vi.fn(),
  },
}));

const mockTx = {
  query: {
    journalEntries: {
      findFirst: vi.fn(),
    },
  },
  insert: vi.fn(() => ({
    values: vi.fn(() => ({
      returning: vi.fn().mockResolvedValue([{ id: 'new-id' }]),
    })),
  })),
  update: vi.fn(() => ({
    set: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([{ id: 'updated-id' }]),
      })),
    })),
  })),
  delete: vi.fn(() => ({
    where: vi.fn().mockResolvedValue({}),
  })),
};

vi.mock('../../db/index.js', () => ({
  db: {
    query: {
      organizationMemberships: {
        findFirst: vi.fn(),
      },
      journalEntries: {
        findFirst: vi.fn(),
      },
    },
    transaction: vi.fn((cb) => cb(mockTx)),
    execute: vi.fn().mockResolvedValue({ rows: [] }),
  },
}));

vi.mock('../../lib/activity-logger.js', () => ({
  ActivityLogger: {
    record: vi.fn().mockResolvedValue(undefined),
    recordUpdate: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('Journal Entry Update Forensic Hardening', () => {
  const mockUserId = 'user-123';
  const mockOrgId = 'org-456';
  const jeId = 'c0a80101-0000-4000-a000-000000000001';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: mockUserId } } as any);
    vi.mocked(db.query.organizationMemberships.findFirst).mockResolvedValue({
      role: 'admin',
      organization: { id: mockOrgId },
    } as any);
  });

  it('should update a draft journal entry with balanced lines', async () => {
    const payload = {
      date: '2024-05-01',
      description: 'Updated Office Supplies',
      lines: [
        { accountId: 'c0a80101-0000-4000-a000-000000000001', debit: 75, credit: 0 },
        { accountId: 'c0a80101-0000-4000-a000-000000000002', debit: 0, credit: 75 },
      ],
      reason: 'Correction of original amount',
    };

    // Mock existing draft entry
    vi.mocked(mockTx.query.journalEntries.findFirst).mockResolvedValue({
      id: jeId,
      status: 'draft',
      organizationId: mockOrgId,
      date: new Date('2024-05-01'),
      description: 'Office Supplies',
      lines: [],
    } as any);

    const response = await request(app)
      .patch(`/finance/journal-entries/${jeId}`)
      .send(payload)
      .set('x-organization-id', mockOrgId);

    expect(response.status).toBe(200);
    expect(mockTx.delete).toHaveBeenCalled(); // Should have replaced lines
    expect(mockTx.insert).toHaveBeenCalled();
    expect(mockTx.update).toHaveBeenCalled();
  });

  it('should block updates to posted journal entries', async () => {
    const payload = {
      date: '2024-05-01',
      lines: [
        { accountId: 'c0a80101-0000-4000-a000-000000000001', debit: 75, credit: 0 },
        { accountId: 'c0a80101-0000-4000-a000-000000000002', debit: 0, credit: 75 },
      ],
    };

    // Mock existing posted entry
    vi.mocked(mockTx.query.journalEntries.findFirst).mockResolvedValue({
      id: jeId,
      status: 'posted',
      organizationId: mockOrgId,
    } as any);

    const response = await request(app)
      .patch(`/finance/journal-entries/${jeId}`)
      .send(payload)
      .set('x-organization-id', mockOrgId);

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Only draft');
  });

  it('should reject unbalanced updates', async () => {
    const payload = {
      date: '2024-05-01',
      lines: [
        { accountId: 'c0a80101-0000-4000-a000-000000000001', debit: 100, credit: 0 },
        { accountId: 'c0a80101-0000-4000-a000-000000000002', debit: 0, credit: 75 },
      ],
    };

    vi.mocked(mockTx.query.journalEntries.findFirst).mockResolvedValue({
      id: jeId,
      status: 'draft',
      organizationId: mockOrgId,
    } as any);

    const response = await request(app)
      .patch(`/finance/journal-entries/${jeId}`)
      .send(payload)
      .set('x-organization-id', mockOrgId);

    expect(response.status).toBe(400);
    expect(JSON.stringify(response.body.error)).toContain('balanced');
  });
});
