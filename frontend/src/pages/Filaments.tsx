import { useEffect, useState, FormEvent } from 'react';
import api from '../api';
import { Alert } from '../components/Alert';
import { Filament } from '../types';
import { formatCurrency, formatDecimalInput, parseDecimalInput } from '../utils/numberFormat';

export default function Filaments() {
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [editingFilamentId, setEditingFilamentId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({ marca: '', lote: '', data_compra: '', tipo: '', custo_por_kg: '120,00' });

  const resetForm = () => {
    setEditingFilamentId(null);
    setForm({ marca: '', lote: '', data_compra: '', tipo: '', custo_por_kg: '120,00' });
  };

  const loadFilaments = async (includeInactive: boolean) => {
    const response = await api.get<Filament[]>('/filaments', { params: includeInactive ? { includeInactive: true } : undefined });
    setFilaments(response.data);
  };

  useEffect(() => {
    loadFilaments(showInactive)
      .catch((requestError: any) => {
        setError(requestError?.response?.data?.error || 'Erro ao carregar filamentos.');
      });
  }, [showInactive]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const custoPorKg = parseDecimalInput(form.custo_por_kg);

    try {
      const payload = {
        ...form,
        custo_por_kg: custoPorKg,
      };
      const response = editingFilamentId
        ? await api.put<Filament>(`/filaments/${editingFilamentId}`, payload)
        : await api.post<Filament>('/filaments', payload);

      setFilaments((currentFilaments) => {
        if (editingFilamentId) {
          return currentFilaments.map((filament) => (filament.id === editingFilamentId ? response.data : filament));
        }

        return [...currentFilaments, response.data];
      });
      resetForm();
      setSuccess(editingFilamentId ? 'Filamento atualizado com sucesso.' : 'Filamento cadastrado com sucesso.');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || 'Erro ao salvar filamento.');
    }
  };

  const handleEdit = (filament: Filament) => {
    setError(null);
    setSuccess(null);
    setEditingFilamentId(filament.id);
    setForm({
      marca: filament.marca,
      lote: filament.lote,
      data_compra: filament.data_compra.slice(0, 10),
      tipo: filament.tipo,
      custo_por_kg: formatDecimalInput(filament.custo_por_kg),
    });
  };

  const handleCancelEdit = () => {
    setError(null);
    setSuccess(null);
    resetForm();
  };

  const handleDelete = async (filament: Filament) => {
    if (!window.confirm(`Deseja realmente desativar o filamento ${filament.marca} / lote ${filament.lote}?`)) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      await api.delete(`/filaments/${filament.id}`);
      if (showInactive) {
        await loadFilaments(true);
      } else {
        setFilaments((currentFilaments) => currentFilaments.filter((currentFilament) => currentFilament.id !== filament.id));
      }

      if (editingFilamentId === filament.id) {
        resetForm();
      }

      setSuccess('Filamento desativado com sucesso.');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || 'Erro ao desativar filamento.');
    }
  };

  const handleReactivate = async (filament: Filament) => {
    setError(null);
    setSuccess(null);

    try {
      const response = await api.patch<Filament>(`/filaments/${filament.id}/reactivate`);

      if (showInactive) {
        setFilaments((currentFilaments) => currentFilaments.map((currentFilament) => (currentFilament.id === filament.id ? response.data : currentFilament)));
      } else {
        setFilaments((currentFilaments) => [...currentFilaments, response.data]);
      }

      setSuccess('Filamento reativado com sucesso.');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || 'Erro ao reativar filamento.');
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Filamentos</h1>
          <p className="mt-2 text-slate-600">Registre insumos e tipos de material dinamicamente.</p>
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

      {error ? <div className="mb-6"><Alert type="error" message={error} onClose={() => setError(null)} /></div> : null}
      {success ? <div className="mb-6"><Alert type="success" message={success} onClose={() => setSuccess(null)} /></div> : null}

      {editingFilamentId ? (
        <div className="mb-6 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
          Editando filamento existente. Atualize os campos abaixo e salve para aplicar as mudanças.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm sm:grid-cols-2 xl:grid-cols-5">
        <label className="space-y-2 text-sm text-slate-700">
          Marca
          <input value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} className="form-control" placeholder="Ex: Prusa" required />
        </label>
        <label className="space-y-2 text-sm text-slate-700">
          Lote
          <input value={form.lote} onChange={(e) => setForm({ ...form, lote: e.target.value })} className="form-control" placeholder="Ex: L001" required />
        </label>
        <label className="space-y-2 text-sm text-slate-700">
          Data de compra
          <input type="date" value={form.data_compra} onChange={(e) => setForm({ ...form, data_compra: e.target.value })} className="form-control" required />
        </label>
        <label className="space-y-2 text-sm text-slate-700">
          Tipo
          <input value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="form-control" placeholder="Ex: PLA" required />
        </label>
        <label className="space-y-2 text-sm text-slate-700">
          Custo por kg
          <input
            type="text"
            inputMode="decimal"
            value={form.custo_por_kg}
            onChange={(e) => setForm({ ...form, custo_por_kg: e.target.value })}
            onBlur={() => {
              const parsedValue = parseDecimalInput(form.custo_por_kg);

              if (Number.isFinite(parsedValue)) {
                setForm((currentForm) => ({
                  ...currentForm,
                  custo_por_kg: formatDecimalInput(parsedValue),
                }));
              }
            }}
            className="form-control"
            placeholder="Ex: 120,50"
            required
          />
        </label>
        <div className="sm:col-span-2 xl:col-span-5">
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
              {editingFilamentId ? 'Salvar alterações' : 'Adicionar filamento'}
            </button>
            {editingFilamentId ? (
              <button type="button" onClick={handleCancelEdit} className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                Cancelar edição
              </button>
            ) : null}
          </div>
        </div>
      </form>

      <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1fr_0.9fr_1fr_0.8fr_0.9fr_1fr_180px] gap-4 bg-slate-50 p-6 text-sm font-semibold text-slate-500">
          <span>Marca</span>
          <span>Lote</span>
          <span>Data de compra</span>
          <span>Tipo</span>
          <span>Custo por kg</span>
          <span>Status</span>
          <span className="text-right">Ações</span>
        </div>
        <div className="divide-y divide-slate-200">
          {filaments.map((filament) => (
            <div key={filament.id} className="grid grid-cols-[1fr_0.9fr_1fr_0.8fr_0.9fr_1fr_180px] gap-4 px-6 py-4 text-sm text-slate-700">
              <span>{filament.marca}</span>
              <span>{filament.lote}</span>
              <span>{new Date(filament.data_compra).toLocaleDateString()}</span>
              <span>{filament.tipo}</span>
              <span>{formatCurrency(filament.custo_por_kg)}</span>
              <span>
                {filament.data_desativacao ? `Desativado em ${new Date(filament.data_desativacao).toLocaleDateString()}` : 'Ativo'}
              </span>
              <div className="flex justify-end gap-2">
                {!filament.data_desativacao ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleEdit(filament)}
                      className="rounded-xl border border-cyan-200 px-3 py-2 font-medium text-cyan-700 transition hover:bg-cyan-50"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(filament)}
                      className="inline-flex items-center justify-center rounded-xl border border-rose-200 px-3 py-2 font-medium text-rose-700 transition hover:bg-rose-50"
                      title="Desativar filamento"
                      aria-label={`Desativar filamento ${filament.marca} lote ${filament.lote}`}
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
                    onClick={() => handleReactivate(filament)}
                    className="inline-flex items-center justify-center rounded-xl border border-emerald-200 px-3 py-2 font-medium text-emerald-700 transition hover:bg-emerald-50"
                    title="Reativar filamento"
                    aria-label={`Reativar filamento ${filament.marca} lote ${filament.lote}`}
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
    </div>
  );
}
