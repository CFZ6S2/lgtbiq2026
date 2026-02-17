import { ZodError } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = {
        body: req.body,
        query: req.query,
        params: req.params,
      };
      if (schema && typeof schema.parse === 'function') {
        schema.parse(data.body ?? data.query ?? data.params);
      }
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          error: 'Error de validación',
          details: err.errors.map(e => ({ path: e.path.join('.'), message: e.message })),
        });
        return;
      }
      return next(err as any);
    }
  };
};
