import { Router } from 'express';
import { prisma } from '../prisma';
import { withFallback } from '../utils/dbFallback';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', async (req, res) => {
  if (!req.authUser) {
    return requireAuth(req, res, () => undefined);
  }

  const searchTerm = typeof req.query.q === 'string' ? req.query.q.trim() : '';

  const clients = await withFallback(
    () =>
      prisma.client.findMany({
        where: {
          tenantId: req.tenantId,
          ...(searchTerm
            ? {
                name: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              }
            : {}),
        },
        orderBy: { name: 'asc' },
      }),
    () => [],
  );

  res.json(clients);
});

router.post('/', async (req, res) => {
  if (!req.authUser) {
    return requireAuth(req, res, () => undefined);
  }

  const rawName = typeof req.body?.name === 'string' ? req.body.name.trim() : '';

  if (!rawName) {
    return res.status(400).json({ error: 'Informe o nome do cliente.' });
  }

  const existingClient = await prisma.client.findFirst({
    where: {
      tenantId: req.tenantId,
      name: {
        equals: rawName,
        mode: 'insensitive',
      },
    },
  });

  if (existingClient) {
    return res.json(existingClient);
  }

  const client = await prisma.client.create({
    data: {
      tenantId: req.tenantId,
      name: rawName,
    },
  });

  res.status(201).json(client);
});

export default router;