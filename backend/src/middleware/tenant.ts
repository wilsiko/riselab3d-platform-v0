import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      tenantId: string;
    }
  }
}

export function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  const tenantId = (req.header('X-Tenant-Id') || 'tenant_1').toString();

  if (!tenantId) {
    return res.status(400).json({ error: 'Tenant ID is required in X-Tenant-Id header.' });
  }

  req.tenantId = tenantId;
  next();
}
