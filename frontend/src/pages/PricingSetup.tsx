import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Alert } from '../components/Alert';
import { Loading } from '../components/Loading';
import { NumericInput } from '../components/NumericInput';
import { SummaryWidget } from '../components/SummaryWidget';
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
      setSuccess('Base de energia atualizada. Novas cotacoes passam a usar esse valor como referencia.');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || 'Nao foi possivel salvar a regra de energia.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <Loading isLoading={isLoading} label="Ajustando sua engrenagem de precos..." />

      <section className="rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(8,14,30,0.96),rgba(7,24,44,0.96),rgba(99,102,241,0.12))] p-8 shadow-[0_28px_90px_rgba(0,0,0,0.28)]">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200">Sistema de precificacao</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white">Regras de custo com leitura de produto, nao tela administrativa comum.</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
          Energia, presets de canal e qualidade da base ficam isolados numa area clara, leve e comercialmente legivel. A cotacao herda tudo isso sem poluicao visual.
        </p>
      </section>

      {error ? <Alert type="error" message={error} onClose={() => setError(null)} /> : null}
      {success ? <Alert type="success" message={success} onClose={() => setSuccess(null)} /> : null}

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <form onSubmit={handleSubmit} className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.22)]">
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">Base de custo ativa</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Comece pelo valor mais sensivel do calculo. Depois, toda cotacao herda essa referencia com consistencia.</p>

          <div className="mt-6 rounded-[28px] border border-white/10 bg-[#0a1228]/78 p-5">
            <p className="text-sm text-slate-400">Custo atual do kWh</p>
            <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-cyan-200">{formatCurrency(settings.custo_kwh)}</p>
          </div>

          <div className="mt-6">
            <NumericInput
              label="Novo custo do kWh"
              value={String(energyCost)}
              onChange={(value) => setEnergyCost(Number(value) || 0)}
              prefix="R$"
              hint="energia"
            />
          </div>

          <button type="submit" className="mt-6 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
            Salvar base de energia
          </button>
        </form>

        <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.22)]">
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">Presets de canal</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">A mesa de cotacao usa um preset por contexto de venda para acelerar decisao sem perder coerencia.</p>

          <div className="mt-6 space-y-4">
            {SALE_CHANNELS.map((channel) => (
              <div key={channel.id} className="rounded-[28px] border border-white/10 bg-[#0a1228]/78 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-white">{channel.label}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">{channel.description}</p>
                  </div>
                  <div className="rounded-full bg-cyan-400/12 px-4 py-2 text-sm font-semibold text-cyan-200">
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
            actionLabel: 'Abrir produtos',
          },
          {
            title: 'Cadastrar impressoras',
            value: printers.length,
            description: 'Perfis tecnicos reduzem perguntas operacionais durante a cotacao e alimentam automaticamente o consumo em watts.',
            to: '/catalog/printers',
            actionLabel: 'Abrir cadastro de impressoras',
          },
          {
            title: 'Perfis de material',
            value: filaments.length,
            description: 'Materiais padronizados ajudam a manter consistencia de custo e linguagem.',
            to: '/catalog/materials',
            actionLabel: 'Abrir materiais',
          },
        ].map((card) => (
          <article key={card.title} className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.22)]">
            <p className="text-sm text-slate-400">{card.title}</p>
            <p className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-white">{card.value}</p>
            <p className="mt-4 text-sm leading-6 text-slate-400">{card.description}</p>
            <Link to={card.to} className="mt-6 inline-flex text-sm font-semibold text-cyan-200 transition hover:text-cyan-100">
              {card.actionLabel}
            </Link>
          </article>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryWidget label="Energia ativa" value={formatCurrency(settings.custo_kwh)} description="Referencia padrao aplicada automaticamente no fluxo comercial." />
        <SummaryWidget label="Catalogo de produtos" value={String(products.length)} description="Quanto maior essa base, menor o atrito da cotacao diaria." />
        <SummaryWidget label="Base tecnica" value={String(printers.length + filaments.length)} description="Soma de impressoras e materiais operando como infraestrutura." />
      </section>
    </div>
  );
}