import { Router } from 'express';
import { prisma } from '../prisma';
import { withFallback, mockData } from '../utils/dbFallback';
import { parseDecimalValue } from '../utils/number';

const router = Router();

router.get('/', async (req, res) => {
  const includeInactive = req.query.includeInactive === 'true';
  const printers = await withFallback(
    () => prisma.printer.findMany({
      where: {
        tenantId: req.tenantId,
        ...(includeInactive ? {} : { data_desativacao: null }),
      },
      include: { model: true },
      orderBy: [{ data_desativacao: 'asc' }, { nome: 'asc' }],
    }),
    () => mockData.tenant1.printers.filter((printer) => includeInactive || !printer.data_desativacao),
  );
  res.json(printers);
});

router.post('/', async (req, res) => {
  const { nome, modelId, consumo_watts, custo_aquisicao, vida_util_horas } = req.body;
  const normalizedName = String(nome || '').trim();
  const consumoWatts = Number(consumo_watts);
  const custoAquisicao = parseDecimalValue(custo_aquisicao);
  const vidaUtilHoras = Number(vida_util_horas);

  if (!normalizedName || !modelId) {
    return res.status(400).json({ error: 'Nome e modelo da impressora são obrigatórios.' });
  }

  if (!Number.isFinite(consumoWatts) || consumoWatts <= 0 || !Number.isFinite(custoAquisicao) || custoAquisicao <= 0 || !Number.isFinite(vidaUtilHoras) || vidaUtilHoras <= 0) {
    return res.status(400).json({ error: 'Consumo, custo de aquisição e vida útil devem ser maiores que zero.' });
  }

  const printerModel = await prisma.printerModel.findUnique({ where: { id: modelId } });

  if (!printerModel) {
    return res.status(400).json({ error: 'O modelo de impressora selecionado é inválido.' });
  }

  const existingPrinter = await prisma.printer.findFirst({
    where: {
      tenantId: req.tenantId,
      data_desativacao: null,
      nome: {
        equals: normalizedName,
        mode: 'insensitive',
      },
    },
  });

  if (existingPrinter) {
    return res.status(409).json({ error: 'Já existe uma impressora cadastrada com este nome.' });
  }

  const printer = await prisma.printer.create({
    data: {
      tenantId: req.tenantId,
      nome: normalizedName,
      modelId,
      consumo_watts: consumoWatts,
      custo_aquisicao: custoAquisicao,
      vida_util_horas: vidaUtilHoras,
    },
    include: { model: true },
  });
  res.json(printer);
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, modelId, consumo_watts, custo_aquisicao, vida_util_horas } = req.body;
  const normalizedName = String(nome || '').trim();
  const consumoWatts = Number(consumo_watts);
  const custoAquisicao = parseDecimalValue(custo_aquisicao);
  const vidaUtilHoras = Number(vida_util_horas);

  if (!normalizedName || !modelId) {
    return res.status(400).json({ error: 'Nome e modelo da impressora são obrigatórios.' });
  }

  if (!Number.isFinite(consumoWatts) || consumoWatts <= 0 || !Number.isFinite(custoAquisicao) || custoAquisicao <= 0 || !Number.isFinite(vidaUtilHoras) || vidaUtilHoras <= 0) {
    return res.status(400).json({ error: 'Consumo, custo de aquisição e vida útil devem ser maiores que zero.' });
  }

  const printerModel = await prisma.printerModel.findUnique({ where: { id: modelId } });

  if (!printerModel) {
    return res.status(400).json({ error: 'O modelo de impressora selecionado é inválido.' });
  }

  const existingPrinter = await prisma.printer.findFirst({
    where: {
      tenantId: req.tenantId,
      id: { not: id },
      data_desativacao: null,
      nome: {
        equals: normalizedName,
        mode: 'insensitive',
      },
    },
  });

  if (existingPrinter) {
    return res.status(409).json({ error: 'Já existe uma impressora cadastrada com este nome.' });
  }

  const printer = await prisma.printer.updateMany({
    where: { id, tenantId: req.tenantId, data_desativacao: null },
    data: {
      nome: normalizedName,
      modelId,
      consumo_watts: consumoWatts,
      custo_aquisicao: custoAquisicao,
      vida_util_horas: vidaUtilHoras,
    },
  });
  if (!printer.count) {
      return res.status(404).json({ error: 'Impressora não encontrada' });
  }
  const updated = await prisma.printer.findUnique({ where: { id }, include: { model: true } });
  res.json(updated);
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const result = await prisma.printer.updateMany({
    where: { id, tenantId: req.tenantId, data_desativacao: null },
    data: { data_desativacao: new Date() },
  });

  if (!result.count) {
    return res.status(404).json({ error: 'Impressora não encontrada ou já desativada.' });
  }

  res.json({ removed: true });
});

router.patch('/:id/reactivate', async (req, res) => {
  const { id } = req.params;

  const printer = await prisma.printer.findFirst({
    where: { id, tenantId: req.tenantId },
    include: { model: true },
  });

  if (!printer) {
    return res.status(404).json({ error: 'Impressora não encontrada.' });
  }

  if (!printer.data_desativacao) {
    return res.status(400).json({ error: 'A impressora já está ativa.' });
  }

  const existingActivePrinter = await prisma.printer.findFirst({
    where: {
      tenantId: req.tenantId,
      id: { not: id },
      data_desativacao: null,
      nome: {
        equals: printer.nome,
        mode: 'insensitive',
      },
    },
  });

  if (existingActivePrinter) {
    return res.status(409).json({ error: 'Já existe uma impressora ativa cadastrada com este nome.' });
  }

  const updated = await prisma.printer.update({
    where: { id },
    data: { data_desativacao: null },
    include: { model: true },
  });

  res.json(updated);
});

export default router;
