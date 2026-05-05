import { db } from '../../db/index.js';
import { activityLogs, user } from '../../db/schema/index.js';
import { and, eq, desc, lt, ilike, gte, lte, or, inArray } from 'drizzle-orm';

/**
 * ActivityLogsService: Read-path for the activity_logs audit trail.
 * Axiom: This service is read-only. Writes are exclusively handled by the ActivityLogger utility.
 */
export class ActivityLogsService {
  /**
   * Returns activity logs for a specific entity, ordered by most recent first.
   * Used for the entity-scoped "Activity" tab on detail pages.
   */
  async getByEntity(organizationId: string, entityType: string, entityId: string) {
    return await db.query.activityLogs.findMany({
      where: and(
        eq(activityLogs.organizationId, organizationId),
        eq(activityLogs.entityType, entityType),
        eq(activityLogs.entityId, entityId),
      ),
      with: {
        user: {
          columns: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: [desc(activityLogs.createdAt)],
      limit: 100,
    });
  }

  /**
   * Returns recent activity across the organization with cursor-based pagination.
   * Used for the global Activity page.
   */
  async getByOrganization(
    organizationId: string,
    options?: {
      entityType?: string;
      cursor?: string;
      limit?: number;
      search?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const limit = Math.min(options?.limit || 50, 100);

    // Normalize search: replace spaces with % to handle "Sales Order" -> "sales_order" matching
    const searchTerm = options?.search ? `%${options.search.trim().replace(/\s+/g, '%')}%` : null;

    const conditions = [eq(activityLogs.organizationId, organizationId)];

    if (options?.entityType) {
      const types = options.entityType.split(',');
      if (types.length > 1) {
        conditions.push(inArray(activityLogs.entityType, types));
      } else {
        conditions.push(eq(activityLogs.entityType, types[0]!));
      }
    }

    if (searchTerm) {
      // Create a subquery or join-based condition to search user names
      // For performance and clarity in this ERP, we'll use a manual join approach
    }

    if (options?.startDate) {
      conditions.push(gte(activityLogs.createdAt, new Date(options.startDate)));
    }

    if (options?.endDate) {
      conditions.push(lte(activityLogs.createdAt, new Date(options.endDate)));
    }

    if (options?.cursor) {
      conditions.push(lt(activityLogs.createdAt, new Date(options.cursor)));
    }

    // Refactored to use db.select for advanced joining and filtering
    const query = db
      .select({
        // Extract all activity log columns
        id: activityLogs.id,
        organizationId: activityLogs.organizationId,
        entityType: activityLogs.entityType,
        entityId: activityLogs.entityId,
        action: activityLogs.action,
        reason: activityLogs.reason,
        snapshot: activityLogs.snapshot,
        createdAt: activityLogs.createdAt,
        createdBy: activityLogs.createdBy,
        updatedAt: activityLogs.updatedAt,
        updatedBy: activityLogs.updatedBy,
        // Joined user data
        user: {
          name: user.name,
          image: user.image,
        },
      })
      .from(activityLogs)
      .leftJoin(user, eq(activityLogs.createdBy, user.id))
      .where(
        and(
          ...conditions,
          searchTerm
            ? or(
                ilike(activityLogs.action, searchTerm),
                ilike(activityLogs.reason, searchTerm),
                ilike(activityLogs.entityType, searchTerm),
                ilike(user.name, searchTerm), // Now we can search by user name!
              )
            : undefined,
        ),
      )
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit + 1);

    const items = await query;

    const hasMore = items.length > limit;
    const results = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? results[results.length - 1]?.createdAt?.toISOString() : null;

    return {
      items: results,
      nextCursor,
      hasMore,
    };
  }
}

export const activityLogsService = new ActivityLogsService();
