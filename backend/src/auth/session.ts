import { Response, Request, NextFunction } from 'express';
import { prisma } from '../prisma';
import { AUTH_COOKIE_NAME, SESSION_TTL_MS } from './constants';
import { createOpaqueToken, sha256 } from './utils';

function getCookieOptions() {
  const isSecure = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isSecure,
    path: '/',
    maxAge: SESSION_TTL_MS,
  };
}

export async function attachAuthUser(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[AUTH_COOKIE_NAME];

  if (!token) {
    req.authUser = null;
    return next();
  }

  const session = await prisma.authSession.findFirst({
    where: {
      tokenHash: sha256(token),
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      user: true,
    },
  });

  if (!session) {
    req.authUser = null;
    return next();
  }

  req.authUser = {
    id: session.user.id,
    tenantId: session.user.tenantId,
    email: session.user.email,
    name: session.user.name,
    emailVerifiedAt: session.user.emailVerifiedAt,
  };

  next();
}

export async function createSession(res: Response, userId: string, tenantId: string) {
  const token = createOpaqueToken();

  await prisma.authSession.create({
    data: {
      userId,
      tenantId,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });

  res.cookie(AUTH_COOKIE_NAME, token, getCookieOptions());
}

export async function clearSession(req: Request, res: Response) {
  const token = req.cookies?.[AUTH_COOKIE_NAME];

  if (token) {
    await prisma.authSession.deleteMany({ where: { tokenHash: sha256(token) } });
  }

  res.clearCookie(AUTH_COOKIE_NAME, getCookieOptions());
}
