import { Request, Response, NextFunction } from 'express';
import { verifyAuthToken } from '../auth';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        tenantId: string;
        role: string;
      };
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authorization = req.header('Authorization');

  if (!authorization?.startsWith('Bearer ')) {
     return res.status(401).json({ error: 'O token de autorização é obrigatório.' });
  }

  const token = authorization.slice('Bearer '.length).trim();

  try {
    const payload = verifyAuthToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId,
      role: payload.role,
    };
    next();
  } catch {
     return res.status(401).json({ error: 'O token de autorização é inválido ou expirou.' });
  }
}