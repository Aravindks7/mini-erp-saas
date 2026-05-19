import { Request, Response } from 'express';
import { currenciesService } from './currencies.service.js';
import {
  createCurrencySchema,
  updateCurrencySchema,
} from '#shared/contracts/currencies.contract.js';

/**
 * Currencies Controller
 *
 * Handles HTTP requests for currency management.
 * Strictly follows the platform's authentication and multi-tenancy patterns.
 */
export const currenciesController = {
  async listCurrencies(req: Request, res: Response) {
    const organizationId = req.organizationId!;
    const result = await currenciesService.listCurrencies(organizationId);
    res.json(result);
  },

  async getCurrency(req: Request, res: Response) {
    const organizationId = req.organizationId!;
    const id = req.params.id as string;
    const result = await currenciesService.getCurrencyById(organizationId, id);
    if (!result) {
      return res.status(404).json({ message: 'Currency not found' });
    }
    res.json(result);
  },

  async createCurrency(req: Request, res: Response) {
    const organizationId = req.organizationId!;
    const userId = req.authSession.user.id;

    const validation = createCurrencySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.issues });
    }

    try {
      const result = await currenciesService.createCurrency(
        organizationId,
        userId,
        validation.data,
      );
      res.status(201).json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ message });
    }
  },

  async updateCurrency(req: Request, res: Response) {
    const organizationId = req.organizationId!;
    const userId = req.authSession.user.id;
    const { id } = req.params;

    const validation = updateCurrencySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.issues });
    }

    try {
      const result = await currenciesService.updateCurrency(
        organizationId,
        userId,
        id as string,
        validation.data,
      );
      if (!result) {
        return res.status(404).json({ message: 'Currency not found' });
      }
      res.json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ message });
    }
  },

  async deleteCurrency(req: Request, res: Response) {
    const organizationId = req.organizationId!;
    const userId = req.authSession.user.id;
    const id = req.params.id as string;

    try {
      const result = await currenciesService.deleteCurrency(organizationId, userId, id);
      if (!result) {
        return res.status(404).json({ message: 'Currency not found' });
      }
      res.json({ message: 'Currency deleted successfully' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ message });
    }
  },

  async bulkDeleteCurrencies(req: Request, res: Response) {
    const organizationId = req.organizationId!;
    const userId = req.authSession.user.id;
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Invalid or empty IDs array' });
    }

    try {
      await currenciesService.bulkDeleteCurrencies(organizationId, userId, ids);
      res.json({ message: `${ids.length} currencies deleted successfully` });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ message });
    }
  },
};
