import { Request, Response } from 'express';
import { rolesService } from './roles.service.js';
import { createRoleSchema, updateRoleSchema } from '#shared/index.js';
import { AppError } from '../../utils/AppError.js';

export class RolesController {
  async list(req: Request, res: Response) {
    const organizationId = req.organizationId as string;
    const roles = await rolesService.listRoles(organizationId);
    res.json(roles);
  }

  async get(req: Request, res: Response) {
    const { id } = req.params;
    const organizationId = req.organizationId as string;
    const role = await rolesService.getRole(id as string, organizationId);
    if (!role) throw new AppError('Role not found', 404);
    res.json(role);
  }

  async create(req: Request, res: Response) {
    const organizationId = req.organizationId as string;
    const userId = req.authSession.user.id;
    const data = createRoleSchema.parse(req.body);

    const newRole = await rolesService.createRole(organizationId, userId, data);
    res.status(201).json(newRole);
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const organizationId = req.organizationId as string;
    const userId = req.authSession.user.id;
    const data = updateRoleSchema.parse(req.body);

    const updated = await rolesService.updateRole(id as string, organizationId, userId, data);
    res.json(updated);
  }

  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const organizationId = req.organizationId as string;
    const userId = req.authSession.user.id;

    await rolesService.deleteRole(id as string, organizationId, userId);
    res.status(204).end();
  }
}

export const rolesController = new RolesController();
