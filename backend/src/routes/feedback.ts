import { Router } from 'express';
import { prisma } from '../prisma';
import { withFallback, mockData } from '../utils/dbFallback';

const router = Router();

router.get('/', async (req, res) => {
  const feedbacks = await withFallback(
    () =>
      prisma.feedback.findMany({
        where: { tenantId: req.tenantId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    () => mockData.tenant1.feedbacks || [],
  );

  return res.json(feedbacks);
});

router.post('/', async (req, res) => {
  const category = String(req.body?.category || '').trim();
  const subject = String(req.body?.subject || '').trim();
  const message = String(req.body?.message || '').trim();

  if (!category || !subject || !message) {
    return res.status(400).json({ error: 'Categoria, assunto e mensagem são obrigatórios.' });
  }

  const feedback = await prisma.feedback.create({
    data: {
      tenantId: req.tenantId,
      userId: req.user?.id,
      category,
      subject,
      message,
    },
  });

  return res.status(201).json(feedback);
});

export default router;