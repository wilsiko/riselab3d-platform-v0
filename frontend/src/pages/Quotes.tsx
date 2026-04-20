import { useEffect, useState, FormEvent } from 'react';
import api from '../api';
import { Product, Quote } from '../types';
import { Loading } from '../components/Loading';
import { Alert } from '../components/Alert';
import { Pagination } from '../components/Pagination';

const ITEMS_PER_PAGE = 5;

interface QuoteItemLine {
  productId: string;
  quantidade: number;
  preco_unitario: number;
}

export default function Quotes() {
  const [products, setProducts] = useState<Product[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [clientName, setClientName] = useState('Cliente VIP');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [items, setItems] = useState<QuoteItemLine[]>([
    { productId: '', quantidade: 1, preco_unitario: 0 },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const paginatedQuotes = quotes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );
  const totalPages = Math.ceil(quotes.length / ITEMS_PER_PAGE);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [productsRes, quotesRes] = await Promise.all([
          api.get<Product[]>('/products'),
          api.get<Quote[]>('/quotes'),
        ]);
        setProducts(productsRes.data);
        setQuotes(quotesRes.data);
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Erro ao carregar dados');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const addItem = () => setItems((prev) => [...prev, { productId: '', quantidade: 1, preco_unitario: 0 }]);

  const updateItem = (index: number, partial: Partial<QuoteItemLine>) => {
    setItems((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...partial } : item)));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    // Validação
    if (items.some((item) => !item.productId)) {
      setError('Todos os itens devem ter um produto selecionado');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post<Quote>('/quotes', { nome_cliente: clientName, data: date, items });
      setQuotes((prev) => [response.data, ...prev]);
      setSuccess('Orçamento criado com sucesso!');
      setClientName('');
      setItems([{ productId: '', quantidade: 1, preco_unitario: 0 }]);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erro ao criar orçamento');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Loading isLoading={isLoading} label="Processando orçamento..." />
      
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Orçamentos</h1>
          <p className="mt-2 text-slate-600">Monte orçamentos profissionais e exporte em PDF.</p>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-700">
            Nome do cliente
            <input value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full rounded-2xl border-slate-200 bg-white p-3" required />
          </label>
          <label className="space-y-2 text-sm text-slate-700">
            Data
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-2xl border-slate-200 bg-white p-3" required />
          </label>
        </div>

        <div className="rounded-3xl bg-white p-4 shadow-sm">
          <div className="grid grid-cols-12 gap-4 border-b border-slate-200 pb-3 text-sm font-semibold text-slate-500">
            <span className="col-span-5">Produto</span>
            <span className="col-span-2 text-right">Qtd</span>
            <span className="col-span-3 text-right">Preço unitário</span>
            <span className="col-span-2 text-right">Subtotal</span>
          </div>
          <div className="space-y-3 py-4">
            {items.map((item, index) => {
              const product = products.find((product) => product.id === item.productId);
              const subtotal = item.quantidade * item.preco_unitario;
              return (
                <div key={index} className="grid grid-cols-12 gap-4 text-sm text-slate-700">
                  <select
                    className="col-span-5 rounded-2xl border border-slate-200 bg-white p-3"
                    value={item.productId}
                    onChange={(e) => {
                      const product = products.find((product) => product.id === e.target.value);
                      updateItem(index, {
                        productId: e.target.value,
                        preco_unitario: product ? product.custo_total : item.preco_unitario,
                      });
                    }}
                    required
                  >
                    <option value="">Escolher produto</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.sku} • R$ {product.custo_total.toFixed(2)}
                      </option>
                    ))}
                  </select>
                  <input
                    className="col-span-2 rounded-2xl border border-slate-200 bg-white p-3 text-right"
                    type="number"
                    min="1"
                    value={item.quantidade}
                    onChange={(e) => updateItem(index, { quantidade: Number(e.target.value) })}
                    required
                  />
                  <input
                    className="col-span-3 rounded-2xl border border-slate-200 bg-white p-3 text-right"
                    type="number"
                    step="0.01"
                    value={item.preco_unitario}
                    onChange={(e) => updateItem(index, { preco_unitario: Number(e.target.value) })}
                    required
                  />
                  <div className="col-span-2 text-right text-slate-900">R$ {subtotal.toFixed(2)}</div>
                </div>
              );
            })}
          </div>
          <button type="button" onClick={addItem} className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">
            + Adicionar item
          </button>
        </div>

        <button type="submit" className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
          Gerar orçamento
        </button>
      </form>

      <div className="mt-8 space-y-4">
        {paginatedQuotes.map((quote) => (
          <div key={quote.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-500">Cliente</p>
                <p className="text-lg font-semibold text-slate-900">{quote.nome_cliente}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Total</p>
                <p className="text-lg font-semibold text-slate-900">R$ {quote.valor_total.toFixed(2)}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-600">
              <p>Data: {new Date(quote.data).toLocaleDateString()}</p>
              <a href={`/api/quotes/${quote.id}/pdf`} target="_blank" rel="noreferrer" className="rounded-full bg-slate-900 px-4 py-2 text-white hover:bg-slate-700">
                Baixar PDF
              </a>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
    </div>
  );
}
