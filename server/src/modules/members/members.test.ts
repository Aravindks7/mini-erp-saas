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
      organizationMemberships: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      permissionSets: {
        findMany: vi.fn(),
      },
      rolePermissionSets: {
        findMany: vi.fn(),
      },
    },
    update: vi.fn(() => ({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'm1' }]),
        }),
      }),
    })),
    delete: vi.fn(() => ({
      where: vi.fn().mockResolvedValue([]),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        innerJoin: vi.fn(() => ({
          innerJoin: vi.fn(() => ({
            innerJoin: vi.fn(() => ({
              where: vi.fn(() => ({
                groupBy: vi.fn().mockResolvedValue([{ userId: 'admin-1' }]),
              })),
            })),
          })),
        })),
      })),
    })),
  };

  return {
    db: {
      query: {
        organizationMemberships: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
      },
      transaction: vi.fn((cb) => cb(mockTx)),
      execute: vi.fn().mockResolvedValue({ rows: [] }),
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          innerJoin: vi.fn(() => ({
            innerJoin: vi.fn(() => ({
              innerJoin: vi.fn(() => ({
                where: vi.fn(() => ({
                  groupBy: vi.fn().mockResolvedValue([{ userId: 'admin-1' }]),
                })),
              })),
            })),
          })),
        })),
      })),
    },
  };
});

describe('Members Module', () => {
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

  describe('GET /members', () => {
    it('should return 200 and a list of members', async () => {
      const mockMembers = [
        {
          userId: '550e8400-e29b-41d4-a716-446655440003',
          role: { name: 'Admin' },
          user: { name: 'User 1', email: 'u1@test.com', image: null },
        },
      ];
      (db.query.organizationMemberships.findMany as any).mockResolvedValue(mockMembers);

      const response = await request(app).get('/members').set('x-organization-id', mockOrgId);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].user.name).toBe('User 1');
    });
  });

  describe('PATCH /members/:id', () => {
    it('should update member role successfully', async () => {
      const targetUserId = '550e8400-e29b-41d4-a716-446655440003';
      const payload = { roleId: '550e8400-e29b-41d4-a716-446655440004' };

      vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
        const tx = {
          query: {
            organizationMemberships: {
              findFirst: vi
                .fn()
                .mockResolvedValue({
                  id: '550e8400-e29b-41d4-a716-446655440005',
                  roleId: 'old-role',
                }),
            },
            rolePermissionSets: {
              findMany: vi
                .fn()
                .mockResolvedValue([
                  { permissionSet: { items: [{ permissionId: 'org:members:manage' }] } },
                ]),
            },
          },
          update: vi.fn(() => ({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                returning: vi
                  .fn()
                  .mockResolvedValue([{ id: '550e8400-e29b-41d4-a716-446655440005' }]),
              }),
            }),
          })),
        } as any;
        return cb(tx);
      });

      const response = await request(app)
        .patch(`/members/${targetUserId}`)
        .set('x-organization-id', mockOrgId)
        .send(payload);

      if (response.status !== 200) console.log('DEBUG PATCH:', response.status, response.body);

      expect(response.status).toBe(200);
    });

    it('should return 400 (Last Admin Lockout) when demoting the last admin', async () => {
      const targetUserId = '550e8400-e29b-41d4-a716-446655440003';
      const payload = { roleId: '550e8400-e29b-41d4-a716-446655440006' };

      vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
        const tx = {
          query: {
            organizationMemberships: {
              findFirst: vi
                .fn()
                .mockResolvedValue({
                  id: '550e8400-e29b-41d4-a716-446655440005',
                  roleId: 'admin-role',
                }),
            },
            rolePermissionSets: {
              findMany: vi.fn().mockResolvedValue([{ permissionSet: { items: [] } }]), // Target role has no management perms
            },
          },
          select: vi.fn(() => ({
            from: vi.fn(() => ({
              innerJoin: vi.fn(() => ({
                innerJoin: vi.fn(() => ({
                  innerJoin: vi.fn(() => ({
                    where: vi.fn(() => ({
                      groupBy: vi
                        .fn()
                        .mockResolvedValue([{ userId: '550e8400-e29b-41d4-a716-446655440003' }]), // Only one admin exists
                    })),
                  })),
                })),
              })),
            })),
          })),
        } as any;
        return cb(tx);
      });

      const response = await request(app)
        .patch(`/members/${targetUserId}`)
        .set('x-organization-id', mockOrgId)
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Cannot demote the last administrator');
    });
  });
});
