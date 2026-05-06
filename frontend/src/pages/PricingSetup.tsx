import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Alert } from '../components/Alert';
import { Loading } from '../components/Loading';
import { SALE_CHANNELS } from '../constants/pricing';
import { Filament, Printer, Product, Settings } from '../types';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function PricingSetup() {
  const [settings, setSettings] = useState<Settings>({ custo_kwh: 1.05 });
  const [energyCost, setEnergyCost] = useState(1.05);
  const [products, setProducts] = useState<Product[]>([]);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadPricing = async () => {
      try {
        setIsLoading(true);
        const [settingsRes, productsRes, printersRes, filamentsRes] = await Promise.all([
          api.get<Settings>('/settings'),
          api.get<Product[]>('/products'),
          api.get<Printer[]>('/printers'),
          api.get<Filament[]>('/filaments'),
        ]);
        setSettings(settingsRes.data);
        setEnergyCost(settingsRes.data.custo_kwh);
        setProducts(productsRes.data);
        setPrinters(printersRes.data);
        setFilaments(filamentsRes.data);
      } catch (requestError: any) {
        setError(requestError?.response?.data?.error || 'Nao foi possivel carregar as configuracoes de precificacao.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPricing();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      setIsLoading(true);
      const response = await api.put<Settings>('/settings', { custo_kwh: energyCost });
      setSettings(response.data);
      setSuccess('Base de energia atualizada. Novos orcamentos passam a usar esse valor como referencia.');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || 'Nao foi possivel salvar a regra de energia.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <Loading isLoading={isLoading} label="Ajustando sua engrenagem de precos..." />

      <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Pricing setup</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">Regras de custo e padroes do negocio, fora do caminho do uso diario.</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          Esta area concentra o que muda pouco: referencia de energia, qualidade do catalogo e presets de margem por canal. O objetivo e dar coerencia sem exigir ajuste manual em cada orcamento.
        </p>
      </section>

      {error ? <Alert type="error" message={error} onClose={() => setError(null)} /> : null}
      {success ? <Alert type="success" message={success} onClose={() => setSuccess(null)} /> : null}

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Base de custo ativa</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Comece pelo valor mais sensivel do seu calculo. O resto do fluxo diario deve herdar esse padrao automaticamente.</p>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Custo atual do kWh</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{formatCurrency(settings.custo_kwh)}</p>
          </div>

          <label className="mt-6 block space-y-2 text-sm text-slate-700">
            Novo custo do kWh
            <input
              type="number"
              step="0.01"
              min="0"
              value={energyCost}
              onChange={(event) => setEnergyCost(Number(event.target.value))}
              className="w-full rounded-2xl border border-slate-200 bg-white p-3"
            />
          </label>

          <button type="submit" className="mt-6 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
            Salvar base de energia
          </button>
        </form>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Presets de canal</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">O fluxo novo de cotacao usa um preset por contexto de venda para acelerar a decisao comercial.</p>

          <div className="mt-6 space-y-4">
            {SALE_CHANNELS.map((channel) => (
              <div key={channel.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{channel.label}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{channel.description}</p>
                  </div>
                  <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                    {channel.marginPercent}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        {[
          {
            title: 'Produtos prontos',
            value: products.length,
            description: 'Quanto mais produtos preparados, menos digitacao no fluxo diario.',
            to: '/catalog/products',
          },
          {
            title: 'Perfis de impressora',
            value: printers.length,
            description: 'Perfis tecnicos reduzem perguntas operacionais durante a cotacao.',
            to: '/catalog/printers',
          },
          {
            title: 'Perfis de material',
            value: filaments.length,
            description: 'Materiais padronizados ajudam a manter consistencia de custo e linguagem.',
            to: '/catalog/materials',
          },
        ].map((card) => (
          <article key={card.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">{card.title}</p>
            <p className="mt-3 text-4xl font-semibold text-slate-900">{card.value}</p>
            <p className="mt-4 text-sm leading-6 text-slate-600">{card.description}</p>
            <Link to={card.to} className="mt-6 inline-flex text-sm font-semibold text-cyan-700 transition hover:text-cyan-900">
              Abrir area relacionada
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}