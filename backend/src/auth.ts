import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const PLATFORM_ADMIN_EMAIL = 'admin@riselab3d.com.br';
export const PLATFORM_ADMIN_ROLE = 'platform_admin';
export const CLIENT_ROLE = 'client';

export type UserRole = typeof PLATFORM_ADMIN_ROLE | typeof CLIENT_ROLE;

export interface AuthTokenPayload {
  sub: string;
  email: string;
  tenantId: string;
  role: UserRole;
}

const DEFAULT_JWT_SECRET = 'riselab3d-dev-secret';
const TOKEN_EXPIRATION = '8h';

function getJwtSecret() {
  return process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signAuthToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: TOKEN_EXPIRATION,
  });
}

export function verifyAuthToken(token: string) {
  return jwt.verify(token, getJwtSecret()) as AuthTokenPayload;
}

export function isPlatformAdminEmail(email: string) {
  return email.trim().toLowerCase() === PLATFORM_ADMIN_EMAIL;
}

export function isPlatformAdminRole(role: string) {
  return role === PLATFORM_ADMIN_ROLE;
}