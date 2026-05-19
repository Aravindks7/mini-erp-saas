import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { auth } from '../auth/auth.js';
import { db } from '../../db/index.js';

vi.mock('../rbac/rbac.service.js', () => ({
  rbacService: {
    getPermissions: vi.fn().mockResolvedValue(['org:members:manage']),
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

vi.mock('../../lib/activity-logger.js', () => ({
  ActivityLogger: {
    record: vi.fn().mockResolvedValue(undefined),
    recordUpdate: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../db/index.js', () => {
  const mockTx = {
    query: {
      organizationInvites: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      user: {
        findFirst: vi.fn(),
      },
      organizationMemberships: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'new-id' }]),
        }),
      }),
    })),
    update: vi.fn(() => ({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'updated-id', email: 'test@test.com' }]),
        }),
      }),
    })),
  };

  return {
    db: {
      query: {
        organizationMemberships: {
          findFirst: vi.fn(),
        },
        organizationInvites: {
          findMany: vi.fn(),
        },
      },
      transaction: vi.fn((cb) => cb(mockTx)),
      execute: vi.fn().mockResolvedValue({ rows: [] }),
    },
  };
});

describe('Invitations Module', () => {
  const mockOrgId = '550e8400-e29b-41d4-a716-446655440001';
  const mockUserId = '550e8400-e29b-41d4-a716-446655440002';
  const mockSession = {
    session: { id: 'session-123' },
    user: { id: mockUserId, email: 'test@example.com' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (auth.api.getSession as any).mockResolvedValue(mockSession);
    (db.query.organizationMemberships.findFirst as any).mockResolvedValue({
      organizationId: mockOrgId,
      userId: mockUserId,
      organization: { id: mockOrgId },
    });
  });

  describe('GET /invitations', () => {
    it('should return 200 and a list of invites', async () => {
      const mockInvites = [
        {
          id: 'i1',
          email: 'test@test.com',
          role: { name: 'Admin' },
          status: 'pending',
          createdAt: new Date(),
          expiresAt: new Date(),
        },
      ];
      (db.query.organizationInvites.findMany as any).mockResolvedValue(mockInvites);

      const response = await request(app).get('/invitations').set('x-organization-id', mockOrgId);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });
  });

  describe('POST /invitations', () => {
    it('should invite a new user (pending invite)', async () => {
      const payload = { userEmail: 'new@test.com', roleId: '550e8400-e29b-41d4-a716-446655440003' };

      vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
        const tx = {
          query: {
            user: { findFirst: vi.fn().mockResolvedValue(null) }, // User doesn't exist
          },
          insert: vi.fn(() => ({
            values: vi.fn().mockReturnValue({
              onConflictDoUpdate: vi.fn().mockReturnValue({
                returning: vi
                  .fn()
                  .mockResolvedValue([{ id: '550e8400-e29b-41d4-a716-446655440004' }]),
              }),
            }),
          })),
        } as any;
        return cb(tx);
      });

      const response = await request(app)
        .post('/invitations')
        .set('x-organization-id', mockOrgId)
        .send(payload);

      if (response.status !== 201) console.log('DEBUG INVITE:', response.status, response.body);

      expect(response.status).toBe(201);
      expect(response.body.invited).toBe(true);
    });

    it('should add existing user directly', async () => {
      const payload = {
        userEmail: 'existing@test.com',
        roleId: '550e8400-e29b-41d4-a716-446655440003',
      };

      vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
        const tx = {
          query: {
            user: {
              findFirst: vi.fn().mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440005' }),
            }, // User exists
          },
          insert: vi.fn(() => ({
            values: vi.fn().mockReturnValue({
              onConflictDoUpdate: vi.fn().mockReturnValue({
                returning: vi
                  .fn()
                  .mockResolvedValue([{ id: '550e8400-e29b-41d4-a716-446655440006' }]),
              }),
            }),
          })),
        } as any;
        return cb(tx);
      });

      const response = await request(app)
        .post('/invitations')
        .set('x-organization-id', mockOrgId)
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.joined).toBe(true);
    });
  });
});
