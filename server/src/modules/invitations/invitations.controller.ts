import { Request, Response } from 'express';
import { invitationsService } from './invitations.service.js';
import { inviteMemberSchema } from '#shared/index.js';

export class InvitationsController {
  async list(req: Request, res: Response) {
    const organizationId = req.organizationId as string;
    const invites = await invitationsService.listInvites(organizationId);
    res.json(invites);
  }

  async invite(req: Request, res: Response) {
    const organizationId = req.organizationId as string;
    const adminId = req.authSession.user.id;
    const data = inviteMemberSchema.parse(req.body);

    const result = await invitationsService.inviteMember(organizationId, adminId, data);
    res.status(201).json(result);
  }

  async resend(req: Request, res: Response) {
    const { id } = req.params;
    const organizationId = req.organizationId as string;
    const adminId = req.authSession.user.id;

    const result = await invitationsService.resendInvite(organizationId, adminId, id as string);
    res.json(result);
  }

  async cancel(req: Request, res: Response) {
    const { id } = req.params;
    const organizationId = req.organizationId as string;
    const adminId = req.authSession.user.id;

    const result = await invitationsService.cancelInvite(organizationId, adminId, id as string);
    res.json(result);
  }
}

export const invitationsController = new InvitationsController();
