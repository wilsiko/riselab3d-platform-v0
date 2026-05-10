import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Alert } from '../components/Alert';
import { Loading } from '../components/Loading';
import { SummaryWidget } from '../components/SummaryWidget';
import { Filament, Printer, Product } from '../types';

export default function Catalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        setIsLoading(true);
        const [productsRes, printersRes, filamentsRes] = await Promise.all([
          api.get<Product[]>('/products'),
          api.get<Printer[]>('/printers'),
          api.get<Filament[]>('/filaments'),
        ]);
        setProducts(productsRes.data);
        setPrinters(printersRes.data);
        setFilaments(filamentsRes.data);
      } catch (requestError: any) {
        setError(requestError?.response?.data?.error || 'Nao foi possivel carregar o catalogo.');
      } finally {
        setIsLoading(false);
      }
    };

    loadCatalog();
  }, []);

  return (
    <div className="space-y-8">
      <Loading isLoading={isLoading} label="Organizando seu catalogo..." />

      <section className="rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(8,14,30,0.96),rgba(7,24,44,0.96),rgba(34,211,238,0.12))] p-8 shadow-[0_28px_90px_rgba(0,0,0,0.28)]">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200">Arquitetura do catalogo</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white">Cadastre uma vez. Reutilize com leitura premium em toda a jornada.</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
          O catalogo deixa de ser manutencao isolada e passa a operar como infraestrutura de cotacao. Produtos, materiais e impressoras abastecem a mesa comercial sem ruir a experiencia.
        </p>
      </section>

      {error ? <Alert type="error" message={error} onClose={() => setError(null)} /> : null}

      <section className="grid gap-6 xl:grid-cols-3">
        {[
          {
            title: 'Produtos',
            count: products.length,
            description: 'Itens prontos para cotacao com custo base calculado e reuso rapido no wizard.',
            to: '/catalog/products',
            action: 'Abrir produtos',
          },
          {
            title: 'Materiais',
            count: filaments.length,
            description: 'Perfis de material usados como referencia de custo e consistencia da operacao.',
            to: '/catalog/materials',
            action: 'Abrir materiais',
          },
          {
            title: 'Perfis de impressora',
            count: printers.length,
            description: 'Base tecnica para padronizar capacidade e custo sem perguntar tudo em cada cotacao.',
            to: '/catalog/printers',
            action: 'Abrir perfis',
          },
        ].map((card) => (
          <article key={card.title} className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.22)]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">{card.title}</p>
            <p className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white">{card.count}</p>
            <p className="mt-4 text-sm leading-6 text-slate-400">{card.description}</p>
            <Link to={card.to} className="mt-6 inline-flex rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
              {card.action}
            </Link>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.22)]">
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">Fluxo recomendado de cadastro</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              {
                step: '1',
                title: 'Defina perfis base',
                description: 'Comece pelos materiais e impressoras que servem como padrao operacional.',
              },
              {
                step: '2',
                title: 'Crie produtos reutilizaveis',
                description: 'Transforme itens recorrentes em atalhos de cotacao para reduzir digitacao repetida.',
              },
              {
                step: '3',
                title: 'Use no fluxo de cotacoes',
                description: 'Depois disso, o trabalho diario fica concentrado em escolher, ajustar quantidade e salvar.',
              },
            ].map((item) => (
              <div key={item.step} className="rounded-[28px] border border-white/10 bg-[#0a1228]/78 p-5">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400 text-sm font-semibold text-slate-950">
                  {item.step}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-teal-400/15 bg-[linear-gradient(180deg,rgba(8,14,30,0.96),rgba(12,32,43,0.96))] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.22)]">
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">Sinal de maturidade do catalogo</h2>
          <div className="mt-6 space-y-4 text-sm leading-6 text-slate-300">
            <div className="rounded-2xl bg-white/[0.06] px-4 py-3">
              Produtos com custo base pronto evitam preenchimento manual de preco em toda cotacao nova.
            </div>
            <div className="rounded-2xl bg-white/[0.06] px-4 py-3">
              Materiais e impressoras nao precisam estar perfeitos para comecar, mas precisam existir para o sistema gerar referencia confiavel.
            </div>
            <div className="rounded-2xl bg-white/[0.06] px-4 py-3">
              Quando o catalogo estiver estavel, o time comercial praticamente vive dentro do modulo de cotacoes.
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryWidget label="Produtos" value={String(products.length)} description="SKU prontos para virarem cotacao com um clique." />
        <SummaryWidget label="Materiais" value={String(filaments.length)} description="Perfis de material padronizados para custo confiavel." />
        <SummaryWidget label="Impressoras" value={String(printers.length)} description="Capacidade tecnica descrita fora do fluxo comercial." />
      </section>
    </div>
  );
}