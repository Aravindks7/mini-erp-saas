import { sql } from 'drizzle-orm';
import { db } from './index.js';

export async function setTenant(organizationId: string | null, userId?: string) {
  if (organizationId) {
    await db.execute(
      sql`SELECT set_config('app.current_organization_id', ${organizationId}, true)`,
    );
  }
  if (userId) {
    await db.execute(sql`SELECT set_config('app.current_user_id', ${userId}, true)`);
  }
}
