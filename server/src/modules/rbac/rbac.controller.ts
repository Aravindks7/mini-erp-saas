import { Request, Response } from 'express';
import { rbacService } from './rbac.service.js';
import {
  createPermissionSetSchema,
  createRoleSchema,
  updatePermissionSetSchema,
  updateRoleSchema,
} from '#shared/contracts/rbac.contract.js';
import { logger } from '../../utils/logger.js';
import { AppError } from '../../utils/AppError.js';

export class RBACController {
  /**
   * Returns all permissions for the currently authenticated user in the active tenant.
   */
  async getMyPermissions(req: Request, res: Response): Promise<void> {
    if (!req.permissions) {
      res.status(500).json({ error: 'Permissions not resolved' });
      return;
    }

    res.json({
      permissions: req.permissions.all(),
    });
  }

  /**
   * List all available granular permissions (Static).
   */
  async listAllPermissions(req: Request, res: Response): Promise<void> {
    const permissions = await rbacService.listAllPermissions();
    res.json(permissions);
  }

  /**
   * List permission sets for an organization.
   */
  async listPermissionSets(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId;
    const sets = await rbacService.listPermissionSets(orgId);
    res.json(sets);
  }

  /**
   * Get a single permission set.
   */
  async getPermissionSet(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId;
    const { id } = req.params;
    const set = await rbacService.getPermissionSet(id as string, orgId);
    if (!set) {
      res.status(404).json({ error: 'Permission set not found' });
      return;
    }
    res.json(set);
  }

  /**
   * Create a permission set.
   */
  async createPermissionSet(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId;
    const parseResult = createPermissionSetSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.flatten() });
      return;
    }

    try {
      const newSet = await rbacService.createPermissionSet(orgId, parseResult.data);
      res.status(201).json(newSet);
    } catch (error) {
      logger.error({ error, orgId }, 'Failed to create permission set');
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update a permission set.
   */
  async updatePermissionSet(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId;
    const { id } = req.params;
    const parseResult = updatePermissionSetSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.flatten() });
      return;
    }

    try {
      const updatedSet = await rbacService.updatePermissionSet(
        id as string,
        orgId,
        parseResult.data,
      );
      res.json(updatedSet);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      logger.error({ error, orgId, id }, 'Failed to update permission set');
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Delete a permission set.
   */
  async deletePermissionSet(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId;
    const { id } = req.params;

    try {
      await rbacService.deletePermissionSet(id as string, orgId);
      res.status(204).send();
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      logger.error({ error, orgId, id }, 'Failed to delete permission set');
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * List roles for an organization.
   */
  async listRoles(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId;
    const roles = await rbacService.listRoles(orgId);
    res.json(roles);
  }

  /**
   * Get a single role.
   */
  async getRole(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId;
    const { id } = req.params;
    const role = await rbacService.getRole(id as string, orgId);
    if (!role) {
      res.status(404).json({ error: 'Role not found' });
      return;
    }
    res.json(role);
  }

  /**
   * Create a role.
   */
  async createRole(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId;
    const parseResult = createRoleSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.flatten() });
      return;
    }

    try {
      const newRole = await rbacService.createRole(orgId, parseResult.data);
      res.status(201).json(newRole);
    } catch (error) {
      logger.error({ error, orgId }, 'Failed to create role');
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update a role.
   */
  async updateRole(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId;
    const { id } = req.params;
    const parseResult = updateRoleSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.flatten() });
      return;
    }

    try {
      const updatedRole = await rbacService.updateRole(id as string, orgId, parseResult.data);
      res.json(updatedRole);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      logger.error({ error, orgId, id }, 'Failed to update role');
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Delete a role.
   */
  async deleteRole(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId;
    const { id } = req.params;

    try {
      await rbacService.deleteRole(id as string, orgId);
      res.status(204).send();
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      logger.error({ error, orgId, id }, 'Failed to delete role');
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export const rbacController = new RBACController();
