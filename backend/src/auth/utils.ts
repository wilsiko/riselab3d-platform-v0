import crypto from 'crypto';

export function sha256(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function createOpaqueToken() {
  return crypto.randomBytes(32).toString('hex');
}

function normalizeOrigin(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return value.replace(/\/+$/, '');
  }
}

export function getBaseUrl(req: { protocol: string; get(name: string): string | undefined }) {
  return process.env.APP_BASE_URL || `${req.protocol}://${req.get('host')}`;
}

export function getFrontendBaseUrl(req: { protocol: string; get(name: string): string | undefined }) {
  const configuredFrontendUrl = process.env.FRONTEND_URL;

  if (configuredFrontendUrl) {
    return normalizeOrigin(configuredFrontendUrl);
  }

  const requestOrigin = req.get('origin');

  if (requestOrigin) {
    return normalizeOrigin(requestOrigin);
  }

  return getBaseUrl(req);
}
