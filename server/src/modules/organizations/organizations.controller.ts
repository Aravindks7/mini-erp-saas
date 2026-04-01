import { Request, Response } from 'express';
import { organizationsService } from './organizations.service.js';
import { createOrganizationSchema } from '../../../../shared/contracts/organizations.contract.js';
import { logger } from '../../utils/logger.js';

export async function createOrganization(req: Request, res: Response) {
  const parseResult = createOrganizationSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const { name, slug } = parseResult.data;
  const userId = req.authSession.user.id;

  try {
    const newOrg = await organizationsService.createOrganization(userId, { name, slug });
    res.status(201).json(newOrg);
  } catch (error: any) {
    logger.error({ error, userId }, 'Failed to create organization');
    if (error.code === '23505' || (error as any).cause?.code === '23505') {
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

export async function addMember(req: Request, res: Response) {
  const { organizationId } = req.params;
  const { userEmail, role = 'employee' } = req.body;
  const adminId = req.authSession.user.id;

  if (!organizationId || typeof organizationId !== 'string') {
    return res.status(400).json({ error: 'Valid organizationId parameter is required' });
  }

  try {
    await organizationsService.addMember({
      adminId,
      organizationId,
      userEmail,
      role: role as 'admin' | 'employee',
    });

    res.status(201).json({ message: 'Member added successfully' });
  } catch (error: any) {
    logger.error({ error, adminId, organizationId }, 'Failed to add member');

    if (error.message === 'FORBIDDEN') {
      return res.status(403).json({ error: 'Only admins can add members' });
    }
    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ error: 'User not found' });
    }
    if (error.code === '23505' || (error as any).cause?.code === '23505') {
      return res.status(409).json({ error: 'User is already a member of this organization' });
    }

    throw error;
  }
}

export async function inviteMember(req: Request, res: Response) {
  const { organizationId } = req.params;
  const { userEmail, role = 'employee' } = req.body;
  const adminId = req.authSession.user.id;

  if (!organizationId || typeof organizationId !== 'string') {
    return res.status(400).json({ error: 'Valid organizationId parameter is required' });
  }

  try {
    const result = await organizationsService.inviteMember({
      adminId,
      organizationId,
      userEmail,
      role: role as 'admin' | 'employee',
    });

    if ((result as any).invited) {
      return res.status(201).json({ message: 'Invitation sent successfully' });
    }

    res.status(201).json({ message: 'Member added successfully' });
  } catch (error: any) {
    logger.error({ error, adminId, organizationId }, 'Failed to invite member');

    if (error.message === 'FORBIDDEN') {
      return res.status(403).json({ error: 'Only admins can invite members' });
    }
    if (error.code === '23505' || (error as any).cause?.code === '23505') {
      return res.status(409).json({ error: 'User is already a member of this organization' });
    }

    throw error;
  }
}
