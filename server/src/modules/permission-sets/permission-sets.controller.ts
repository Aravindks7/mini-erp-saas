import { Request, Response } from 'express';
import { permissionSetsService } from './permission-sets.service.js';
import { createPermissionSetSchema, updatePermissionSetSchema } from '#shared/index.js';
import { AppError } from '../../utils/AppError.js';

export class PermissionSetsController {
  async list(req: Request, res: Response) {
    const organizationId = req.organizationId as string;
    const sets = await permissionSetsService.listPermissionSets(organizationId);
    res.json(sets);
  }

  async get(req: Request, res: Response) {
    const { id } = req.params;
    const organizationId = req.organizationId as string;
    const set = await permissionSetsService.getPermissionSet(id as string, organizationId);
    if (!set) throw new AppError('Permission set not found', 404);
    res.json(set);
  }

  async create(req: Request, res: Response) {
    const organizationId = req.organizationId as string;
    const userId = req.authSession.user.id;
    const data = createPermissionSetSchema.parse(req.body);

    const newSet = await permissionSetsService.createPermissionSet(organizationId, userId, data);
    res.status(201).json(newSet);
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const organizationId = req.organizationId as string;
    const userId = req.authSession.user.id;
    const data = updatePermissionSetSchema.parse(req.body);

    const updated = await permissionSetsService.updatePermissionSet(
      id as string,
      organizationId,
      userId,
      data,
    );
    res.json(updated);
  }

  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const organizationId = req.organizationId as string;
    const userId = req.authSession.user.id;

    await permissionSetsService.deletePermissionSet(id as string, organizationId, userId);
    res.status(204).end();
  }
}

export const permissionSetsController = new PermissionSetsController();
