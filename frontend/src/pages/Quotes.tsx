import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Alert } from '../components/Alert';
import { Loading } from '../components/Loading';
import { NumericInput } from '../components/NumericInput';
import { PricingCard } from '../components/PricingCard';
import { PrinterSelector } from '../components/PrinterSelector';
import { getSaleChannel, SALE_CHANNELS, SaleChannel } from '../constants/pricing';
import { Filament, Printer, Quote, Settings } from '../types';

const QUOTE_DRAFT_STORAGE_KEY = 'riselab3d.quote-draft';

interface QuoteDraft {
  clientName: string;
  date: string;
  notes: string;
  saleChannel: SaleChannel;
  printerId: string;
  materialWeightGrams: string;
  printHours: string;
  quantity: string;
  laborCost: string;
  packagingCost: string;
}

function getDefaultDraft(): QuoteDraft {
  return {
    clientName: '',
    date: new Date().toISOString().substring(0, 10),
    notes: '',
    saleChannel: 'direct',
    printerId: '',
    materialWeightGrams: '',
    printHours: '',
    quantity: '1',
    laborCost: '0',
    packagingCost: '0',
  };
}

function loadDraft(): QuoteDraft {
  if (typeof window === 'undefined') {
    return getDefaultDraft();
  }

  const storedValue = window.localStorage.getItem(QUOTE_DRAFT_STORAGE_KEY);

  if (!storedValue) {
    return getDefaultDraft();
  }

  try {
    const parsed = JSON.parse(storedValue) as Partial<QuoteDraft>;
    return {
      ...getDefaultDraft(),
      ...parsed,
    };
  } catch {
    return getDefaultDraft();
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function parseDecimal(value: string) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}

export default function Quotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [materials, setMaterials] = useState<Filament[]>([]);
  const [settings, setSettings] = useState<Settings>({ custo_kwh: 0 });
  const [draft, setDraft] = useState<QuoteDraft>(() => loadDraft());
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvancedCosts, setShowAdvancedCosts] = useState(false);
  const [lastSavedQuoteId, setLastSavedQuoteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [settingsRes, quotesRes, printersRes, filamentsRes] = await Promise.all([
          api.get<Settings>('/settings'),
          api.get<Quote[]>('/quotes'),
          api.get<Printer[]>('/printers'),
          api.get<Filament[]>('/filaments'),
        ]);

        setSettings(settingsRes.data);
        setQuotes(quotesRes.data);
        setPrinters(printersRes.data);
        setMaterials(filamentsRes.data);
      } catch (requestError: any) {
        setError(requestError?.response?.data?.error || 'Nao foi possivel carregar o espaco de cotacoes.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(QUOTE_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, [draft]);

  const selectedChannel = getSaleChannel(draft.saleChannel);
  const selectedPrinter = printers.find((printer) => printer.id === draft.printerId) || null;
  const defaultMaterial = materials[0] || null;
  const materialWeightGrams = parseDecimal(draft.materialWeightGrams);
  const printHours = parseDecimal(draft.printHours);
  const quantity = Math.max(1, Math.round(parseDecimal(draft.quantity) || 1));
  const appliedMargin = selectedChannel.marginPercent;
  const laborCost = parseDecimal(draft.laborCost);
  const packagingCost = parseDecimal(draft.packagingCost);
  const additionalOperationalCost = laborCost + packagingCost;

  const unitTechnicalCost = useMemo(() => {
    if (!selectedPrinter || !defaultMaterial || materialWeightGrams <= 0 || printHours <= 0) {
      return 0;
    }

    const materialCost = (materialWeightGrams / 1000) * defaultMaterial.custo_por_kg;
    const energyCost = (selectedPrinter.consumo_watts / 1000) * printHours * settings.custo_kwh;
    const amortizationCost = (selectedPrinter.custo_aquisicao / selectedPrinter.vida_util_horas) * printHours;
    return materialCost + energyCost + amortizationCost;
  }, [defaultMaterial, materialWeightGrams, printHours, selectedPrinter, settings.custo_kwh]);

  const totalItemCost = unitTechnicalCost * quantity;
  const totalPrintHours = printHours * quantity;
  const totalQuantity = quantity;
  const productionCost = totalItemCost + additionalOperationalCost;
  const suggestedPrice = roundCurrency(productionCost * (1 + appliedMargin / 100));
  const netProfit = roundCurrency(suggestedPrice - productionCost);
  const averageUnitPrice = totalQuantity ? suggestedPrice / totalQuantity : 0;
  const recentQuotes = quotes.slice(0, 4);
  const canSubmit = Boolean(draft.clientName.trim()) && Boolean(draft.date) && Boolean(draft.printerId) && materialWeightGrams > 0 && printHours > 0 && quantity > 0 && suggestedPrice > 0 && Boolean(defaultMaterial);

  function updateDraft(partial: Partial<QuoteDraft>) {
    setDraft((currentDraft) => ({ ...currentDraft, ...partial }));
  }

  function applyQuantityPreset(nextQuantity: number) {
    updateDraft({ quantity: String(nextQuantity) });
  }

  function extractManualMetadata(notes?: string | null) {
    const match = notes?.match(/__RL3D_MANUAL__(\{.*\})/);
    if (!match) {
      return null;
    }

    try {
      return JSON.parse(match[1]) as {
        printerId?: string;
        materialWeightGrams?: number;
        printHours?: number;
        quantity?: number;
      };
    } catch {
      return null;
    }
  }

  function duplicateQuote(quote: Quote) {
    const firstItem = quote.items[0];
    const manualMetadata = extractManualMetadata(quote.notes);
    const firstItemProduct = firstItem?.product;

    setDraft({
      ...getDefaultDraft(),
      clientName: quote.nome_cliente,
      saleChannel: (quote.sale_channel as SaleChannel) || 'direct',
      printerId: manualMetadata?.printerId || firstItemProduct?.printer.id || '',
      materialWeightGrams: manualMetadata?.materialWeightGrams ? String(manualMetadata.materialWeightGrams) : firstItemProduct?.peso_gramas ? String(firstItemProduct.peso_gramas) : '',
      printHours: manualMetadata?.printHours ? String(manualMetadata.printHours) : firstItemProduct?.tempo_impressao_horas ? String(firstItemProduct.tempo_impressao_horas) : '',
      quantity: manualMetadata?.quantity ? String(manualMetadata.quantity) : firstItem?.quantidade ? String(firstItem.quantidade) : '1',
    });
    setSuccess('Rascunho duplicado a partir do historico. Ajuste so o necessario e salve novamente.');
    setError(null);
  }

  function handleExportPdf(quoteId: string | null) {
    if (!quoteId || typeof window === 'undefined') {
      return;
    }

    window.open(`/api/quotes/${quoteId}/pdf`, '_blank', 'noopener,noreferrer');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!canSubmit) {
      setError('Defina cliente, itens validos e um preco final antes de salvar a cotacao.');
      return;
    }

    const marginMultiplier = 1 + appliedMargin / 100;
    const targetTotal = roundCurrency((totalItemCost + additionalOperationalCost) * marginMultiplier);
    const unitPrice = Number((targetTotal / quantity).toFixed(4));
    const payloadItems = [
      {
        printerId: draft.printerId,
        materialWeightGrams,
        printHours,
        quantidade: quantity,
        preco_unitario: unitPrice,
      },
    ];

    const manualMetadata = {
      printerId: draft.printerId,
      materialWeightGrams,
      printHours,
      quantity,
    };

    const contextNotes = [
      draft.notes.trim() || null,
      `Contexto comercial: canal ${selectedChannel.label}; mao de obra ${formatCurrency(laborCost)}; embalagem ${formatCurrency(packagingCost)}.`,
      `__RL3D_MANUAL__${JSON.stringify(manualMetadata)}`,
    ]
      .filter(Boolean)
      .join('\n\n');

    try {
      setIsLoading(true);
      const response = await api.post<Quote>('/quotes', {
        nome_cliente: draft.clientName,
        data: draft.date,
        notes: contextNotes,
        sale_channel: draft.saleChannel,
        subtotal_custo: roundCurrency(productionCost),
        margem_percentual: Number(appliedMargin.toFixed(2)),
        items: payloadItems,
      });

      setQuotes((currentQuotes) => [response.data, ...currentQuotes]);
      setLastSavedQuoteId(response.data.id);
      setSuccess('Cotacao salva com o novo resumo comercial. O PDF pode ser exportado em seguida.');
      setDraft((currentDraft) => ({
        ...getDefaultDraft(),
        printerId: currentDraft.printerId,
      }));
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || 'Nao foi possivel salvar a cotacao.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <Loading isLoading={isLoading} label="Atualizando o cockpit comercial..." />

      {error ? <Alert type="error" message={error} onClose={() => setError(null)} /> : null}
      {success ? <Alert type="success" message={success} onClose={() => setSuccess(null)} /> : null}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.92fr_1fr]">
          <section className="rounded-[34px] border border-white/10 bg-white/[0.035] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.24)] backdrop-blur-2xl sm:p-6">
            <div className="border-b border-white/10 pb-5">
              <h2 className="text-xl font-semibold tracking-[-0.04em] text-white">Produto</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">Informe peso, tempo e quantidade, depois selecione a impressora usada na producao.</p>
            </div>

            <div className="mt-6 space-y-5">
              <div className="grid gap-4 xl:grid-cols-3">
                <NumericInput label="Peso" value={draft.materialWeightGrams} onChange={(materialWeightGramsValue) => updateDraft({ materialWeightGrams: materialWeightGramsValue })} suffix="g" hint="material" />
                <NumericInput label="Tempo" value={draft.printHours} onChange={(printHoursValue) => updateDraft({ printHours: printHoursValue })} suffix="h" hint="horas" />
                <NumericInput label="Quantidade" value={draft.quantity} onChange={(quantityValue) => updateDraft({ quantity: quantityValue })} hint="unid." />
              </div>

              {printers.length ? (
                <PrinterSelector printers={printers} selectedPrinterId={draft.printerId} onChange={(printerId) => updateDraft({ printerId })} />
              ) : (
                <div className="rounded-[28px] border border-dashed border-white/10 bg-[#0a1228]/60 p-5 text-sm leading-6 text-slate-400">
                  Nenhuma impressora cadastrada. Cadastre a impressora em Configuracoes para liberar a mesa de cotacao.
                  <div className="mt-4">
                    <Link to="/pricing" className="inline-flex rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]">
                      Abrir configuracoes
                    </Link>
                  </div>
                </div>
              )}
              {!defaultMaterial ? (
                <div className="rounded-[28px] border border-dashed border-white/10 bg-[#0a1228]/60 p-5 text-sm leading-6 text-slate-400">
                  Nenhum material cadastrado. Cadastre um material em Configuracoes para liberar o calculo automatico da cotacao.
                  <div className="mt-4">
                    <Link to="/catalog/materials" className="inline-flex rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]">
                      Abrir materiais
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-[34px] border border-white/10 bg-white/[0.035] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.24)] backdrop-blur-2xl sm:p-6">
            <div className="border-b border-white/10 pb-5">
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Custos adicionais e margem</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">Escolha o canal e ajuste apenas os custos que realmente variam.</p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <NumericInput label="Mao de obra" value={draft.laborCost} onChange={(laborCostValue) => updateDraft({ laborCost: laborCostValue })} prefix="R$" hint="fixo" />
              <NumericInput label="Embalagem" value={draft.packagingCost} onChange={(packagingCostValue) => updateDraft({ packagingCost: packagingCostValue })} prefix="R$" hint="fixo" />
            </div>

            <div className="mt-6 rounded-[30px] border border-white/10 bg-[#0a1228]/78 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white">Canal de venda</p>
                  <p className="mt-1 text-sm text-slate-400">Escolha o contexto comercial e consulte a explicacao so quando precisar.</p>
                </div>
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.08] px-4 py-3 text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Margem atual</p>
                  <p className="mt-1 text-lg font-semibold text-cyan-200">{selectedChannel.marginPercent}%</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {SALE_CHANNELS.map((channel) => {
                  const isSelected = draft.saleChannel === channel.id;

                  return (
                    <div key={channel.id}>
                      <button
                        type="button"
                        onClick={() => updateDraft({ saleChannel: channel.id })}
                        className={`flex min-h-[60px] flex-1 items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                          isSelected ? 'border-cyan-400/35 bg-cyan-400/[0.08]' : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08]'
                        }`}
                      >
                        <span className="text-sm font-semibold text-white">{channel.label}</span>
                        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${isSelected ? 'bg-cyan-300/20 text-cyan-200' : 'bg-white/[0.06] text-slate-300'}`}>
                          {channel.marginPercent}%
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 rounded-[30px] border border-white/10 bg-[#0a1228]/78 p-5">
              <button
                type="button"
                onClick={() => setShowAdvancedCosts((currentValue) => !currentValue)}
                className="flex w-full items-center justify-between gap-4 text-left"
              >
                <div>
                  <p className="text-sm font-medium text-white">Exibicao progressiva</p>
                  <p className="mt-1 text-sm text-slate-400">Abra contexto comercial detalhado apenas quando precisar.</p>
                </div>
                <span className="rounded-full bg-white/[0.08] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                  {showAdvancedCosts ? 'Ocultar' : 'Expandir'}
                </span>
              </button>

              {showAdvancedCosts ? (
                <div className="mt-5 grid gap-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-200">Cliente</span>
                    <input
                      value={draft.clientName}
                      onChange={(event) => updateDraft({ clientName: event.target.value })}
                      placeholder="Ex: Studio Atlas"
                      className="w-full rounded-2xl border border-white/10 bg-[#081120] p-3 text-white"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-200">Data</span>
                    <input
                      type="date"
                      value={draft.date}
                      onChange={(event) => updateDraft({ date: event.target.value })}
                      className="w-full rounded-2xl border border-white/10 bg-[#081120] p-3 text-white"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-200">Notas da proposta</span>
                    <textarea
                      value={draft.notes}
                      onChange={(event) => updateDraft({ notes: event.target.value })}
                      placeholder="Detalhes comerciais, prazo ou observacoes para a equipe."
                      className="min-h-28 w-full rounded-2xl border border-white/10 bg-[#081120] p-3 text-white"
                    />
                  </label>
                </div>
              ) : null}
            </div>
          </section>

          <aside className="rounded-[34px] border border-cyan-400/15 bg-[linear-gradient(180deg,rgba(7,11,22,0.98),rgba(8,17,32,0.98))] p-5 shadow-[0_32px_100px_rgba(0,0,0,0.32)] backdrop-blur-2xl sm:p-6 xl:sticky xl:top-6 xl:h-fit">
            <div className="border-b border-white/10 pb-5">
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-white">Painel de preco ao vivo</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">Boa leitura para decisao rapida, mas agora com menos altura e menos ruido visual.</p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
              <PricingCard label="Custo total" value={productionCost} formatter={formatCurrency} description="Base tecnica + custos comerciais adicionados nesta proposta." />
              <PricingCard label="Valor sugerido" value={suggestedPrice} formatter={formatCurrency} description="Preco final com margem aplicada." tone="accent" emphasize />
              <PricingCard label="Lucro liquido" value={netProfit} formatter={formatCurrency} description="Resultado apos custo tecnico e operacao." tone="success" />
              <PricingCard label="Valor por unidade" value={averageUnitPrice} formatter={formatCurrency} description="Media por unidade desta cotacao." tone="warm" />
            </div>

            <div className="mt-6 rounded-[30px] border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white">Quick presets</p>
                  <p className="mt-1 text-sm text-slate-400">Aplique quantidades sem reabrir o teclado.</p>
                </div>
                <div className="rounded-full bg-white/[0.08] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
                  Base atual
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                {[1, 5, 10, 25].map((quantity) => (
                  <button
                    key={quantity}
                    type="button"
                    onClick={() => applyQuantityPreset(quantity)}
                    className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      totalQuantity === quantity ? 'bg-cyan-400 text-slate-950' : 'border border-white/10 bg-[#081120] text-slate-200 hover:bg-white/[0.08]'
                    }`}
                  >
                    {quantity} un
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-[30px] border border-white/10 bg-white/[0.04] p-5">
              <p className="text-sm font-medium text-white">Breakdown rapido</p>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="flex items-center justify-between gap-4">
                  <span>Custo dos itens</span>
                  <span>{formatCurrency(totalItemCost)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Custos comerciais</span>
                  <span>{formatCurrency(additionalOperationalCost)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Margem aplicada</span>
                  <span>{appliedMargin.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <button
                type="submit"
                disabled={!canSubmit}
                className="rounded-2xl bg-cyan-400 px-5 py-4 text-sm font-semibold text-slate-950 shadow-[0_18px_40px_rgba(34,211,238,0.22)] transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              >
                Salvar cotacao
              </button>
              <button
                type="button"
                onClick={() => handleExportPdf(lastSavedQuoteId || recentQuotes[0]?.id || null)}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
              >
                Exportar PDF
              </button>
              <button
                type="button"
                onClick={() => recentQuotes[0] && duplicateQuote(recentQuotes[0])}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
              >
                Duplicar cotacao
              </button>
            </div>
          </aside>
        </div>

        <section className="rounded-[34px] border border-white/10 bg-white/[0.035] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.24)] backdrop-blur-2xl sm:p-6">
          <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Historico operacional</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Cotacoes recentes para duplicar, revisar e exportar</h2>
            </div>
            <p className="text-sm text-slate-400">A proposta fica comercialmente legivel sem abrir telas auxiliares.</p>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-4">
            {recentQuotes.length ? (
              recentQuotes.map((quote) => (
                <article key={quote.id} className="rounded-[30px] border border-white/10 bg-[#0a1228]/78 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.2)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{new Date(quote.data).toLocaleDateString('pt-BR')}</p>
                  <h3 className="mt-3 text-lg font-semibold text-white">{quote.nome_cliente}</h3>
                  <p className="mt-2 text-sm text-slate-400">{quote.items.length} item(ns) • {getSaleChannel((quote.sale_channel as SaleChannel) || 'direct').label}</p>
                  <p className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-cyan-200">{formatCurrency(quote.valor_total)}</p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => duplicateQuote(quote)}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                    >
                      Duplicar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportPdf(quote.id)}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                    >
                      PDF
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[30px] border border-dashed border-white/10 bg-[#0a1228]/60 p-6 text-sm leading-6 text-slate-400 xl:col-span-4">
                Ainda nao ha historico salvo nesta base. Monte a primeira cotacao acima e use o painel dominante como referencia principal.
              </div>
            )}
          </div>
        </section>

        <div className="fixed inset-x-4 bottom-4 z-30 lg:hidden">
          <div className="rounded-[28px] border border-white/10 bg-[#081120]/92 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Live total</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">{formatCurrency(suggestedPrice)}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => handleExportPdf(lastSavedQuoteId || recentQuotes[0]?.id || null)}
                  className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-semibold text-white"
                >
                  PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}