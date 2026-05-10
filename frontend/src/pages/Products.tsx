import { FormEvent, useEffect, useState } from 'react';
import api from '../api';
import { Alert } from '../components/Alert';
import { Loading } from '../components/Loading';
import { NumericInput } from '../components/NumericInput';
import { Pagination } from '../components/Pagination';
import { SummaryWidget } from '../components/SummaryWidget';
import { Filament, Printer, Product } from '../types';
import { parseLocaleNumber } from '../utils/number';

const ITEMS_PER_PAGE = 6;

interface ProductForm {
  nome: string;
  cor: string;
  variacao: string;
  peso_gramas: number;
  tempo_impressao_horas: number;
  printerId: string;
  filamentId: string;
  additional_cost: number;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function Products() {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [form, setForm] = useState<ProductForm>({
    nome: '',
    cor: '',
    variacao: '',
    peso_gramas: 50,
    tempo_impressao_horas: 1,
    printerId: '',
    filamentId: '',
    additional_cost: 0,
  });
  const [result, setResult] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const paginatedProducts = products.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [printersRes, filamentsRes, productsRes] = await Promise.all([
          api.get<Printer[]>('/printers'),
          api.get<Filament[]>('/filaments'),
          api.get<Product[]>('/products'),
        ]);
        setPrinters(printersRes.data);
        setFilaments(filamentsRes.data);
        setProducts(productsRes.data);
      } catch (requestError: any) {
        setError(requestError?.response?.data?.error || 'Erro ao carregar dados do catalogo de produtos.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const response = await api.post('/products', form);
      setResult(response.data.product);
      setProducts((previousProducts) => [...previousProducts, response.data.product]);
      setSuccess('Produto criado com sucesso e liberado para o fluxo de cotacoes.');
      setForm((currentForm) => ({ ...currentForm, nome: '', cor: '', variacao: '' }));
    } catch (requestError: any) {
      const errorMessage = requestError?.response?.data?.error || requestError?.response?.data?.errors?.[0]?.message || 'Erro ao criar produto';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Loading isLoading={isLoading} label="Sincronizando produtos e custos..." />

      <section className="rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(8,14,30,0.96),rgba(7,24,44,0.96),rgba(34,211,238,0.12))] p-8 shadow-[0_28px_90px_rgba(0,0,0,0.28)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">Design de SKU</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white">Produtos com contexto tecnico claro e custo pronto para cotacao.</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          Esta tela deixa de ser um formulario frio e vira um atelier de SKU. Cada item nasce com material, impressora e custo base prontos para o espaco comercial.
        </p>
      </section>

      {error ? <Alert type="error" message={error} onClose={() => setError(null)} /> : null}
      {success ? <Alert type="success" message={success} onClose={() => setSuccess(null)} /> : null}

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryWidget label="Produtos ativos" value={String(products.length)} description="SKUs prontos para entrar na cotacao sem digitacao manual." />
        <SummaryWidget label="Perfis tecnicos" value={String(printers.length + filaments.length)} description="Soma de impressoras e materiais disponiveis para combinacao." />
        <SummaryWidget label="Ultimo custo" value={result ? formatCurrency(result.custo_total) : 'Aguardando'} description="Resultado mais recente criado nesta sessao." />
      </section>

      <form onSubmit={handleSubmit} className="rounded-[34px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.22)]">
        <div className="border-b border-white/10 pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">Novo SKU</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Montar novo produto</h2>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          <label className="block rounded-[28px] border border-white/10 bg-[#0a1228]/78 p-4">
            <span className="mb-2 block text-sm font-medium text-slate-200">Nome do produto</span>
            <input value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} className="w-full rounded-2xl border border-white/10 bg-[#081120] p-3 text-white" required />
          </label>

          <label className="block rounded-[28px] border border-white/10 bg-[#0a1228]/78 p-4">
            <span className="mb-2 block text-sm font-medium text-slate-200">Cor</span>
            <input value={form.cor} onChange={(event) => setForm({ ...form, cor: event.target.value })} className="w-full rounded-2xl border border-white/10 bg-[#081120] p-3 text-white" required />
          </label>

          <label className="block rounded-[28px] border border-white/10 bg-[#0a1228]/78 p-4">
            <span className="mb-2 block text-sm font-medium text-slate-200">Variacao</span>
            <input value={form.variacao} onChange={(event) => setForm({ ...form, variacao: event.target.value })} className="w-full rounded-2xl border border-white/10 bg-[#081120] p-3 text-white" required />
          </label>

          <NumericInput label="Peso" value={String(form.peso_gramas)} onChange={(value) => setForm({ ...form, peso_gramas: parseLocaleNumber(value) })} suffix="g" hint="massa" />
          <NumericInput label="Tempo de impressao" value={String(form.tempo_impressao_horas)} onChange={(value) => setForm({ ...form, tempo_impressao_horas: parseLocaleNumber(value) })} suffix="h" hint="job" />
          <NumericInput label="Custos adicionais" value={String(form.additional_cost)} onChange={(value) => setForm({ ...form, additional_cost: parseLocaleNumber(value) })} prefix="R$" hint="extra" />

          <label className="block rounded-[28px] border border-white/10 bg-[#0a1228]/78 p-4">
            <span className="mb-2 block text-sm font-medium text-slate-200">Impressora</span>
            <select value={form.printerId} onChange={(event) => setForm({ ...form, printerId: event.target.value })} className="w-full rounded-2xl border border-white/10 bg-[#081120] p-3 text-white" required>
              <option value="">Selecione</option>
              {printers.map((printer) => (
                <option key={printer.id} value={printer.id}>
                  {printer.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="block rounded-[28px] border border-white/10 bg-[#0a1228]/78 p-4">
            <span className="mb-2 block text-sm font-medium text-slate-200">Material</span>
            <select value={form.filamentId} onChange={(event) => setForm({ ...form, filamentId: event.target.value })} className="w-full rounded-2xl border border-white/10 bg-[#081120] p-3 text-white" required>
              <option value="">Selecione</option>
              {filaments.map((filament) => (
                <option key={filament.id} value={filament.id}>
                  {filament.marca} / {filament.tipo}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button type="submit" className="mt-6 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
          Criar produto e SKU
        </button>
      </form>

      {result ? (
        <section className="rounded-[34px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.22)]">
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">Produto criado</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <SummaryWidget label="SKU" value={result.sku} description="Codigo pronto para compor biblioteca e historico." />
            <SummaryWidget label="Produto" value={result.nome} description="Nome comercial salvo nesta sessao." />
            <SummaryWidget label="Custo total" value={formatCurrency(result.custo_total)} description="Base financeira que alimenta a cotacao." />
          </div>
        </section>
      ) : null}

      <section className="rounded-[34px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.22)]">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">SKU library</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Produtos registrados</h2>
          </div>
          <p className="text-sm text-slate-400">Cards legiveis e prontos para consulta rapida.</p>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {paginatedProducts.map((product) => (
            <article key={product.id} className="rounded-[30px] border border-white/10 bg-[#0a1228]/78 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{product.sku}</p>
                  <h3 className="mt-3 text-lg font-semibold text-white">{product.nome}</h3>
                  <p className="mt-2 text-sm text-slate-400">{product.cor} • {product.variacao}</p>
                </div>
                <div className="rounded-full bg-cyan-400/12 px-4 py-2 text-sm font-semibold text-cyan-200">{formatCurrency(product.custo_total)}</div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tempo</p>
                  <p className="mt-2 text-sm font-semibold text-white">{product.tempo_impressao_horas} h</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Impressora</p>
                  <p className="mt-2 text-sm font-semibold text-white">{product.printer.nome}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Material</p>
                  <p className="mt-2 text-sm font-semibold text-white">{product.filament.marca}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        {totalPages > 1 ? <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} /> : null}
      </section>
    </div>
  );
}