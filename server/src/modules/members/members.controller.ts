import { Request, Response } from 'express';
import { membersService } from './members.service.js';
import { updateMemberRoleSchema } from '#shared/index.js';

export class MembersController {
  async list(req: Request, res: Response) {
    const organizationId = req.organizationId as string;
    const members = await membersService.listMembers(organizationId);
    res.json(members);
  }

  async updateRole(req: Request, res: Response) {
    const { id: targetUserId } = req.params;
    const organizationId = req.organizationId as string;
    const adminId = req.authSession.user.id;
    const data = updateMemberRoleSchema.parse(req.body);

    const updated = await membersService.updateRole(
      organizationId,
      adminId,
      targetUserId as string,
      data,
    );
    res.json(updated);
  }

  async remove(req: Request, res: Response) {
    const { id: targetUserId } = req.params;
    const organizationId = req.organizationId as string;
    const adminId = req.authSession.user.id;

    const result = await membersService.removeMember(
      organizationId,
      adminId,
      targetUserId as string,
    );
    res.json(result);
  }
}

export const membersController = new MembersController();
