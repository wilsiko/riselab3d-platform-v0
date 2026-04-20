import { Router } from 'express';
import { prisma } from '../prisma';
import { isPlatformAdminRole } from '../auth';

const router = Router();

router.use((req, res, next) => {
  if (!req.user || !isPlatformAdminRole(req.user.role)) {
    return res.status(403).json({ error: 'Acesso restrito ao administrador da plataforma.' });
  }

  next();
});

router.get('/overview', async (_req, res) => {
  const activeProductsByTenantPromise = prisma.product.groupBy({
    by: ['tenantId'],
    where: { data_desativacao: null },
    _count: { _all: true },
  });

  const [
    accountsCount,
    tenantsCount,
    productsCount,
    quotesCount,
    printersCount,
    filamentsCount,
    quoteValueAggregate,
    recentAccountsCount,
    recentQuotesCount,
    latestAccounts,
    tenantHighlights,
    activeProductsByTenant,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.tenant.count(),
    prisma.product.count({ where: { data_desativacao: null } }),
    prisma.quote.count(),
    prisma.printer.count({ where: { data_desativacao: null } }),
    prisma.filament.count({ where: { data_desativacao: null } }),
    prisma.quote.aggregate({ _sum: { valor_total: true }, _avg: { valor_total: true } }),
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.quote.count({
      where: {
        data: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { tenant: true },
    }),
    prisma.tenant.findMany({
      take: 5,
      orderBy: {
        users: {
          _count: 'desc',
        },
      },
      include: {
        _count: {
          select: {
            users: true,
            quotes: true,
          },
        },
      },
    }),
    activeProductsByTenantPromise,
  ]);

  const activeProductsCountByTenantId = new Map(
    activeProductsByTenant.map((entry) => [entry.tenantId, entry._count._all]),
  );

  return res.json({
    metrics: {
      accountsCount,
      tenantsCount,
      productsCount,
      quotesCount,
      printersCount,
      filamentsCount,
      totalQuoteValue: quoteValueAggregate._sum.valor_total || 0,
      averageQuoteValue: quoteValueAggregate._avg.valor_total || 0,
      recentAccountsCount,
      recentQuotesCount,
    },
    latestAccounts: latestAccounts.map((account) => ({
      id: account.id,
      name: account.name,
      email: account.email,
      tenantName: account.tenant.name,
      createdAt: account.createdAt,
    })),
    tenantHighlights: tenantHighlights.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      usersCount: tenant._count.users,
      productsCount: activeProductsCountByTenantId.get(tenant.id) ?? 0,
      quotesCount: tenant._count.quotes,
    })),
  });
});

router.get('/printer-models', async (_req, res) => {
  const printerModels = await prisma.printerModel.findMany({ orderBy: { name: 'asc' } });

  return res.json(printerModels);
});

router.post('/printer-models', async (req, res) => {
  const name = String(req.body?.name || '').trim();
  const consumoWattsPadrao = Number(req.body?.consumoWattsPadrao);
  const vidaUtilHorasPadrao = Number(req.body?.vidaUtilHorasPadrao);

  if (!name) {
    return res.status(400).json({ error: 'O nome do modelo é obrigatório.' });
  }

  if (!Number.isFinite(consumoWattsPadrao) || consumoWattsPadrao <= 0) {
    return res.status(400).json({ error: 'O consumo padrão deve ser maior que zero.' });
  }

  if (!Number.isFinite(vidaUtilHorasPadrao) || vidaUtilHorasPadrao <= 0) {
    return res.status(400).json({ error: 'A vida útil padrão deve ser maior que zero.' });
  }

  const existingModel = await prisma.printerModel.findFirst({
    where: {
      name: {
        equals: name,
        mode: 'insensitive',
      },
    },
  });

  if (existingModel) {
    return res.status(409).json({ error: 'Já existe um modelo cadastrado com este nome.' });
  }

  const printerModel = await prisma.printerModel.create({
    data: { name, consumoWattsPadrao, vidaUtilHorasPadrao },
  });

  return res.status(201).json(printerModel);
});

router.put('/printer-models/:id', async (req, res) => {
  const name = String(req.body?.name || '').trim();
  const consumoWattsPadrao = Number(req.body?.consumoWattsPadrao);
  const vidaUtilHorasPadrao = Number(req.body?.vidaUtilHorasPadrao);

  if (!name) {
    return res.status(400).json({ error: 'O nome do modelo é obrigatório.' });
  }

  if (!Number.isFinite(consumoWattsPadrao) || consumoWattsPadrao <= 0) {
    return res.status(400).json({ error: 'O consumo padrão deve ser maior que zero.' });
  }

  if (!Number.isFinite(vidaUtilHorasPadrao) || vidaUtilHorasPadrao <= 0) {
    return res.status(400).json({ error: 'A vida útil padrão deve ser maior que zero.' });
  }

  const printerModel = await prisma.printerModel.findUnique({
    where: { id: req.params.id },
  });

  if (!printerModel) {
    return res.status(404).json({ error: 'Modelo de impressora não encontrado.' });
  }

  const existingModel = await prisma.printerModel.findFirst({
    where: {
      id: { not: printerModel.id },
      name: {
        equals: name,
        mode: 'insensitive',
      },
    },
  });

  if (existingModel) {
    return res.status(409).json({ error: 'Já existe um modelo cadastrado com este nome.' });
  }

  const updatedPrinterModel = await prisma.printerModel.update({
    where: { id: printerModel.id },
    data: { name, consumoWattsPadrao, vidaUtilHorasPadrao },
  });

  return res.json(updatedPrinterModel);
});

router.get('/product-colors', async (_req, res) => {
  const productColors = await prisma.productColor.findMany({ orderBy: { name: 'asc' } });

  return res.json(productColors);
});

router.post('/product-colors', async (req, res) => {
  const name = String(req.body?.name || '').trim();

  if (!name) {
    return res.status(400).json({ error: 'O nome da cor é obrigatório.' });
  }

  const existingColor = await prisma.productColor.findFirst({
    where: {
      name: {
        equals: name,
        mode: 'insensitive',
      },
    },
  });

  if (existingColor) {
    return res.status(409).json({ error: 'Já existe uma cor cadastrada com este nome.' });
  }

  const productColor = await prisma.productColor.create({
    data: { name },
  });

  return res.status(201).json(productColor);
});

router.put('/product-colors/:id', async (req, res) => {
  const name = String(req.body?.name || '').trim();

  if (!name) {
    return res.status(400).json({ error: 'O nome da cor é obrigatório.' });
  }

  const productColor = await prisma.productColor.findUnique({
    where: { id: req.params.id },
  });

  if (!productColor) {
    return res.status(404).json({ error: 'Cor não encontrada.' });
  }

  const existingColor = await prisma.productColor.findFirst({
    where: {
      id: { not: productColor.id },
      name: {
        equals: name,
        mode: 'insensitive',
      },
    },
  });

  if (existingColor) {
    return res.status(409).json({ error: 'Já existe uma cor cadastrada com este nome.' });
  }

  const updatedProductColor = await prisma.$transaction(async (transaction) => {
    const nextColor = await transaction.productColor.update({
      where: { id: productColor.id },
      data: { name },
    });

    await transaction.product.updateMany({
      where: {
        cor: {
          equals: productColor.name,
          mode: 'insensitive',
        },
      },
      data: { cor: name },
    });

    return nextColor;
  });

  return res.json(updatedProductColor);
});

router.delete('/product-colors/:id', async (req, res) => {
  const productColor = await prisma.productColor.findUnique({
    where: { id: req.params.id },
  });

  if (!productColor) {
    return res.status(404).json({ error: 'Cor não encontrada.' });
  }

  const productsUsingColor = await prisma.product.count({
    where: {
      cor: {
        equals: productColor.name,
        mode: 'insensitive',
      },
    },
  });

  if (productsUsingColor > 0) {
    return res.status(409).json({ error: 'Não é possível excluir uma cor que já está em uso nos produtos.' });
  }

  await prisma.productColor.delete({ where: { id: productColor.id } });

  return res.status(204).send();
});

export default router;