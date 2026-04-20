import { useEffect, useState } from 'react';
import api from '../api';
import { Alert } from '../components/Alert';
import { Loading } from '../components/Loading';
import { AdminOverview } from '../types';
import { formatCurrency } from '../utils/numberFormat';

const metricCards = [
  { key: 'accountsCount', label: 'Contas criadas' },
  { key: 'tenantsCount', label: 'Empresas ativas' },
  { key: 'productsCount', label: 'Produtos ativos' },
  { key: 'quotesCount', label: 'Orçamentos gerados' },
  { key: 'printersCount', label: 'Impressoras ativas' },
  { key: 'filamentsCount', label: 'Filamentos ativos' },
  { key: 'recentAccountsCount', label: 'Novas contas em 7 dias' },
  { key: 'recentQuotesCount', label: 'Orçamentos em 30 dias' },
] as const;

export default function Admin() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOverview = async () => {
      try {
        setIsLoading(true);
        const response = await api.get<AdminOverview>('/admin/overview');
        setOverview(response.data);
      } catch (requestError: any) {
        setError(requestError?.response?.data?.error || 'Erro ao carregar visão administrativa.');
      } finally {
        setIsLoading(false);
      }
    };

    loadOverview();
  }, []);

  return (
    <div>
      <Loading isLoading={isLoading} label="Carregando visão administrativa..." />

      <h1 className="text-3xl font-semibold text-slate-900">Administração da Plataforma</h1>
      <p className="mt-2 text-slate-600">
        Acompanhe crescimento da base, atividade comercial e distribuição de uso entre as empresas.
      </p>

      {error ? <div className="mt-6"><Alert type="error" message={error} onClose={() => setError(null)} /></div> : null}

      {overview ? (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metricCards.map((card) => (
              <div key={card.key} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <p className="text-sm text-slate-500">{card.label}</p>
                <p className="mt-4 text-4xl font-semibold text-slate-900">{overview.metrics[card.key]}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Saúde comercial</h2>
                  <p className="mt-1 text-sm text-slate-500">Indicadores agregados da plataforma.</p>
                </div>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">Valor total dos orçamentos</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">
                    {formatCurrency(overview.metrics.totalQuoteValue)}
                  </p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">Ticket médio por orçamento</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">
                    {formatCurrency(overview.metrics.averageQuoteValue)}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Últimas contas criadas</h2>
              <div className="mt-5 space-y-3">
                {overview.latestAccounts.map((account) => (
                  <div key={account.id} className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">{account.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{account.email}</p>
                    <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.16em] text-slate-400">
                      <span>{account.tenantName}</span>
                      <span>{new Date(account.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Empresas com maior atividade</h2>
            <p className="mt-1 text-sm text-slate-500">Visão rápida de adoção por empresa cadastrada.</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {overview.tenantHighlights.map((tenant) => (
                <div key={tenant.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-lg font-semibold text-slate-900">{tenant.name}</p>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Contas</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">{tenant.usersCount}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Prod. ativos</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">{tenant.productsCount}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Orç.</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">{tenant.quotesCount}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}