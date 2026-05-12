import { Request, Response } from 'express';
import { rbacService } from './rbac.service.js';

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
}

export const rbacController = new RBACController();
