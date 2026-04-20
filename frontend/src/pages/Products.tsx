import { useEffect, useState, FormEvent } from 'react';
import api from '../api';
import { Filament, Printer, Product } from '../types';
import { Loading } from '../components/Loading';
import { Alert } from '../components/Alert';
import { Pagination } from '../components/Pagination';

const ITEMS_PER_PAGE = 5;

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

  const paginatedProducts = products.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );
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
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Erro ao carregar dados');
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
      setProducts((prev) => [...prev, response.data.product]);
      setSuccess('Produto criado com sucesso!');
      setForm({ ...form, nome: '', cor: '', variacao: '' });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.response?.data?.errors?.[0]?.message || 'Erro ao criar produto';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Loading isLoading={isLoading} label="Processando..." />
      
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Produtos / SKU</h1>
          <p className="mt-2 text-slate-600">Crie SKUs com cálculo automático de custo e amortização.</p>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      <form onSubmit={handleSubmit} className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm xl:grid-cols-2">
        <label className="space-y-2 text-sm text-slate-700">
          Nome do produto
          <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="w-full rounded-2xl border-slate-200 bg-white p-3" required />
        </label>
        <label className="space-y-2 text-sm text-slate-700">
          Cor
          <input value={form.cor} onChange={(e) => setForm({ ...form, cor: e.target.value })} className="w-full rounded-2xl border-slate-200 bg-white p-3" required />
        </label>
        <label className="space-y-2 text-sm text-slate-700">
          Variação
          <input value={form.variacao} onChange={(e) => setForm({ ...form, variacao: e.target.value })} className="w-full rounded-2xl border-slate-200 bg-white p-3" required />
        </label>
        <label className="space-y-2 text-sm text-slate-700">
          Peso (g)
          <input type="number" value={form.peso_gramas} onChange={(e) => setForm({ ...form, peso_gramas: Number(e.target.value) })} className="w-full rounded-2xl border-slate-200 bg-white p-3" required />
        </label>
        <label className="space-y-2 text-sm text-slate-700">
          Tempo de impressão (h)
          <input type="number" step="0.1" value={form.tempo_impressao_horas} onChange={(e) => setForm({ ...form, tempo_impressao_horas: Number(e.target.value) })} className="w-full rounded-2xl border-slate-200 bg-white p-3" required />
        </label>
        <label className="space-y-2 text-sm text-slate-700">
          Impressora
          <select value={form.printerId} onChange={(e) => setForm({ ...form, printerId: e.target.value })} className="w-full rounded-2xl border-slate-200 bg-white p-3" required>
            <option value="">Selecione</option>
            {printers.map((printer) => (
              <option key={printer.id} value={printer.id}>
                {printer.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm text-slate-700">
          Filamento
          <select value={form.filamentId} onChange={(e) => setForm({ ...form, filamentId: e.target.value })} className="w-full rounded-2xl border-slate-200 bg-white p-3" required>
            <option value="">Selecione</option>
            {filaments.map((filament) => (
              <option key={filament.id} value={filament.id}>
                {filament.marca} / {filament.tipo}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm text-slate-700">
          Custos adicionais
          <input type="number" step="0.01" value={form.additional_cost} onChange={(e) => setForm({ ...form, additional_cost: Number(e.target.value) })} className="w-full rounded-2xl border-slate-200 bg-white p-3" />
        </label>
        <div className="xl:col-span-2">
          <button type="submit" className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
            Criar produto e SKU
          </button>
        </div>
      </form>

      {result && (
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Produto criado</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">SKU</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{result.sku}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Produto</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{result.nome}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Custo total</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">R$ {result.custo_total.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-6 gap-4 p-6 text-sm font-semibold text-slate-500 bg-slate-50">
          <span>SKU</span>
          <span>Nome</span>
          <span>Cor</span>
          <span>Tempo</span>
          <span>Custo Total</span>
          <span>Filamento</span>
        </div>
        <div className="divide-y divide-slate-200">
          {paginatedProducts.map((product) => (
            <div key={product.id} className="grid grid-cols-6 gap-4 px-6 py-4 text-sm text-slate-700">
              <span>{product.sku}</span>
              <span>{product.nome}</span>
              <span>{product.cor}</span>
              <span>{product.tempo_impressao_horas}h</span>
              <span>R$ {product.custo_total.toFixed(2)}</span>
              <span>{product.filament.marca}</span>
            </div>
          ))}
        </div>
      </div>

      {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
    </div>
  );
}
