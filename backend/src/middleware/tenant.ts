import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      tenantId: string;
    }
  }
}

export function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  const tenantId = req.user?.tenantId || req.header('X-Tenant-Id')?.toString();

  if (!tenantId) {
     return res.status(400).json({ error: 'Não foi possível identificar a empresa desta requisição.' });
  }

  req.tenantId = tenantId;
  next();
}
