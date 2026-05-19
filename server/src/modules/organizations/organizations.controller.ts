import { Request, Response } from 'express';
import { organizationsService } from './organizations.service.js';
import { createOrganizationSchema, updateOrganizationSchema } from '#shared/index.js';
import { logger } from '../../utils/logger.js';
import type { DbError } from '../../types/db.js';

export async function createOrganization(req: Request, res: Response) {
  const parseResult = createOrganizationSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const { name, slug, defaultCountry } = parseResult.data;
  const userId = req.authSession.user.id;

  try {
    const newOrg = await organizationsService.createOrganization(userId, {
      name,
      slug,
      defaultCountry,
    });
    res.status(201).json(newOrg);
  } catch (error: unknown) {
    const dbError = error as DbError;
    logger.error({ error, userId }, 'Failed to create organization');
    if (dbError.code === '23505' || dbError.cause?.code === '23505') {
      return res.status(409).json({ error: 'Organization slug or name already exists' });
    }
    throw error;
  }
}

export async function listMyOrganizations(req: Request, res: Response) {
  const userId = req.authSession.user.id;

  try {
    const myOrgs = await organizationsService.listMyOrganizations(userId);
    res.json(myOrgs);
  } catch (error) {
    logger.error({ error, userId }, 'Failed to list organizations');
    throw error;
  }
}

export async function updateOrganization(req: Request, res: Response) {
  const { organizationId } = req.params as { organizationId: string };
  const adminId = req.authSession.user.id;
  const parseResult = updateOrganizationSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  try {
    const updated = await organizationsService.updateOrganization(
      adminId,
      organizationId,
      parseResult.data,
    );
    res.json(updated);
  } catch (error) {
    logger.error({ error, adminId, organizationId }, 'Failed to update organization');
    throw error;
  }
}

export async function deleteOrganization(req: Request, res: Response) {
  const { organizationId } = req.params as { organizationId: string };
  const adminId = req.authSession.user.id;

  try {
    await organizationsService.deleteOrganization(adminId, organizationId);
    res.json({ success: true });
  } catch (error) {
    logger.error({ error, adminId, organizationId }, 'Failed to delete organization');
    throw error;
  }
}
