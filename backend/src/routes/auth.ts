import { Router } from 'express';
import { prisma } from '../prisma';
import { CLIENT_ROLE, PLATFORM_ADMIN_ROLE, hashPassword, isPlatformAdminRole, signAuthToken, verifyPassword } from '../auth';

const router = Router();

function buildAuthResponse(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
  tenant: { name: string };
}) {
  const token = signAuthToken({
    sub: user.id,
    email: user.email,
    tenantId: user.tenantId,
    role: user.role as typeof PLATFORM_ADMIN_ROLE | typeof CLIENT_ROLE,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      tenantName: user.tenant.name,
      isPlatformAdmin: isPlatformAdminRole(user.role),
    },
  };
}

router.post('/register', async (req, res) => {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
  }

  if (password.length < 8) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 8 caracteres.' });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
      return res.status(409).json({ error: 'Já existe uma conta cadastrada com este e-mail.' });
  }

  const passwordHash = await hashPassword(password);
    const tenantName = `${name.split(' ')[0]} Empresa`;

  const user = await prisma.$transaction(async (transaction) => {
    const tenant = await transaction.tenant.create({
      data: {
        name: tenantName,
        settings: {
          create: {
            custo_kwh: 1.05,
          },
        },
      },
    });

    return transaction.user.create({
      data: {
        name,
        email,
        password: passwordHash,
        role: CLIENT_ROLE,
        tenantId: tenant.id,
      },
      include: {
        tenant: true,
      },
    });
  });

  return res.status(201).json(buildAuthResponse(user));
});

router.post('/login', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (!email || !password) {
     return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { tenant: true },
  });

  if (!user) {
     return res.status(401).json({ error: 'Credenciais inválidas.' });
  }

  const isValidPassword = await verifyPassword(password, user.password);

  if (!isValidPassword) {
     return res.status(401).json({ error: 'Credenciais inválidas.' });
  }

  return res.json(buildAuthResponse(user));
});

export default router;