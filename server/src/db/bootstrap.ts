import { seedRBAC } from './seed.js';
import { logger } from '../utils/logger.js';

/**
 * Orchestrates all vital system initialization tasks.
 * Designed to be idempotent and run on every application startup.
 */
export async function bootstrapSystem() {
  logger.info('🚀 Starting System Bootstrap...');

  try {
    // 1. Sync RBAC (Permissions & Base Roles)
    // This ensures the DB matches our @shared/rbac.contract.ts
    await seedRBAC();

    logger.info('✅ System Bootstrap completed successfully.');
  } catch (error) {
    logger.error(
      { error },
      '❌ System Bootstrap failed! The application may be in an unstable state.',
    );
    // In production, you might want to exit the process here
    // throw error;
  }
}
