export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
  tenantName: string;
  isPlatformAdmin: boolean;
}

export interface AuthSession {
  token: string;
  user: SessionUser;
}

const AUTH_STORAGE_KEY = 'riselab3d.auth';
const WELCOME_GUIDE_STORAGE_PREFIX = 'riselab3d.welcome-guide.dismissed';
const PLATFORM_ADMIN_EMAIL = 'admin@riselab3d.com.br';

function getWelcomeGuideStorageKey(user: SessionUser) {
  return `${WELCOME_GUIDE_STORAGE_PREFIX}:${user.id || user.email.trim().toLowerCase()}`;
}

function normalizeSession(session: AuthSession): AuthSession {
  const normalizedRole = session.user.role ?? (session.user.isPlatformAdmin || session.user.email.trim().toLowerCase() === PLATFORM_ADMIN_EMAIL ? 'platform_admin' : 'client');

  return {
    ...session,
    user: {
      ...session.user,
      role: normalizedRole,
      isPlatformAdmin:
        session.user.isPlatformAdmin ?? normalizedRole === 'platform_admin',
    },
  };
}

export function loadSession(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return normalizeSession(JSON.parse(rawValue) as AuthSession);
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function saveSession(session: AuthSession) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalizeSession(session)));
}

export function clearSession() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function shouldShowWelcomeGuide(session: AuthSession): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.localStorage.getItem(getWelcomeGuideStorageKey(session.user)) !== '1';
}

export function dismissWelcomeGuide(session: AuthSession) {
  window.localStorage.setItem(getWelcomeGuideStorageKey(session.user), '1');
}