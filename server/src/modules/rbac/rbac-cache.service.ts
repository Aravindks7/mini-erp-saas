import { redisClient } from '../../utils/redis.js';
import { logger } from '../../utils/logger.js';
import type { Permission } from '#shared/index.js';

export class RBACCacheService {
  private readonly TTL = 3600; // 1 hour
  private readonly PREFIX = 'rbac:perm';
  private readonly VER_PREFIX = 'rbac:permver';

  private async getVersion(orgId: string): Promise<string> {
    try {
      if (!redisClient.isOpen) return '0';
      const version = await redisClient.get(`${this.VER_PREFIX}:${orgId}`);
      return version || '0';
    } catch (err) {
      logger.warn({ err, orgId }, 'Failed to fetch RBAC version from Redis, falling back to 0');
      return '0';
    }
  }

  async getCachedPermissions(userId: string, orgId: string): Promise<Permission[] | null> {
    try {
      if (!redisClient.isOpen) return null;

      const version = await this.getVersion(orgId);
      const key = `${this.PREFIX}:${orgId}:${userId}:v${version}`;

      const cached = await redisClient.get(key);
      if (!cached) return null;

      return JSON.parse(cached) as Permission[];
    } catch (err) {
      logger.error({ err, userId, orgId }, 'Failed to get cached permissions');
      return null;
    }
  }

  async cachePermissions(userId: string, orgId: string, permissions: Permission[]): Promise<void> {
    try {
      if (!redisClient.isOpen) return;

      const version = await this.getVersion(orgId);
      const key = `${this.PREFIX}:${orgId}:${userId}:v${version}`;

      await redisClient.setEx(key, this.TTL, JSON.stringify(permissions));
    } catch (err) {
      logger.error({ err, userId, orgId }, 'Failed to cache permissions');
    }
  }

  async invalidateTenant(orgId: string): Promise<void> {
    try {
      if (!redisClient.isOpen) return;

      // Increment the tenant's version to effectively invalidate all cached permissions for this tenant
      await redisClient.incr(`${this.VER_PREFIX}:${orgId}`);
      logger.info({ orgId }, 'Invalidated RBAC cache for tenant');
    } catch (err) {
      logger.error({ err, orgId }, 'Failed to invalidate tenant RBAC cache');
    }
  }
}

export const rbacCacheService = new RBACCacheService();
