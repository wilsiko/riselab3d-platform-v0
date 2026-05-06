import { FormEvent, useEffect, useMemo, useState } from 'react';
import api from '../api';
import { Alert } from '../components/Alert';
import { Loading } from '../components/Loading';
import { getSaleChannel, SALE_CHANNELS, SaleChannel } from '../constants/pricing';
import { Product, Quote } from '../types';

const QUOTE_DRAFT_STORAGE_KEY = 'riselab3d.quote-draft';

type QuoteStep = 0 | 1 | 2 | 3;

interface DraftItem {
  productId: string;
  quantity: number;
}

interface QuoteDraft {
  clientName: string;
  date: string;
  notes: string;
  saleChannel: SaleChannel;
  customMarginEnabled: boolean;
  customMargin: string;
  items: DraftItem[];
}

const steps = [
  { id: 0, eyebrow: 'Passo 1', title: 'Cliente', description: 'Defina para quem o orcamento sera montado.' },
  { id: 1, eyebrow: 'Passo 2', title: 'Itens', description: 'Escolha os produtos que entram na proposta e ajuste a quantidade.' },
  { id: 2, eyebrow: 'Passo 3', title: 'Canal de venda', description: 'Aplique o preset comercial certo e ajuste so se realmente precisar.' },
  { id: 3, eyebrow: 'Passo 4', title: 'Revisao', description: 'Confira o preco final, salve e exporte PDF apenas se fizer sentido.' },
] as const;

function getDefaultDraft(): QuoteDraft {
  return {
    clientName: '',
    date: new Date().toISOString().substring(0, 10),
    notes: '',
    saleChannel: 'direct',
    customMarginEnabled: false,
    customMargin: '',
    items: [{ productId: '', quantity: 1 }],
  };
}

function loadDraft(): QuoteDraft {
  if (typeof window === 'undefined') {
    return getDefaultDraft();
  }

  const rawValue = window.localStorage.getItem(QUOTE_DRAFT_STORAGE_KEY);

  if (!rawValue) {
    return getDefaultDraft();
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<QuoteDraft>;
    return {
      ...getDefaultDraft(),
      ...parsed,
      items: parsed.items?.length ? parsed.items : [{ productId: '', quantity: 1 }],
    };
  } catch {
    return getDefaultDraft();
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function Quotes() {
  const [products, setProducts] = useState<Product[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [draft, setDraft] = useState<QuoteDraft>(() => loadDraft());
  const [currentStep, setCurrentStep] = useState<QuoteStep>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [productsRes, quotesRes] = await Promise.all([
          api.get<Product[]>('/products'),
          api.get<Quote[]>('/quotes'),
        ]);
        setProducts(productsRes.data);
        setQuotes(quotesRes.data);
      } catch (requestError: any) {
        setError(requestError?.response?.data?.error || 'Nao foi possivel carregar os orcamentos.');
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
  const appliedMargin = draft.customMarginEnabled ? Number(draft.customMargin || 0) : selectedChannel.marginPercent;

  const enrichedItems = useMemo(
    () =>
      draft.items.map((item) => {
        const product = products.find((entry) => entry.id === item.productId) || null;
        const unitCost = product?.custo_total || 0;
        const unitPrice = unitCost * (1 + appliedMargin / 100);
        return {
          ...item,
          product,
          unitCost,
          unitPrice,
          subtotalCost: unitCost * item.quantity,
          subtotalPrice: unitPrice * item.quantity,
        };
      }),
    [draft.items, products, appliedMargin],
  );

  const totalCost = enrichedItems.reduce((sum, item) => sum + item.subtotalCost, 0);
  const totalPrice = enrichedItems.reduce((sum, item) => sum + item.subtotalPrice, 0);
  const allItemsSelected = enrichedItems.every((item) => item.product);
  const canAdvanceFromClient = Boolean(draft.clientName.trim());
  const canAdvanceFromItems = Boolean(enrichedItems.length) && allItemsSelected;
  const canAdvanceFromPricing = appliedMargin >= 0;
  const canSubmit = canAdvanceFromClient && canAdvanceFromItems && canAdvanceFromPricing;

  const recentProducts = products.slice(0, 5);
  const recentQuotes = quotes.slice(0, 6);

  function updateDraft(partial: Partial<QuoteDraft>) {
    setDraft((currentDraft) => ({ ...currentDraft, ...partial }));
  }

  function updateItem(index: number, partial: Partial<DraftItem>) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      items: currentDraft.items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...partial } : item)),
    }));
  }

  function addItem(productId = '') {
    setDraft((currentDraft) => ({
      ...currentDraft,
      items: [...currentDraft.items, { productId, quantity: 1 }],
    }));
  }

  function removeItem(index: number) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      items: currentDraft.items.length === 1 ? [{ productId: '', quantity: 1 }] : currentDraft.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function clearDraft() {
    const nextDraft = getDefaultDraft();
    setDraft(nextDraft);
    setCurrentStep(0);
    setSuccess(null);

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(QUOTE_DRAFT_STORAGE_KEY);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function continueToNextStep() {
    setCurrentStep((current) => (current >= 3 ? 3 : ((current + 1) as QuoteStep)));
  }

  function goToPreviousStep() {
    setCurrentStep((current) => (current <= 0 ? 0 : ((current - 1) as QuoteStep)));
  }

  function duplicateQuote(quote: Quote) {
    setDraft({
      ...getDefaultDraft(),
      clientName: quote.nome_cliente,
      items: quote.items.map((item) => ({ productId: item.product.id, quantity: item.quantidade })),
    });
    setCurrentStep(1);
    setSuccess('Rascunho montado a partir de um orcamento anterior. Ajuste os detalhes e siga.');
    setError(null);

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!canSubmit) {
      setError('Preencha as etapas obrigatorias antes de salvar o orcamento.');
      return;
    }

    try {
      setIsLoading(true);
      const payload = {
        nome_cliente: draft.clientName,
        data: draft.date,
        notes: draft.notes,
        sale_channel: draft.saleChannel,
        subtotal_custo: Number(totalCost.toFixed(2)),
        margem_percentual: Number(appliedMargin.toFixed(2)),
        items: enrichedItems.map((item) => ({
          productId: item.productId,
          quantidade: item.quantity,
          preco_unitario: Number(item.unitPrice.toFixed(2)),
        })),
      };
      const response = await api.post<Quote>('/quotes', payload);
      setQuotes((currentQuotes) => [response.data, ...currentQuotes]);
      clearDraft();
      setSuccess('Orcamento salvo. Ele ja fica disponivel na tela; PDF e apenas uma opcao adicional.');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || 'Nao foi possivel salvar o orcamento.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <Loading isLoading={isLoading} label="Processando seu fluxo de cotacao..." />

      <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Quote flow</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">Menos cadastro no caminho. Mais clareza para fechar o preco.</h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              O orcamento agora nasce em etapas curtas: cliente, itens, contexto comercial e revisao final. O PDF virou uma opcao, nao a razao do fluxo.
            </p>
          </div>
          <button
            type="button"
            onClick={clearDraft}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Limpar rascunho
          </button>
        </div>
      </section>

      {error ? <Alert type="error" message={error} onClose={() => setError(null)} /> : null}
      {success ? <Alert type="success" message={success} onClose={() => setSuccess(null)} /> : null}

      <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap gap-3">
            {steps.map((step) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setCurrentStep(step.id as QuoteStep)}
                  className={`flex min-w-[170px] flex-1 rounded-3xl border px-4 py-4 text-left transition ${
                    isActive
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : isCompleted
                        ? 'border-cyan-200 bg-cyan-50 text-cyan-900'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">{step.eyebrow}</p>
                    <p className="mt-2 text-base font-semibold">{step.title}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">{steps[currentStep].eyebrow}</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">{steps[currentStep].title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{steps[currentStep].description}</p>

            {currentStep === 0 ? (
              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Cliente</span>
                  <input
                    value={draft.clientName}
                    onChange={(event) => updateDraft({ clientName: event.target.value })}
                    placeholder="Ex: Studio Atlas, Ana Paula, Loja XYZ"
                    className="w-full rounded-2xl border border-slate-200 bg-white p-3"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Data</span>
                  <input
                    type="date"
                    value={draft.date}
                    onChange={(event) => updateDraft({ date: event.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white p-3"
                    required
                  />
                </label>

                <label className="block lg:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Observacoes internas</span>
                  <textarea
                    value={draft.notes}
                    onChange={(event) => updateDraft({ notes: event.target.value })}
                    className="min-h-32 w-full rounded-2xl border border-slate-200 bg-white p-3"
                    placeholder="Opcional. Use este campo para contexto comercial ou detalhes que ajudam na revisao."
                  />
                </label>
              </div>
            ) : null}

            {currentStep === 1 ? (
              <div className="mt-6 space-y-6">
                <div className="grid gap-3 md:grid-cols-5">
                  {recentProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addItem(product.id)}
                      className="rounded-3xl border border-slate-200 bg-white p-4 text-left transition hover:border-cyan-300 hover:bg-cyan-50/50"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Atalho</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{product.nome}</p>
                      <p className="mt-1 text-xs text-slate-500">{product.sku}</p>
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  {draft.items.map((item, index) => {
                    const currentLine = enrichedItems[index];

                    return (
                      <div key={`${item.productId}-${index}`} className="rounded-3xl border border-slate-200 bg-white p-5">
                        <div className="grid gap-4 xl:grid-cols-[1.8fr_0.6fr_1fr_auto] xl:items-end">
                          <label className="block">
                            <span className="mb-2 block text-sm font-medium text-slate-700">Produto</span>
                            <select
                              value={item.productId}
                              onChange={(event) => updateItem(index, { productId: event.target.value })}
                              className="w-full rounded-2xl border border-slate-200 bg-white p-3"
                              required
                            >
                              <option value="">Escolha um produto do catalogo</option>
                              {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.nome} • {product.sku}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="block">
                            <span className="mb-2 block text-sm font-medium text-slate-700">Qtd</span>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(event) => updateItem(index, { quantity: Number(event.target.value) || 1 })}
                              className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-right"
                            />
                          </label>

                          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                            <p>Custo base</p>
                            <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(currentLine.unitCost)}</p>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                          >
                            Remover
                          </button>
                        </div>

                        {currentLine.product ? (
                          <div className="mt-4 grid gap-3 md:grid-cols-3">
                            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                              <p>Material</p>
                              <p className="mt-2 font-semibold text-slate-900">{currentLine.product.filament.marca} • {currentLine.product.filament.tipo}</p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                              <p>Custo do item</p>
                              <p className="mt-2 font-semibold text-slate-900">{formatCurrency(currentLine.subtotalCost)}</p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                              <p>Total com margem atual</p>
                              <p className="mt-2 font-semibold text-slate-900">{formatCurrency(currentLine.subtotalPrice)}</p>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => addItem()}
                  className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Adicionar outro item
                </button>
              </div>
            ) : null}

            {currentStep === 2 ? (
              <div className="mt-6 space-y-6">
                <div className="grid gap-4 lg:grid-cols-3">
                  {SALE_CHANNELS.map((channel) => (
                    <button
                      key={channel.id}
                      type="button"
                      onClick={() => updateDraft({ saleChannel: channel.id })}
                      className={`rounded-3xl border p-5 text-left transition ${
                        draft.saleChannel === channel.id
                          ? 'border-cyan-400 bg-cyan-50 text-cyan-900'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <p className="text-lg font-semibold">{channel.label}</p>
                      <p className="mt-2 text-sm leading-6 opacity-90">{channel.description}</p>
                      <p className="mt-4 text-sm font-semibold">Preset sugerido: {channel.marginPercent}%</p>
                    </button>
                  ))}
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <label className="flex items-center gap-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={draft.customMarginEnabled}
                      onChange={(event) =>
                        updateDraft({
                          customMarginEnabled: event.target.checked,
                          customMargin: event.target.checked ? String(selectedChannel.marginPercent) : '',
                        })
                      }
                      className="h-4 w-4 rounded border-slate-300 text-slate-900"
                    />
                    Quero sobrescrever o preset com uma margem manual
                  </label>

                  {draft.customMarginEnabled ? (
                    <label className="mt-4 block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">Margem customizada</span>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={draft.customMargin}
                        onChange={(event) => updateDraft({ customMargin: event.target.value })}
                        className="w-full rounded-2xl border border-slate-200 bg-white p-3"
                      />
                    </label>
                  ) : null}
                </div>
              </div>
            ) : null}

            {currentStep === 3 ? (
              <div className="mt-6 space-y-5">
                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <h3 className="text-lg font-semibold text-slate-900">Resumo do quote</h3>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                      <p>Cliente</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">{draft.clientName || 'Nao informado'}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                      <p>Canal de venda</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">{selectedChannel.label}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <p className="text-sm leading-6 text-slate-600">
                    Depois de salvar, o orcamento fica disponivel na lista abaixo com total e itens. Exportar PDF e uma acao opcional para compartilhamento externo, nao uma obrigacao do fluxo.
                  </p>
                </div>

                <div className="space-y-3">
                  {enrichedItems.map((item, index) => (
                    <div key={`${item.productId}-${index}`} className="rounded-3xl border border-slate-200 bg-white p-5">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-lg font-semibold text-slate-900">{item.product?.nome || 'Produto nao selecionado'}</p>
                          <p className="mt-1 text-sm text-slate-500">Qtd {item.quantity} • Custo unitario {formatCurrency(item.unitCost)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Subtotal final</p>
                          <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(item.subtotalPrice)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-6 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-3">
              {currentStep > 0 ? (
                <button
                  type="button"
                  onClick={goToPreviousStep}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Voltar
                </button>
              ) : null}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={continueToNextStep}
                  disabled={
                    (currentStep === 0 && !canAdvanceFromClient) ||
                    (currentStep === 1 && !canAdvanceFromItems) ||
                    (currentStep === 2 && !canAdvanceFromPricing)
                  }
                  className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Continuar
                </button>
              ) : null}
            </div>

            {currentStep === 3 ? (
              <button
                type="submit"
                disabled={!canSubmit}
                className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Salvar orcamento
              </button>
            ) : null}
          </div>
        </form>

        <aside className="space-y-6">
          <div className="sticky top-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Resumo em tempo real</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Preco antes de exportar</h2>

            <div className="mt-6 space-y-4">
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Canal selecionado</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{selectedChannel.label}</p>
                <p className="mt-1 text-sm text-slate-600">Margem aplicada: {appliedMargin.toFixed(1)}%</p>
              </div>

              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Custo base</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(totalCost)}</p>
              </div>

              <div className="rounded-3xl bg-slate-900 p-5 text-white">
                <p className="text-sm text-slate-200">Total estimado do quote</p>
                <p className="mt-2 text-3xl font-semibold">{formatCurrency(totalPrice)}</p>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-200 pt-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Linhas atuais</p>
              <div className="mt-4 space-y-3">
                {enrichedItems.map((item, index) => (
                  <div key={`${item.productId}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                    <p className="font-semibold text-slate-900">{item.product?.nome || 'Produto pendente'}</p>
                    <p className="mt-1 text-slate-600">Qtd {item.quantity}</p>
                    <p className="mt-2 text-slate-900">{formatCurrency(item.subtotalPrice)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Historico</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Ultimos orcamentos</h2>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {recentQuotes.length ? (
                recentQuotes.map((quote) => (
                  <article key={quote.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-slate-900">{quote.nome_cliente}</p>
                        <p className="mt-1 text-sm text-slate-500">{new Date(quote.data).toLocaleDateString('pt-BR')} • {quote.items.length} item(ns) • {getSaleChannel((quote.sale_channel as SaleChannel) || 'direct').label}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Total</p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(quote.valor_total)}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => duplicateQuote(quote)}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        Usar como base
                      </button>
                      <a
                        href={`/api/quotes/${quote.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                      >
                        PDF opcional
                      </a>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-sm text-slate-500">
                  Os orcamentos salvos aparecem aqui para consulta rapida, reutilizacao e exportacao posterior.
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
