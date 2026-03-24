import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';

export function validate(schema: ZodType<any, any, any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        issues: result.error.issues,
      });
    }

    req.body = result.data;
    next();
  };
}
