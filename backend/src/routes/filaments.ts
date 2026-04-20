import { Router } from 'express';
import { prisma } from '../prisma';
import { withFallback, mockData } from '../utils/dbFallback';
import { parseDecimalValue } from '../utils/number';

const router = Router();

router.get('/', async (req, res) => {
  const includeInactive = req.query.includeInactive === 'true';
  const filaments = await withFallback(
    () => prisma.filament.findMany({
      where: {
        tenantId: req.tenantId,
        ...(includeInactive ? {} : { data_desativacao: null }),
      },
      orderBy: [{ data_desativacao: 'asc' }, { data_compra: 'desc' }, { marca: 'asc' }],
    }),
    () => mockData.tenant1.filaments.filter((filament) => includeInactive || !filament.data_desativacao),
  );
  res.json(filaments);
});

router.post('/', async (req, res) => {
  const { marca, lote, data_compra, tipo, custo_por_kg } = req.body;
  const custoPorKg = parseDecimalValue(custo_por_kg);
  const purchaseDate = data_compra ? new Date(data_compra) : null;

  if (!marca || !lote || !data_compra || !tipo || !Number.isFinite(custoPorKg) || custoPorKg <= 0 || !purchaseDate || Number.isNaN(purchaseDate.getTime())) {
    return res.status(400).json({ error: 'Marca, lote, data de compra, tipo e custo por kg válido são obrigatórios.' });
  }

  const existingFilament = await prisma.filament.findFirst({
    where: {
      tenantId: req.tenantId,
      data_desativacao: null,
      marca,
      lote,
      data_compra: purchaseDate,
    },
  });

  if (existingFilament) {
    return res.status(409).json({ error: 'Já existe um filamento com esta marca, lote e data de compra.' });
  }

  const filament = await prisma.filament.create({
    data: {
      tenantId: req.tenantId,
      marca,
      lote,
      data_compra: purchaseDate,
      tipo,
      custo_por_kg: custoPorKg,
    },
  });
  res.json(filament);
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { marca, lote, data_compra, tipo, custo_por_kg } = req.body;
  const custoPorKg = parseDecimalValue(custo_por_kg);
  const purchaseDate = data_compra ? new Date(data_compra) : null;

  if (!marca || !lote || !data_compra || !tipo || !Number.isFinite(custoPorKg) || custoPorKg <= 0 || !purchaseDate || Number.isNaN(purchaseDate.getTime())) {
    return res.status(400).json({ error: 'Marca, lote, data de compra, tipo e custo por kg válido são obrigatórios.' });
  }

  const existingFilament = await prisma.filament.findFirst({
    where: {
      tenantId: req.tenantId,
      id: { not: id },
      data_desativacao: null,
      marca,
      lote,
      data_compra: purchaseDate,
    },
  });

  if (existingFilament) {
    return res.status(409).json({ error: 'Já existe um filamento com esta marca, lote e data de compra.' });
  }

  const result = await prisma.filament.updateMany({
    where: { id, tenantId: req.tenantId, data_desativacao: null },
    data: {
      marca,
      lote,
      data_compra: purchaseDate,
      tipo,
      custo_por_kg: custoPorKg,
    },
  });
  if (!result.count) {
      return res.status(404).json({ error: 'Filamento não encontrado' });
  }
  const updated = await prisma.filament.findUnique({ where: { id } });
  res.json(updated);
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const result = await prisma.filament.updateMany({
    where: { id, tenantId: req.tenantId, data_desativacao: null },
    data: { data_desativacao: new Date() },
  });

  if (!result.count) {
    return res.status(404).json({ error: 'Filamento não encontrado ou já desativado.' });
  }

  res.json({ removed: true });
});

router.patch('/:id/reactivate', async (req, res) => {
  const { id } = req.params;

  const filament = await prisma.filament.findFirst({
    where: { id, tenantId: req.tenantId },
  });

  if (!filament) {
    return res.status(404).json({ error: 'Filamento não encontrado.' });
  }

  if (!filament.data_desativacao) {
    return res.status(400).json({ error: 'O filamento já está ativo.' });
  }

  const existingActiveFilament = await prisma.filament.findFirst({
    where: {
      tenantId: req.tenantId,
      id: { not: id },
      data_desativacao: null,
      marca: filament.marca,
      lote: filament.lote,
      data_compra: filament.data_compra,
    },
  });

  if (existingActiveFilament) {
    return res.status(409).json({ error: 'Já existe um filamento ativo com esta marca, lote e data de compra.' });
  }

  const updated = await prisma.filament.update({
    where: { id },
    data: { data_desativacao: null },
  });

  res.json(updated);
});

export default router;
