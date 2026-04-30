import { Request, Response } from 'express';
import { sequencesService } from './sequences.service.js';
import { updateDocumentSequenceSchema } from '#shared/contracts/sequences.contract.js';
import { logger } from '../../utils/logger.js';

export async function listSequences(req: Request, res: Response) {
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const results = await sequencesService.listSequences(organizationId);
    res.json(results);
  } catch (error) {
    logger.error({ error, organizationId, userId }, 'Failed to list sequences');
    throw error;
  }
}

export async function updateSequence(req: Request, res: Response) {
  const { id } = req.params;
  const parseResult = updateDocumentSequenceSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const updated = await sequencesService.updateSequence(
      organizationId,
      userId,
      id as string,
      parseResult.data,
    );

    if (!updated) {
      return res.status(404).json({ error: 'Sequence not found' });
    }

    res.json(updated);
  } catch (error) {
    logger.error({ error, organizationId, userId, id }, 'Failed to update sequence');
    throw error;
  }
}
