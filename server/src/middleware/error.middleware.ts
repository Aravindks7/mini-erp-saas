import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';
import { AppError } from '../utils/AppError';

export function errorMiddleware(
  err: Error | AppError | ZodError | unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Delegate to Express default error handler if headers have already been sent
  if (res.headersSent) {
    return next(err);
  }

  // Common request context for enriched logging
  const reqContext = {
    method: req.method,
    url: req.originalUrl,
    // Safely log if a body exists without logging the body payload
    hasBody: !!req.body && Object.keys(req.body).length > 0,
  };

  if (err instanceof AppError) {
    logger.warn(
      { err: err.message, statusCode: err.statusCode, ...reqContext },
      'AppError operational error',
    );
    return res.status(err.statusCode).json({
      status: err.status,
      error: err.message,
    });
  }

  if (err instanceof ZodError) {
    logger.warn({ issues: err.issues, ...reqContext }, 'Validation error');
    return res.status(400).json({
      status: 'fail',
      error: 'Validation failed',
      issues: err.issues,
    });
  }

  // Safe Database Error handling
  const isDbError = (e: any): e is { code: string } => {
    return (
      e !== null &&
      typeof e === 'object' &&
      ('code' in e || (e.cause && typeof e.cause === 'object' && 'code' in e.cause))
    );
  };

  if (isDbError(err)) {
    const dbErrCode = (err as any).code || (err as any).cause?.code;
    const dbErrMessage = (err as any).message || (err as any).cause?.message || 'Database error';
    const dbErrDetail = (err as any).detail || (err as any).cause?.detail || '';

    // 23505: Unique constraint violation
    if (dbErrCode === '23505') {
      logger.warn(
        { err: dbErrMessage, detail: dbErrDetail, ...reqContext },
        'Database unique constraint violation',
      );
      return res.status(409).json({
        status: 'fail',
        error: 'Conflict: Record already exists.',
      });
    }

    // 23503: Foreign key violation
    if (dbErrCode === '23503') {
      logger.warn(
        { err: dbErrMessage, detail: dbErrDetail, ...reqContext },
        'Database foreign key violation',
      );
      return res.status(400).json({
        status: 'fail',
        error: 'Bad Request: Invalid reference provided.',
      });
    }

    // 40001: Serialization failure / 40P01: Deadlock detected
    if (dbErrCode === '40001' || dbErrCode === '40P01') {
      logger.error(
        { err: dbErrMessage, detail: dbErrDetail, ...reqContext },
        'Database transaction serialization/deadlock failure',
      );
      return res.status(503).json({
        status: 'error',
        error: 'Service Unavailable: Please retry the request.',
      });
    }
  }

  if (err instanceof Error) {
    logger.error({ err, ...reqContext }, `Unhandled error: ${err.message}`);

    // In production, do not send stack traces to the client
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({
      status: 'error',
      error: isProd ? 'Internal Server Error' : err.message,
      ...(isProd ? {} : { stack: err.stack }),
    });
  }

  logger.error({ err, ...reqContext }, 'Unknown error occurred');

  res.status(500).json({
    status: 'error',
    error: 'Internal Server Error',
  });
}
