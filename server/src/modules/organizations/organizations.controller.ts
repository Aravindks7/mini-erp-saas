import { Request, Response } from 'express';
import { organizationsService } from './organizations.service.js';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  updateMemberRoleSchema,
  inviteMemberSchema,
} from '#shared/contracts/organizations.contract.js';
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

export async function addMember(req: Request, res: Response) {
  const { organizationId } = req.params;
  const adminId = req.authSession.user.id;

  const parseResult = inviteMemberSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const { userEmail, roleId } = parseResult.data;

  if (!organizationId || typeof organizationId !== 'string') {
    return res.status(400).json({ error: 'Valid organizationId parameter is required' });
  }

  try {
    await organizationsService.addMember({
      adminId,
      organizationId,
      userEmail,
      roleId,
    });

    res.status(201).json({ message: 'Member added successfully' });
  } catch (error: unknown) {
    const dbError = error as DbError;
    const err = error as Error;
    logger.error({ error, adminId, organizationId }, 'Failed to add member');

    if (err.message === 'FORBIDDEN') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    if (err.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ error: 'User not found' });
    }
    if (dbError.code === '23505' || dbError.cause?.code === '23505') {
      return res.status(409).json({ error: 'User is already a member of this organization' });
    }

    throw error;
  }
}

export async function inviteMember(req: Request, res: Response) {
  const { organizationId } = req.params;
  const adminId = req.authSession.user.id;

  const parseResult = inviteMemberSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const { userEmail, roleId } = parseResult.data;

  if (!organizationId || typeof organizationId !== 'string') {
    return res.status(400).json({ error: 'Valid organizationId parameter is required' });
  }

  try {
    const result = await organizationsService.inviteMember({
      adminId,
      organizationId,
      userEmail,
      roleId,
    });

    if ('invited' in result && result.invited) {
      return res.status(201).json({ message: 'Invitation sent successfully' });
    }

    res.status(201).json({ message: 'Member added successfully' });
  } catch (error: unknown) {
    const dbError = error as DbError;
    const err = error as Error;
    logger.error({ error, adminId, organizationId }, 'Failed to invite member');

    if (err.message === 'FORBIDDEN') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    if (dbError.code === '23505' || dbError.cause?.code === '23505') {
      return res.status(409).json({ error: 'User is already a member of this organization' });
    }

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
    const err = error as Error;
    logger.error({ error, adminId, organizationId }, 'Failed to update organization');

    if (err.message === 'FORBIDDEN') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    if (err.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'Organization not found' });
    }
    throw error;
  }
}

export async function deleteOrganization(req: Request, res: Response) {
  const { organizationId } = req.params as { organizationId: string };
  const adminId = req.authSession.user.id;

  try {
    await organizationsService.deleteOrganization(adminId, organizationId);
    res.json({ message: 'Organization deleted successfully' });
  } catch (error) {
    const err = error as Error;
    logger.error({ error, adminId, organizationId }, 'Failed to delete organization');

    if (err.message === 'FORBIDDEN') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    if (err.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'Organization not found' });
    }
    throw error;
  }
}

export async function listMembers(req: Request, res: Response) {
  const { organizationId } = req.params as { organizationId: string };

  try {
    const members = await organizationsService.listMembers(organizationId);
    res.json(members);
  } catch (error) {
    logger.error({ error, organizationId }, 'Failed to list members');
    throw error;
  }
}

export async function updateMemberRole(req: Request, res: Response) {
  const { organizationId, userId } = req.params as { organizationId: string; userId: string };
  const adminId = req.authSession.user.id;
  const parseResult = updateMemberRoleSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  try {
    await organizationsService.updateMemberRole({
      adminId,
      organizationId,
      targetUserId: userId,
      roleId: parseResult.data.roleId,
    });
    res.json({ message: 'Member role updated successfully' });
  } catch (error) {
    const err = error as Error;
    logger.error({ error, adminId, organizationId, userId }, 'Failed to update member role');

    if (err.message === 'FORBIDDEN') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    if (err.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'Member not found' });
    }
    if (err.message === 'LAST_ADMIN_LOCKOUT') {
      return res
        .status(400)
        .json({ error: 'Cannot remove the last member with management permissions' });
    }
    throw error;
  }
}

export async function removeMember(req: Request, res: Response) {
  const { organizationId, userId } = req.params as { organizationId: string; userId: string };
  const adminId = req.authSession.user.id;

  try {
    await organizationsService.removeMember({
      adminId,
      organizationId,
      targetUserId: userId,
    });
    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    const err = error as Error;
    logger.error({ error, adminId, organizationId, userId }, 'Failed to remove member');

    if (err.message === 'FORBIDDEN') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    if (err.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'Member not found' });
    }
    if (err.message === 'LAST_ADMIN_LOCKOUT') {
      return res
        .status(400)
        .json({ error: 'Cannot remove the last member with management permissions' });
    }
    throw error;
  }
}

export async function resendInvite(req: Request, res: Response) {
  const { organizationId, inviteId } = req.params as { organizationId: string; inviteId: string };
  const adminId = req.authSession.user.id;

  try {
    await organizationsService.resendInvite({
      adminId,
      organizationId,
      inviteId,
    });
    res.json({ message: 'Invitation resent successfully' });
  } catch (error) {
    const err = error as Error;
    logger.error({ error, adminId, organizationId, inviteId }, 'Failed to resend invite');

    if (err.message === 'FORBIDDEN') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    if (err.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'Invitation not found' });
    }
    throw error;
  }
}

export async function cancelInvite(req: Request, res: Response) {
  const { organizationId, inviteId } = req.params as { organizationId: string; inviteId: string };
  const adminId = req.authSession.user.id;

  try {
    await organizationsService.cancelInvite({
      adminId,
      organizationId,
      inviteId,
    });
    res.json({ message: 'Invitation cancelled successfully' });
  } catch (error) {
    const err = error as Error;
    logger.error({ error, adminId, organizationId, inviteId }, 'Failed to cancel invite');

    if (err.message === 'FORBIDDEN') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    if (err.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'Invitation not found' });
    }
    throw error;
  }
}

export async function listInvites(req: Request, res: Response) {
  const { organizationId } = req.params as { organizationId: string };
  const adminId = req.authSession.user.id;

  try {
    const invites = await organizationsService.listInvites(adminId, organizationId);
    res.json(invites);
  } catch (error) {
    const err = error as Error;
    logger.error({ error, adminId, organizationId }, 'Failed to list invites');
    if (err.message === 'FORBIDDEN') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    throw error;
  }
}
