import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function errorMiddleware(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof Error) {
    logger.error({ err }, err.message);

    return res.status(500).json({
      error: err.message,
    });
  }

  logger.error('Unknown error occurred');

  res.status(500).json({
    error: 'Internal Server Error',
  });
}
