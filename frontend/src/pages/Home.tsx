import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Alert } from '../components/Alert';
import { Loading } from '../components/Loading';
import { Product, Quote } from '../types';

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
  const [products, setProducts] = useState<Product[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHome = async () => {
      try {
        setIsLoading(true);
        const [statsRes, productsRes, quotesRes] = await Promise.all([
          api.get<DashboardStats>('/dashboard'),
          api.get<Product[]>('/products'),
          api.get<Quote[]>('/quotes'),
        ]);
        setStats(statsRes.data);
        setProducts(productsRes.data);
        setQuotes(quotesRes.data);
      } catch (requestError: any) {
        setError(requestError?.response?.data?.error || 'Nao foi possivel carregar a visao inicial.');
      } finally {
        setIsLoading(false);
      }
    };

    loadHome();
  }, []);

  const setupAlerts = useMemo(() => {
    if (!stats) {
      return [] as string[];
    }

    const alerts: string[] = [];

    if (!stats.printersCount) {
      alerts.push('Cadastre pelo menos um perfil de impressora para dar mais consistencia ao custo base.');
    }

    if (!stats.filamentsCount) {
      alerts.push('Cadastre um material para evitar cotacao manual sem referencia de custo por quilo.');
    }

    if (!stats.productsCount) {
      alerts.push('Crie seus primeiros produtos para montar orcamentos em segundos nos proximos acessos.');
    }

    return alerts;
  }, [stats]);

  const recentQuotes = quotes.slice(0, 4);
  const featuredProducts = [...products].sort((left, right) => right.custo_total - left.custo_total).slice(0, 4);

  return (
    <div className="space-y-8">
      <Loading isLoading={isLoading} label="Montando sua operacao do dia..." />

      <section className="rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(8,145,178,0.82))] p-8 text-white shadow-sm">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">Daily quoting cockpit</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight">Cotacoes rapidas, leitura clara e o minimo de configuracao no caminho.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-100/85">
              O foco aqui e simples: continuar um rascunho, iniciar um novo orcamento ou revisar o que ja saiu hoje. Cadastros e regras ficam em segundo plano.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/quotes" className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
              Novo orcamento
            </Link>
            <Link to="/catalog" className="rounded-2xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              Revisar catalogo
            </Link>
          </div>
        </div>
      </section>

      {error ? <Alert type="error" message={error} onClose={() => setError(null)} /> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Produtos ativos', value: stats?.productsCount ?? '...', tone: 'from-cyan-50 to-white' },
          { label: 'Orcamentos gerados', value: stats?.quotesCount ?? '...', tone: 'from-emerald-50 to-white' },
          { label: 'Perfis de impressora', value: stats?.printersCount ?? '...', tone: 'from-amber-50 to-white' },
          { label: 'Perfis de material', value: stats?.filamentsCount ?? '...', tone: 'from-rose-50 to-white' },
        ].map((card) => (
          <article key={card.label} className={`rounded-3xl border border-slate-200 bg-gradient-to-br ${card.tone} p-6 shadow-sm`}>
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-4 text-4xl font-semibold text-slate-900">{card.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Uso diario</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Ultimos orcamentos</h2>
              </div>
              <Link to="/quotes" className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-900">
                Ver fluxo completo
              </Link>
            </div>

            <div className="mt-6 space-y-4">
              {recentQuotes.length ? (
                recentQuotes.map((quote) => (
                  <div key={quote.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Cliente</p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">{quote.nome_cliente}</p>
                        <p className="mt-1 text-sm text-slate-500">{new Date(quote.data).toLocaleDateString('pt-BR')} • {quote.items.length} item(ns)</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Total</p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(quote.valor_total)}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-sm text-slate-500">
                  Nenhum orcamento ainda. Comece pelo botao principal acima e use o fluxo guiado para gerar o primeiro.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Catalogo quente</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Produtos mais valiosos para cotar</h2>
              </div>
              <Link to="/catalog/products" className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-900">
                Abrir produtos
              </Link>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {featuredProducts.length ? (
                featuredProducts.map((product) => (
                  <article key={product.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{product.sku}</p>
                    <h3 className="mt-3 text-lg font-semibold text-slate-900">{product.nome}</h3>
                    <p className="mt-2 text-sm text-slate-600">{product.filament.marca} • {product.filament.tipo}</p>
                    <p className="mt-4 text-xl font-semibold text-slate-900">{formatCurrency(product.custo_total)}</p>
                  </article>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-sm text-slate-500 md:col-span-2">
                  Assim que voce cadastrar produtos, os itens mais usados e com maior impacto ficam destacados aqui para acelerar a cotacao.
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Atalhos do produto</p>
            <div className="mt-5 space-y-3">
              {[
                {
                  title: 'Novo orcamento',
                  description: 'Entre no fluxo guiado e monte a proposta sem abrir varias telas.',
                  to: '/quotes',
                },
                {
                  title: 'Gerenciar catalogo',
                  description: 'Concentre produtos, materiais e impressoras em um unico lugar.',
                  to: '/catalog',
                },
                {
                  title: 'Ajustar regras de preco',
                  description: 'Revise custo de energia e padroes de precificacao sem contaminar o uso diario.',
                  to: '/pricing',
                },
              ].map((item) => (
                <Link key={item.title} to={item.to} className="block rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-cyan-300 hover:bg-cyan-50/50">
                  <p className="text-base font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">Pronto para uso</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Checklist de velocidade</h2>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
              {setupAlerts.length ? (
                setupAlerts.map((alert) => (
                  <div key={alert} className="rounded-2xl bg-white/70 px-4 py-3">
                    {alert}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-white/70 px-4 py-3">
                  Sua base ja tem os elementos essenciais. O foco agora pode ser 100% em gerar orcamentos com menos cliques.
                </div>
              )}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}