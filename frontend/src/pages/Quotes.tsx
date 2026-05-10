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
  productName: string;
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
    productName: '',
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
  const [showQuantityPresets, setShowQuantityPresets] = useState(false);
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
  const canSubmit = Boolean(draft.productName.trim()) && Boolean(draft.clientName.trim()) && Boolean(draft.date) && Boolean(draft.printerId) && materialWeightGrams > 0 && printHours > 0 && quantity > 0 && suggestedPrice > 0 && Boolean(defaultMaterial);

  function updateDraft(partial: Partial<QuoteDraft>) {
    setDraft((currentDraft) => ({ ...currentDraft, ...partial }));
  }

  function applyQuantityPreset(nextQuantity: number) {
    updateDraft({ quantity: String(nextQuantity) });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!canSubmit) {
      setError('Defina produto, cliente, itens validos e um preco final antes de salvar a cotacao.');
      return;
    }

    const marginMultiplier = 1 + appliedMargin / 100;
    const targetTotal = roundCurrency((totalItemCost + additionalOperationalCost) * marginMultiplier);
    const unitPrice = Number((targetTotal / quantity).toFixed(4));
    const payloadItems = [
      {
        productName: draft.productName.trim(),
        printerId: draft.printerId,
        materialWeightGrams,
        printHours,
        quantidade: quantity,
        preco_unitario: unitPrice,
      },
    ];

    const manualMetadata = {
      productName: draft.productName.trim(),
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
      setSuccess('Cotacao salva com o novo resumo comercial.');
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
              <p className="mt-2 text-sm leading-6 text-slate-400">Informe produto, cliente, peso, tempo e quantidade, depois selecione a impressora usada na producao.</p>
            </div>

            <div className="mt-6 space-y-5">
              <div className="grid gap-4 xl:grid-cols-2">
                <label className="block rounded-[28px] border border-white/10 bg-[#0a1228]/85 p-4 shadow-[0_16px_50px_rgba(0,0,0,0.18)]">
                  <span className="block text-sm font-medium text-slate-200">Nome do produto</span>
                  <input
                    value={draft.productName}
                    onChange={(event) => updateDraft({ productName: event.target.value })}
                    placeholder="Ex: Suporte de celular"
                    className="mt-4 min-h-[60px] w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-base font-semibold text-white outline-none transition focus:border-cyan-400/40 focus:bg-cyan-400/[0.05]"
                    required
                  />
                </label>

                <label className="block rounded-[28px] border border-white/10 bg-[#0a1228]/85 p-4 shadow-[0_16px_50px_rgba(0,0,0,0.18)]">
                  <span className="block text-sm font-medium text-slate-200">Cliente</span>
                  <input
                    value={draft.clientName}
                    onChange={(event) => updateDraft({ clientName: event.target.value })}
                    placeholder="Ex: Studio Atlas"
                    className="mt-4 min-h-[60px] w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-base font-semibold text-white outline-none transition focus:border-cyan-400/40 focus:bg-cyan-400/[0.05]"
                    required
                  />
                </label>
              </div>

              <div className="grid gap-4 xl:grid-cols-3">
                <NumericInput label="Peso" value={draft.materialWeightGrams} onChange={(materialWeightGramsValue) => updateDraft({ materialWeightGrams: materialWeightGramsValue })} suffix="g" hint="material" />
                <NumericInput label="Tempo" value={draft.printHours} onChange={(printHoursValue) => updateDraft({ printHours: printHoursValue })} suffix="h" hint="horas" />
                <label className="flex min-h-[132px] flex-col rounded-[28px] border border-white/10 bg-[#0a1228]/85 p-4 shadow-[0_16px_50px_rgba(0,0,0,0.18)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="block text-sm font-medium leading-5 text-slate-200">Quantidade</span>
                      <span className="block text-[11px] uppercase tracking-[0.22em] text-slate-500">unid.</span>
                    </div>
                    <button
                      type="button"
                      aria-label="Abrir presets de quantidade"
                      aria-expanded={showQuantityPresets}
                      onClick={() => setShowQuantityPresets((currentValue) => !currentValue)}
                      className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition ${
                        showQuantityPresets ? 'border-cyan-400/35 bg-cyan-400/[0.08] text-cyan-200' : 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'
                      }`}
                    >
                      +
                    </button>
                  </div>

                  <div className="mt-4 flex min-h-[60px] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 focus-within:border-cyan-400/40 focus-within:bg-cyan-400/[0.05]">
                    <input
                      type="number"
                      inputMode="decimal"
                      step="1"
                      min="1"
                      value={draft.quantity}
                      onChange={(event) => updateDraft({ quantity: event.target.value })}
                      className="w-full border-0 bg-transparent p-0 text-base font-semibold text-white outline-none placeholder:text-slate-500"
                    />
                  </div>

                  {showQuantityPresets ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[1, 5, 10, 25].map((presetQuantity) => (
                        <button
                          key={presetQuantity}
                          type="button"
                          onClick={() => {
                            applyQuantityPreset(presetQuantity);
                            setShowQuantityPresets(false);
                          }}
                          className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                            totalQuantity === presetQuantity ? 'bg-cyan-400 text-slate-950' : 'border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]'
                          }`}
                        >
                          {presetQuantity} un
                        </button>
                      ))}
                    </div>
                  ) : null}
                </label>
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
                    <div key={channel.id} className="w-full">
                      <button
                        type="button"
                        onClick={() => updateDraft({ saleChannel: channel.id })}
                        className={`flex min-h-[60px] w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
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

            <div className="mt-6">
              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full rounded-2xl bg-cyan-400 px-5 py-4 text-sm font-semibold text-slate-950 shadow-[0_18px_40px_rgba(34,211,238,0.22)] transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              >
                Salvar cotacao
              </button>
            </div>
          </aside>
        </div>

        <section className="rounded-[34px] border border-white/10 bg-white/[0.035] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.24)] backdrop-blur-2xl sm:p-6">
          <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Historico operacional</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Cotacoes recentes para consulta rapida</h2>
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
              <button
                type="submit"
                disabled={!canSubmit}
                className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}