import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../auth/AuthContext';
import { Alert } from '../components/Alert';
import { Loading } from '../components/Loading';
import { getSaleChannels } from '../constants/pricing';
import { Quote, Settings } from '../types';

interface DashboardStats {
  productsCount: number;
  quotesCount: number;
  printersCount: number;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatQuoteTimestamp(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value));
}

function ChannelIcon({ channelId }: { channelId: string }) {
  if (channelId === 'direct') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16M13 5l7 7-7 7" />
      </svg>
    );
  }

  if (channelId === 'ecommerce') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5" aria-hidden="true">
        <circle cx="9" cy="19" r="1.5" />
        <circle cx="17" cy="19" r="1.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h2l2.4 9.2a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.76L20 8H7" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-6-4.35-6-10a3.75 3.75 0 0 1 6-2.98A3.75 3.75 0 0 1 18 11c0 5.65-6 10-6 10Z" />
    </svg>
  );
}

function renderChannelPriceBadges(unitCost: number | null, saleChannels: ReturnType<typeof getSaleChannels>) {
  if (unitCost === null) {
    return (
      <span className="text-sm text-slate-500">Valores nao informados</span>
    );
  }

  return saleChannels.map((channel) => {
    const salePrice = unitCost * (1 + channel.marginPercent / 100);

    return (
      <span
        key={channel.id}
        title={channel.label}
        aria-label={`${channel.label}: ${formatCurrency(salePrice)}`}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-slate-300"
      >
        <span className="text-cyan-200">
          <ChannelIcon channelId={channel.id} />
        </span>
        <span className="font-medium text-slate-200">{formatCurrency(salePrice)}</span>
      </span>
    );
  });
}

function getQuotePrimarySummary(quote: Quote) {
  const primaryItem = quote.items[0];
  const productName = primaryItem?.snapshot_nome || primaryItem?.product?.nome || 'Item sem titulo';
  const totalQuantity = quote.items.reduce((sum, item) => sum + item.quantidade, 0);
  const unitCost = primaryItem?.custo_base_unitario
    ?? (typeof primaryItem?.subtotal_custo === 'number' && primaryItem.quantidade > 0 ? primaryItem.subtotal_custo / primaryItem.quantidade : null)
    ?? (typeof quote.subtotal_custo === 'number' && totalQuantity > 0 ? quote.subtotal_custo / totalQuantity : null);

  return {
    productName,
    unitCost,
  };
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [settings, setSettings] = useState<Settings>({ custo_kwh: 0, direct_margin_percent: 20, ecommerce_margin_percent: 35, end_customer_margin_percent: 50, error_rate_percent: 10 });
  const [quoteSearch, setQuoteSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deferredQuoteSearch = useDeferredValue(quoteSearch);

  useEffect(() => {
    const loadHome = async () => {
      try {
        setIsLoading(true);
        const [statsRes, settingsRes] = await Promise.all([
          api.get<DashboardStats>('/dashboard'),
          api.get<Settings>('/settings'),
        ]);
        setStats(statsRes.data);
        setSettings(settingsRes.data);

        if (isAuthenticated) {
          const quotesRes = await api.get<Quote[]>('/quotes');
          setQuotes(quotesRes.data);
        } else {
          setQuotes([]);
        }
      } catch (requestError: any) {
        setError(requestError?.response?.data?.error || 'Nao foi possivel carregar a visao inicial.');
      } finally {
        setIsLoading(false);
      }
    };

    loadHome();
  }, [isAuthenticated]);

  const filteredQuotes = useMemo(() => {
    const normalizedQuery = deferredQuoteSearch.trim().toLowerCase();

    if (!normalizedQuery) {
      return quotes.slice(0, 12);
    }

    return quotes
      .filter((quote) => {
        const itemSummary = quote.items
          .map((item) => [item.snapshot_nome, item.snapshot_sku, item.snapshot_material, item.product?.nome, item.product?.sku].filter(Boolean).join(' '))
          .join(' ')
          .toLowerCase();

        const searchableText = [
          quote.nome_cliente,
          quote.sale_channel,
          new Date(quote.data).toLocaleDateString('pt-BR'),
          formatQuoteTimestamp(quote.createdAt),
          itemSummary,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(normalizedQuery);
      })
      .slice(0, 12);
  }, [deferredQuoteSearch, quotes]);

  const saleChannels = getSaleChannels(settings);

  return (
    <div className="space-y-8">
      <Loading isLoading={isLoading} label="Montando sua operacao do dia..." />

      <section className="rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(8,14,30,0.96),rgba(7,24,44,0.96),rgba(45,212,191,0.12))] p-8 shadow-[0_28px_90px_rgba(0,0,0,0.28)]">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">Visao operacional</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white">Uma cabine comercial para cotar, revisar e manter a operacao leve.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
            O produto deixa de parecer painel administrativo e passa a agir como cockpit. O foco agora e iniciar cotacoes, ler sinais de prontidao e agir sem friccao.
          </p>
        </div>
      </section>

      {error ? <Alert type="error" message={error} onClose={() => setError(null)} /> : null}

      <section className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.22)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">Cotacoes recentes</h2>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex min-w-[280px] items-center gap-3 rounded-2xl border border-white/10 bg-[#0a1228]/75 px-4 py-3 focus-within:border-cyan-400/35 focus-within:bg-cyan-400/[0.08]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 text-slate-400" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M10.75 18a7.25 7.25 0 1 1 0-14.5 7.25 7.25 0 0 1 0 14.5Z" />
              </svg>
              <input
                type="search"
                value={quoteSearch}
                onChange={(event) => setQuoteSearch(event.target.value)}
                placeholder="Ex.: nome do produto ou cliente"
                className="w-full border-0 bg-transparent p-0 text-sm font-medium text-white outline-none placeholder:text-slate-500"
              />
            </label>

            <Link
              to="/quotes"
              className="brand-primary-action inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition"
            >
              Nova cotacao
            </Link>
          </div>
        </div>

        <div className="mt-5 border-t border-white/10 pt-5 text-sm text-slate-400">
          <p>{isAuthenticated ? `${filteredQuotes.length} resultado(s) exibido(s)` : 'Historico salvo liberado apenas apos login'}</p>
        </div>

        <div className="mt-6 space-y-3">
          {!isAuthenticated ? (
            <div className="rounded-[28px] border border-dashed border-cyan-400/25 bg-cyan-400/[0.06] p-8 text-sm leading-7 text-slate-300">
              O modo visitante deixa a simulacao aberta, mas o historico de cotações fica reservado para contas autenticadas.
              <div className="mt-4">
                <Link to="/login" className="brand-primary-action inline-flex rounded-2xl px-4 py-3 text-sm font-semibold transition">
                  Entrar para ver historico
                </Link>
              </div>
            </div>
          ) : filteredQuotes.length ? (
            filteredQuotes.map((quote) => {
              const { productName, unitCost } = getQuotePrimarySummary(quote);

              return (
                <Link
                  key={quote.id}
                  to={`/quotes?quote=${quote.id}`}
                  className="group block rounded-[24px] border border-white/10 bg-[#0a1228]/75 px-4 py-3 transition hover:border-cyan-400/35 hover:bg-cyan-400/[0.08]"
                >
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] xl:items-center">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-white">{productName}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                        <span>{quote.nome_cliente}</span>
                        <span>{formatQuoteTimestamp(quote.createdAt)}</span>
                      </div>
                    </div>

                    <div className="grid gap-2 text-xs xl:text-right">
                      <div>
                        <p className="font-semibold uppercase tracking-[0.18em] text-slate-500">Custo unitario</p>
                        <p className="mt-1 text-base font-semibold text-cyan-200">{unitCost !== null ? formatCurrency(unitCost) : 'Nao informado'}</p>
                      </div>
                      <div>
                        <p className="font-semibold uppercase tracking-[0.18em] text-slate-500">Venda por canal</p>
                        <div className="mt-2 flex flex-wrap justify-start gap-2 xl:justify-end">{renderChannelPriceBadges(unitCost, saleChannels)}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end text-slate-500 transition group-hover:text-cyan-200">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m9 6 6 6-6 6" />
                      </svg>
                    </div>
                  </div>
                </Link>
              );
            })
          ) : quotes.length ? (
            <div className="rounded-[28px] border border-dashed border-white/10 bg-[#0a1228]/60 p-8 text-sm text-slate-400">
              Nenhuma cotacao corresponde ao texto digitado. Tente nome do cliente, SKU, material ou data.
            </div>
          ) : (
            <div className="rounded-[28px] border border-dashed border-white/10 bg-[#0a1228]/60 p-8 text-sm text-slate-400">
              Nenhuma cotacao ainda. Use o botao de nova cotacao para iniciar o primeiro fluxo comercial.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}