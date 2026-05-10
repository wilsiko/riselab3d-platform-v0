import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../prisma';
import { createSession, clearSession } from '../auth/session';
import { EMAIL_VERIFICATION_TTL_MS } from '../auth/constants';
import { createOpaqueToken, getBaseUrl, sha256 } from '../auth/utils';
import { provisionTenantForUser } from '../auth/bootstrap';
import { sendVerificationEmail } from '../auth/email';

const router = Router();

function serializeUser(user: { id: string; tenantId: string; email: string; name: string | null; emailVerifiedAt: Date | null }) {
  return {
    id: user.id,
    tenantId: user.tenantId,
    email: user.email,
    name: user.name,
    emailVerified: Boolean(user.emailVerifiedAt),
  };
}

async function createVerificationToken(userId: string, tenantId: string) {
  await prisma.emailVerificationToken.deleteMany({ where: { userId } });
  const token = createOpaqueToken();

  await prisma.emailVerificationToken.create({
    data: {
      userId,
      tenantId,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
    },
  });

  return token;
}

router.get('/me', async (req, res) => {
  if (!req.authUser) {
    return res.json({ user: null });
  }

  const user = await prisma.user.findUnique({ where: { id: req.authUser.id } });

  if (!user) {
    return res.json({ user: null });
  }

  return res.json({ user: serializeUser(user) });
});

router.post('/register', async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!email || !password) {
    return res.status(400).json({ error: 'Informe nome, e-mail e senha para criar a conta.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'A senha precisa ter ao menos 8 caracteres.' });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    return res.status(409).json({ error: 'Ja existe uma conta com este e-mail.' });
  }

  const tenant = await provisionTenantForUser(name, email);
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: name || email.split('@')[0],
      email,
      password: passwordHash,
    },
  });

  const verificationToken = await createVerificationToken(user.id, user.tenantId);
  const verificationUrl = `${getBaseUrl(req)}/api/auth/verify-email?token=${verificationToken}`;
  await sendVerificationEmail(user.email, verificationUrl);

  return res.status(201).json({
    user: serializeUser(user),
    verificationPending: true,
    message: 'Conta criada. Verifique o e-mail para liberar o login por senha.',
  });
});

router.post('/login', async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!email || !password) {
    return res.status(400).json({ error: 'Informe e-mail e senha.' });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.password) {
    return res.status(401).json({ error: 'Credenciais invalidas.' });
  }

  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    return res.status(401).json({ error: 'Credenciais invalidas.' });
  }

  if (!user.emailVerifiedAt) {
    const verificationToken = await createVerificationToken(user.id, user.tenantId);
    const verificationUrl = `${getBaseUrl(req)}/api/auth/verify-email?token=${verificationToken}`;
    await sendVerificationEmail(user.email, verificationUrl);
    return res.status(403).json({ error: 'Confirme seu e-mail antes de entrar. Enviamos um novo link de verificacao.' });
  }

  await createSession(res, user.id, user.tenantId);
  return res.json({ user: serializeUser(user) });
});

router.post('/google', async (req, res) => {
  const idToken = typeof req.body?.idToken === 'string' ? req.body.idToken : '';

  if (!idToken) {
    return res.status(400).json({ error: 'Token do Google nao informado.' });
  }

  const googleClientId = process.env.GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    return res.status(503).json({ error: 'Google OAuth ainda nao configurado no servidor.' });
  }

  const client = new OAuth2Client(googleClientId);
  const ticket = await client.verifyIdToken({ idToken, audience: googleClientId });
  const payload = ticket.getPayload();

  if (!payload?.email || !payload.sub) {
    return res.status(400).json({ error: 'Nao foi possivel validar a conta Google.' });
  }

  let user = await prisma.user.findFirst({
    where: {
      OR: [{ googleId: payload.sub }, { email: payload.email.toLowerCase() }],
    },
  });

  if (!user) {
    const tenant = await provisionTenantForUser(payload.name || payload.email, payload.email.toLowerCase());
    user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: payload.email.toLowerCase(),
        name: payload.name || payload.email,
        googleId: payload.sub,
        emailVerifiedAt: payload.email_verified ? new Date() : null,
      },
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: user.googleId || payload.sub,
        name: user.name || payload.name || user.email,
        emailVerifiedAt: user.emailVerifiedAt || (payload.email_verified ? new Date() : null),
      },
    });
  }

  await createSession(res, user.id, user.tenantId);
  return res.json({ user: serializeUser(user) });
});

router.get('/verify-email', async (req, res) => {
  const token = typeof req.query?.token === 'string' ? req.query.token : '';

  if (!token) {
    return res.status(400).send('Token de verificacao ausente.');
  }

  const verification = await prisma.emailVerificationToken.findFirst({
    where: {
      tokenHash: sha256(token),
      expiresAt: { gt: new Date() },
    },
  });

  if (!verification) {
    return res.status(400).send('Link de verificacao invalido ou expirado.');
  }

  const user = await prisma.user.update({
    where: { id: verification.userId },
    data: { emailVerifiedAt: new Date() },
  });

  await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });
  await createSession(res, user.id, user.tenantId);

  const redirectUrl = `${process.env.FRONTEND_URL || getBaseUrl(req)}?verified=1`;
  return res.redirect(redirectUrl);
});

router.post('/logout', async (req, res) => {
  await clearSession(req, res);
  res.json({ ok: true });
});

export default router;