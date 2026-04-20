import { FormEvent, useEffect, useState } from 'react';
import api from '../api';
import { Alert } from '../components/Alert';
import { Loading } from '../components/Loading';
import { PrinterModel } from '../types';
import { parseNumberInputValue } from '../utils/numberFormat';

export default function AdminPrinterModels() {
  const [printerModels, setPrinterModels] = useState<PrinterModel[]>([]);
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    consumoWattsPadrao: 120 as number | '',
    vidaUtilHorasPadrao: 2000 as number | '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadPrinterModels = async () => {
      try {
        setIsLoading(true);
        const response = await api.get<PrinterModel[]>('/admin/printer-models');
        setPrinterModels(response.data);
      } catch (requestError: any) {
        setError(requestError?.response?.data?.error || 'Erro ao carregar modelos de impressora.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPrinterModels();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (form.consumoWattsPadrao === '' || form.vidaUtilHorasPadrao === '') {
      setError('Preencha consumo e vida útil padrão antes de cadastrar o modelo.');
      return;
    }

    try {
      setIsLoading(true);
      const payload = {
        ...form,
        consumoWattsPadrao: Number(form.consumoWattsPadrao),
        vidaUtilHorasPadrao: Number(form.vidaUtilHorasPadrao),
      };
      const response = editingModelId
        ? await api.put<PrinterModel>(`/admin/printer-models/${editingModelId}`, payload)
        : await api.post<PrinterModel>('/admin/printer-models', payload);

      setPrinterModels((currentModels) => {
        if (editingModelId) {
          return currentModels
            .map((currentModel) => (currentModel.id === editingModelId ? response.data : currentModel))
            .sort((left, right) => left.name.localeCompare(right.name));
        }

        return [...currentModels, response.data].sort((left, right) => left.name.localeCompare(right.name));
      });
      setForm({
        name: '',
        consumoWattsPadrao: 120,
        vidaUtilHorasPadrao: 2000,
      });
      setEditingModelId(null);
      setSuccess(editingModelId ? 'Modelo atualizado com sucesso.' : 'Modelo cadastrado com sucesso.');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || 'Erro ao salvar modelo de impressora.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleEdit(printerModel: PrinterModel) {
    setError(null);
    setSuccess(null);
    setEditingModelId(printerModel.id);
    setForm({
      name: printerModel.name,
      consumoWattsPadrao: printerModel.consumoWattsPadrao,
      vidaUtilHorasPadrao: printerModel.vidaUtilHorasPadrao,
    });
  }

  function handleCancelEdit() {
    setEditingModelId(null);
    setForm({
      name: '',
      consumoWattsPadrao: 120,
      vidaUtilHorasPadrao: 2000,
    });
    setError(null);
    setSuccess(null);
  }

  return (
    <div>
      <Loading isLoading={isLoading} label="Carregando modelos de impressora..." />

      <h1 className="text-3xl font-semibold text-slate-900">Modelos de Impressora</h1>
      <p className="mt-2 text-slate-600">
        Mantenha a lista oficial de modelos disponíveis para cadastro nas empresas da plataforma.
      </p>

      {error ? <div className="mt-6"><Alert type="error" message={error} onClose={() => setError(null)} /></div> : null}
      {success ? <div className="mt-6"><Alert type="success" message={success} onClose={() => setSuccess(null)} /></div> : null}

      {editingModelId ? (
        <div className="mt-6 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
          Editando modelo existente. Atualize os campos abaixo e salve para aplicar as mudanças.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-8 grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm lg:max-w-4xl lg:grid-cols-3">
        <label className="space-y-2 text-sm text-slate-700">
          Nome do modelo
          <input
            value={form.name}
            onChange={(event) => setForm((currentForm) => ({ ...currentForm, name: event.target.value }))}
            className="form-control"
            placeholder="Ex: A1 Mini"
            required
          />
        </label>
        <label className="space-y-2 text-sm text-slate-700">
          Consumo padrão (W)
          <input
            type="number"
            min="1"
            value={form.consumoWattsPadrao}
            onChange={(event) => setForm((currentForm) => ({ ...currentForm, consumoWattsPadrao: parseNumberInputValue(event.target.value) }))}
            className="form-control"
            required
          />
        </label>
        <label className="space-y-2 text-sm text-slate-700">
          Vida útil padrão (h)
          <input
            type="number"
            min="1"
            value={form.vidaUtilHorasPadrao}
            onChange={(event) => setForm((currentForm) => ({ ...currentForm, vidaUtilHorasPadrao: parseNumberInputValue(event.target.value) }))}
            className="form-control"
            required
          />
        </label>
        <div className="flex flex-wrap gap-3 lg:col-span-3 lg:justify-self-start">
          <button type="submit" className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
            {editingModelId ? 'Salvar alterações' : 'Cadastrar modelo'}
          </button>
          {editingModelId ? (
            <button type="button" onClick={handleCancelEdit} className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
              Cancelar edição
            </button>
          ) : null}
        </div>
      </form>

      <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1.4fr_1fr_1fr_120px] gap-4 bg-slate-50 px-6 py-4 text-sm font-semibold text-slate-500">
          <span>Modelo</span>
          <span>Consumo padrão</span>
          <span>Vida útil padrão</span>
          <span className="text-right">Ações</span>
        </div>
        <div className="divide-y divide-slate-200">
          {printerModels.map((printerModel) => (
            <div key={printerModel.id} className="grid grid-cols-[1.4fr_1fr_1fr_120px] gap-4 px-6 py-4 text-sm text-slate-700">
              <span>{printerModel.name}</span>
              <span>{printerModel.consumoWattsPadrao} W</span>
              <span>{printerModel.vidaUtilHorasPadrao} h</span>
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => handleEdit(printerModel)}
                  className="rounded-xl border border-cyan-200 px-3 py-2 font-medium text-cyan-700 transition hover:bg-cyan-50"
                >
                  Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}