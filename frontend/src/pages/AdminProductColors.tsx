import { FormEvent, useEffect, useState } from 'react';
import api from '../api';
import { Alert } from '../components/Alert';
import { Loading } from '../components/Loading';
import { ProductColor } from '../types';

export default function AdminProductColors() {
  const [productColors, setProductColors] = useState<ProductColor[]>([]);
  const [editingColorId, setEditingColorId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadProductColors = async () => {
      try {
        setIsLoading(true);
        const response = await api.get<ProductColor[]>('/admin/product-colors');
        setProductColors(response.data);
      } catch (requestError: any) {
        setError(requestError?.response?.data?.error || 'Erro ao carregar cores de produto.');
      } finally {
        setIsLoading(false);
      }
    };

    loadProductColors();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      setIsLoading(true);
      const response = editingColorId
        ? await api.put<ProductColor>(`/admin/product-colors/${editingColorId}`, { name })
        : await api.post<ProductColor>('/admin/product-colors', { name });
      setProductColors((currentColors) => {
        if (editingColorId) {
          return currentColors
            .map((currentColor) => (currentColor.id === editingColorId ? response.data : currentColor))
            .sort((left, right) => left.name.localeCompare(right.name));
        }

        return [...currentColors, response.data].sort((left, right) => left.name.localeCompare(right.name));
      });
      setName('');
      setEditingColorId(null);
      setSuccess(editingColorId ? 'Cor atualizada com sucesso.' : 'Cor cadastrada com sucesso.');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || 'Erro ao salvar cor de produto.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleEdit(color: ProductColor) {
    setError(null);
    setSuccess(null);
    setEditingColorId(color.id);
    setName(color.name);
  }

  function handleCancelEdit() {
    setEditingColorId(null);
    setName('');
    setError(null);
    setSuccess(null);
  }

  async function handleDelete(color: ProductColor) {
    setError(null);
    setSuccess(null);

    try {
      setIsLoading(true);
      await api.delete(`/admin/product-colors/${color.id}`);
      setProductColors((currentColors) => currentColors.filter((currentColor) => currentColor.id !== color.id));
      setSuccess('Cor excluída com sucesso.');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || 'Erro ao excluir cor de produto.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <Loading isLoading={isLoading} label="Carregando cores de produto..." />

      <h1 className="text-3xl font-semibold text-slate-900">Cores de Produto</h1>
      <p className="mt-2 text-slate-600">
        Mantenha a lista oficial de cores disponíveis para o cadastro de produtos na plataforma.
      </p>

      {error ? <div className="mt-6"><Alert type="error" message={error} onClose={() => setError(null)} /></div> : null}
      {success ? <div className="mt-6"><Alert type="success" message={success} onClose={() => setSuccess(null)} /></div> : null}

      {editingColorId ? (
        <div className="mt-6 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
          Editando cor existente. Ao salvar, os produtos que usam essa cor também serão atualizados.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-8 flex max-w-3xl flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm sm:flex-row sm:items-end">
        <label className="flex-1 space-y-2 text-sm text-slate-700">
          Nome da cor
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="form-control"
            placeholder="Ex: Grafite"
            required
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
            {editingColorId ? 'Salvar alterações' : 'Cadastrar cor'}
          </button>
          {editingColorId ? (
            <button type="button" onClick={handleCancelEdit} className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
              Cancelar edição
            </button>
          ) : null}
        </div>
      </form>

      <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1fr_180px] gap-4 bg-slate-50 px-6 py-4 text-sm font-semibold text-slate-500">
          <span>Cor</span>
          <span className="text-right">Ações</span>
        </div>
        <div className="divide-y divide-slate-200">
          {productColors.map((productColor) => (
            <div key={productColor.id} className="grid grid-cols-[1fr_180px] gap-4 px-6 py-4 text-sm text-slate-700">
              <span>{productColor.name}</span>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleEdit(productColor)}
                  className="rounded-xl border border-cyan-200 px-3 py-2 font-medium text-cyan-700 transition hover:bg-cyan-50"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(productColor)}
                  className="rounded-xl border border-rose-200 px-3 py-2 font-medium text-rose-700 transition hover:bg-rose-50"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}