import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      tenantId: string;
      authUser?: {
        id: string;
        tenantId: string;
        email: string;
        name: string | null;
        emailVerifiedAt: Date | null;
        mustChangePassword: boolean;
      } | null;
    }
  }
}

export function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  const publicTenantId = process.env.PUBLIC_TENANT_ID || 'tenant_1';
  const tenantId = req.authUser?.tenantId || (req.header('X-Tenant-Id') || publicTenantId).toString();

  if (!tenantId) {
    return res.status(400).json({ error: 'Tenant ID is required in X-Tenant-Id header.' });
  }

  req.tenantId = tenantId;
  next();
}
