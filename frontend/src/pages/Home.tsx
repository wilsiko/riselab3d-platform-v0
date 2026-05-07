import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Alert } from '../components/Alert';
import { Loading } from '../components/Loading';
import { Quote } from '../types';

interface DashboardStats {
  productsCount: number;
  quotesCount: number;
  printersCount: number;
  filamentsCount: number;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [quoteSearch, setQuoteSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deferredQuoteSearch = useDeferredValue(quoteSearch);

  useEffect(() => {
    const loadHome = async () => {
      try {
        setIsLoading(true);
        const [statsRes, quotesRes] = await Promise.all([
          api.get<DashboardStats>('/dashboard'),
          api.get<Quote[]>('/quotes'),
        ]);
        setStats(statsRes.data);
        setQuotes(quotesRes.data);
      } catch (requestError: any) {
        setError(requestError?.response?.data?.error || 'Nao foi possivel carregar a visao inicial.');
      } finally {
        setIsLoading(false);
      }
    };

    loadHome();
  }, []);

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
          itemSummary,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(normalizedQuery);
      })
      .slice(0, 12);
  }, [deferredQuoteSearch, quotes]);

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
                placeholder="Buscar por cliente, SKU, material ou data"
                className="w-full border-0 bg-transparent p-0 text-sm font-medium text-white outline-none placeholder:text-slate-500"
              />
            </label>

            <Link
              to="/quotes"
              className="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_40px_rgba(34,211,238,0.22)] transition hover:bg-cyan-300"
            >
              Nova cotacao
            </Link>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-5 text-sm text-slate-400">
          <p>{filteredQuotes.length} resultado(s) exibido(s)</p>
          <Link to="/quotes" className="font-semibold text-cyan-200 transition hover:text-cyan-100">
            Abrir fluxo completo
          </Link>
        </div>

        <div className="mt-6 space-y-3">
          {filteredQuotes.length ? (
            filteredQuotes.map((quote) => {
              const primaryItem = quote.items[0];
              const itemLabel = primaryItem?.snapshot_nome || primaryItem?.product?.nome || 'Item sem titulo';
              const itemSku = primaryItem?.snapshot_sku || primaryItem?.product?.sku;

              return (
                <Link
                  key={quote.id}
                  to="/quotes"
                  className="group block rounded-[24px] border border-white/10 bg-[#0a1228]/75 px-4 py-3 transition hover:border-cyan-400/35 hover:bg-cyan-400/[0.08]"
                >
                  <div className="grid gap-3 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto] xl:items-center">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <p className="truncate text-sm font-semibold text-white">{quote.nome_cliente}</p>
                        <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                          {quote.items.length} item(ns)
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                        <span>{new Date(quote.data).toLocaleDateString('pt-BR')}</span>
                        <span className="truncate">{itemLabel}{itemSku ? ` • ${itemSku}` : ''}</span>
                      </div>
                    </div>

                    <div className="grid gap-2 text-xs xl:grid-cols-2 xl:text-right">
                      <div>
                        <p className="font-semibold uppercase tracking-[0.18em] text-slate-500">Canal</p>
                        <p className="mt-1 text-sm text-slate-300">{quote.sale_channel || 'direct'}</p>
                      </div>
                      <div>
                        <p className="font-semibold uppercase tracking-[0.18em] text-slate-500">Total</p>
                        <p className="mt-1 text-sm font-semibold text-cyan-200">{formatCurrency(quote.valor_total)}</p>
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