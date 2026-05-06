import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Alert } from '../components/Alert';
import { Loading } from '../components/Loading';
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

      <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Catalogo operacional</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">Cadastre uma vez. Reutilize todos os dias.</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          Esta area concentra tudo o que alimenta o orcamento: produtos, perfis de material e perfis de impressora. A ideia e tirar manutencao do caminho do uso diario.
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
            description: 'Base tecnica para padronizar capacidade e custo sem perguntar tudo em cada quote.',
            to: '/catalog/printers',
            action: 'Abrir perfis',
          },
        ].map((card) => (
          <article key={card.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">{card.title}</p>
            <p className="mt-4 text-4xl font-semibold text-slate-900">{card.count}</p>
            <p className="mt-4 text-sm leading-6 text-slate-600">{card.description}</p>
            <Link to={card.to} className="mt-6 inline-flex rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
              {card.action}
            </Link>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Fluxo recomendado de cadastro</h2>
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
                title: 'Use no quote flow',
                description: 'Depois disso, o trabalho diario fica concentrado em escolher, ajustar quantidade e salvar.',
              },
            ].map((item) => (
              <div key={item.step} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                  {item.step}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Sinal de maturidade do catalogo</h2>
          <div className="mt-6 space-y-4 text-sm leading-6 text-slate-700">
            <div className="rounded-2xl bg-white/70 px-4 py-3">
              Produtos com custo base pronto evitam preenchimento manual de preco em toda cotacao nova.
            </div>
            <div className="rounded-2xl bg-white/70 px-4 py-3">
              Materiais e impressoras nao precisam estar perfeitos para comecar, mas precisam existir para o sistema gerar referencia confiavel.
            </div>
            <div className="rounded-2xl bg-white/70 px-4 py-3">
              Quando o catalogo estiver estavel, o time comercial praticamente vive dentro do modulo de orcamentos.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}