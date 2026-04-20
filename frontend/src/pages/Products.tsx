import { useEffect, useState, FormEvent } from 'react';
import api from '../api';
import { Filament, Product, ProductColor } from '../types';
import { Loading } from '../components/Loading';
import { Alert } from '../components/Alert';
import { Pagination } from '../components/Pagination';
import { formatCurrency, formatDecimalInput, parseDecimalInput, parseNumberInputValue } from '../utils/numberFormat';

const ITEMS_PER_PAGE = 5;

interface ProductForm {
  nome: string;
  cor: string;
  variacao: string;
  peso_gramas: string;
  tempo_impressao_horas: string;
  filamentId: string;
  additional_cost: string;
  falha_percentual: number | '';
}

function buildSkuPreview(nome: string, cor: string, variacao: string) {
  const toPascalCaseSegment = (value: string) =>
    value
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
      .join('');

  return [nome, cor, variacao].map(toPascalCaseSegment).join('');
}

export default function Products() {
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [productColors, setProductColors] = useState<ProductColor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [form, setForm] = useState<ProductForm>({
    nome: '',
    cor: '',
    variacao: '',
    peso_gramas: '50,00',
    tempo_impressao_horas: '1,00',
    filamentId: '',
    additional_cost: '0,00',
    falha_percentual: 10,
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
  const skuPreview = buildSkuPreview(form.nome, form.cor, form.variacao);

  const resetForm = () => {
    setEditingProductId(null);
    setForm({
      nome: '',
      cor: '',
      variacao: '',
      peso_gramas: '50,00',
      tempo_impressao_horas: '1,00',
      filamentId: '',
      additional_cost: '0,00',
      falha_percentual: 10,
    });
  };

  const loadData = async (includeInactive: boolean) => {
    setIsLoading(true);

    try {
      const [filamentsRes, productColorsRes, productsRes] = await Promise.all([
        api.get<Filament[]>('/filaments'),
        api.get<ProductColor[]>('/product-colors'),
        api.get<Product[]>('/products', { params: includeInactive ? { includeInactive: true } : undefined }),
      ]);
      setFilaments(filamentsRes.data);
      setProductColors(productColorsRes.data);
      setProducts(productsRes.data);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(showInactive);
  }, [showInactive]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setResult(null);
    setIsLoading(true);

    if (form.peso_gramas === '' || form.tempo_impressao_horas === '' || form.falha_percentual === '') {
      setError('Preencha peso, tempo de impressão e falhas estimadas antes de salvar o produto.');
      setIsLoading(false);
      return;
    }

    const parsedWeight = parseDecimalInput(form.peso_gramas);
    const parsedPrintTime = parseDecimalInput(form.tempo_impressao_horas);

    if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
      setError('O peso deve ser um valor válido maior que zero.');
      setIsLoading(false);
      return;
    }

    if (!Number.isFinite(parsedPrintTime) || parsedPrintTime <= 0) {
      setError('O tempo de impressão deve ser um valor válido maior que zero.');
      setIsLoading(false);
      return;
    }

    if (/\s/.test(form.nome.trim())) {
      setError('O nome do produto deve conter apenas uma palavra.');
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        ...form,
        peso_gramas: parsedWeight,
        tempo_impressao_horas: parsedPrintTime,
        falha_percentual: Number(form.falha_percentual),
        additional_cost: parseDecimalInput(form.additional_cost),
      };
      const response = editingProductId
        ? await api.put(`/products/${editingProductId}`, payload)
        : await api.post('/products', payload);
      setResult(response.data.product);
      setProducts((prev) => {
        if (editingProductId) {
          return prev.map((product) => (product.id === editingProductId ? response.data.product : product));
        }

        return [...prev, response.data.product];
      });
      setSuccess(editingProductId ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!');
      resetForm();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.response?.data?.errors?.[0]?.message || 'Erro ao salvar produto';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProductId(product.id);
    setError(null);
    setSuccess(null);
    setResult(null);
    setForm({
      nome: product.nome,
      cor: product.cor,
      variacao: product.variacao,
      peso_gramas: formatDecimalInput(product.peso_gramas),
      tempo_impressao_horas: formatDecimalInput(product.tempo_impressao_horas),
      filamentId: product.filament.id,
      additional_cost: formatDecimalInput(product.custo_adicional),
      falha_percentual: product.falha_percentual,
    });
  };

  const handleCancelEdit = () => {
    setError(null);
    setSuccess(null);
    setResult(null);
    resetForm();
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`Deseja realmente desativar o produto ${product.sku}?`)) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      await api.delete(`/products/${product.id}`);

      if (showInactive) {
        await loadData(true);
      } else {
        setProducts((currentProducts) => currentProducts.filter((currentProduct) => currentProduct.id !== product.id));
      }

      if (editingProductId === product.id) {
        resetForm();
      }

      setSuccess('Produto desativado com sucesso.');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || 'Erro ao desativar produto.');
    }
  };

  const handleReactivate = async (product: Product) => {
    setError(null);
    setSuccess(null);

    try {
      const response = await api.patch<Product>(`/products/${product.id}/reactivate`);

      if (showInactive) {
        setProducts((currentProducts) => currentProducts.map((currentProduct) => (currentProduct.id === product.id ? response.data : currentProduct)));
      } else {
        setProducts((currentProducts) => [...currentProducts, response.data]);
      }

      setSuccess('Produto reativado com sucesso.');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || 'Erro ao reativar produto.');
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
        <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(event) => setShowInactive(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
          />
          Exibir desativados
        </label>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      {editingProductId ? (
        <div className="mb-6 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
          Editando produto existente. Atualize os campos abaixo e salve para aplicar as mudanças.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm xl:grid-cols-2">
        <label className="space-y-2 text-sm text-slate-700">
          Nome do produto
          <input
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value.replace(/\s+/g, '') })}
            className="form-control"
            placeholder="Ex: Suporte"
            required
          />
          <p className="text-xs text-slate-500">Use apenas uma palavra para o nome do produto.</p>
        </label>
        <label className="space-y-2 text-sm text-slate-700">
          Cor
          <select value={form.cor} onChange={(e) => setForm({ ...form, cor: e.target.value })} className="form-control" required>
            <option value="">Selecione uma cor</option>
            {productColors.map((color) => (
              <option key={color.id} value={color.name}>
                {color.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm text-slate-700">
          Variação
          <input value={form.variacao} onChange={(e) => setForm({ ...form, variacao: e.target.value })} className="form-control" required />
        </label>
        <label className="space-y-2 text-sm text-slate-700">
          Peso (g)
          <input
            type="text"
            inputMode="decimal"
            value={form.peso_gramas}
            onChange={(e) => setForm({ ...form, peso_gramas: e.target.value })}
            onBlur={() => {
              const parsedValue = parseDecimalInput(form.peso_gramas);

              if (Number.isFinite(parsedValue)) {
                setForm((currentForm) => ({
                  ...currentForm,
                  peso_gramas: formatDecimalInput(parsedValue),
                }));
              }
            }}
            className="form-control"
            placeholder="Ex: 50,50"
            required
          />
        </label>
        <label className="space-y-2 text-sm text-slate-700">
          Tempo de impressão (h)
          <input
            type="text"
            inputMode="decimal"
            value={form.tempo_impressao_horas}
            onChange={(e) => setForm({ ...form, tempo_impressao_horas: e.target.value })}
            onBlur={() => {
              const parsedValue = parseDecimalInput(form.tempo_impressao_horas);

              if (Number.isFinite(parsedValue)) {
                setForm((currentForm) => ({
                  ...currentForm,
                  tempo_impressao_horas: formatDecimalInput(parsedValue),
                }));
              }
            }}
            className="form-control"
            placeholder="Ex: 1,50"
            required
          />
        </label>
        <label className="space-y-2 text-sm text-slate-700">
          Filamento
          <select value={form.filamentId} onChange={(e) => setForm({ ...form, filamentId: e.target.value })} className="form-control" required>
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
          <input
            type="text"
            inputMode="decimal"
            value={form.additional_cost}
            onChange={(e) => setForm({ ...form, additional_cost: e.target.value })}
            onBlur={() => {
              const parsedValue = parseDecimalInput(form.additional_cost);

              if (Number.isFinite(parsedValue)) {
                setForm((currentForm) => ({
                  ...currentForm,
                  additional_cost: formatDecimalInput(parsedValue),
                }));
              }
            }}
            className="form-control"
          />
        </label>
        <label className="space-y-2 text-sm text-slate-700">
          Falhas estimadas (%)
          <input type="number" min="0" step="0.1" value={form.falha_percentual} onChange={(e) => setForm({ ...form, falha_percentual: parseNumberInputValue(e.target.value) })} className="form-control" />
        </label>
        <div className="xl:col-span-2">
          <div className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            <span className="font-medium text-slate-900">SKU previsto:</span>{' '}
            {skuPreview || 'Preencha nome, cor e variação'}
          </div>
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            A impressora será escolhida no momento do orçamento e o custo final será recalculado com base nela.
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
              {editingProductId ? 'Salvar alterações' : 'Criar produto e SKU'}
            </button>
            {editingProductId ? (
              <button type="button" onClick={handleCancelEdit} className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                Cancelar edição
              </button>
            ) : null}
          </div>
        </div>
      </form>

      {result && (
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Produto salvo</h2>
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
              <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(result.custo_total)}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Falhas estimadas</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{result.falha_percentual.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1.1fr_0.8fr_0.8fr_0.8fr_0.8fr_1fr_1fr_1fr_180px] gap-4 bg-slate-50 p-6 text-sm font-semibold text-slate-500">
          <span>SKU</span>
          <span>Nome</span>
          <span>Cor</span>
          <span>Tempo</span>
          <span>Falhas</span>
          <span>Custo Total</span>
          <span>Filamento</span>
          <span>Status</span>
          <span className="text-right">Ações</span>
        </div>
        <div className="divide-y divide-slate-200">
          {paginatedProducts.map((product) => (
            <div key={product.id} className="grid grid-cols-[1.1fr_0.8fr_0.8fr_0.8fr_0.8fr_1fr_1fr_1fr_180px] gap-4 px-6 py-4 text-sm text-slate-700">
              <span>{product.sku}</span>
              <span>{product.nome}</span>
              <span>{product.cor}</span>
              <span>{product.tempo_impressao_horas}h</span>
              <span>{product.falha_percentual.toFixed(1)}%</span>
              <span>{formatCurrency(product.custo_total)}</span>
              <span>{product.filament.marca}</span>
              <span>
                {product.data_desativacao ? `Desativado em ${new Date(product.data_desativacao).toLocaleDateString()}` : 'Ativo'}
              </span>
              <div className="flex justify-end gap-2">
                {!product.data_desativacao ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleEdit(product)}
                      className="rounded-xl border border-cyan-200 px-3 py-2 font-medium text-cyan-700 transition hover:bg-cyan-50"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(product)}
                      className="inline-flex items-center justify-center rounded-xl border border-rose-200 px-3 py-2 font-medium text-rose-700 transition hover:bg-rose-50"
                      title="Desativar produto"
                      aria-label={`Desativar produto ${product.sku}`}
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3 6h18" />
                        <path d="M8 6V4h8v2" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                      </svg>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleReactivate(product)}
                    className="inline-flex items-center justify-center rounded-xl border border-emerald-200 px-3 py-2 font-medium text-emerald-700 transition hover:bg-emerald-50"
                    title="Reativar produto"
                    aria-label={`Reativar produto ${product.sku}`}
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 12a9 9 0 1 1-3.2-6.9" />
                      <path d="M21 3v6h-6" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
    </div>
  );
}
