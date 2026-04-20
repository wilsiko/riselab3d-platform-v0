import { FormEvent, useEffect, useState } from 'react';
import api from '../api';
import { Alert } from '../components/Alert';
import { Printer, PrinterModel } from '../types';
import { formatCurrency, formatDecimalInput, parseDecimalInput, parseNumberInputValue } from '../utils/numberFormat';

export default function Printers() {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [printerModels, setPrinterModels] = useState<PrinterModel[]>([]);
  const [editingPrinterId, setEditingPrinterId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    nome: '',
    modelId: '',
    consumo_watts: 120 as number | '',
    custo_aquisicao: '',
    vida_util_horas: 2000 as number | '',
  });

  const applyPrinterModelDefaults = (modelId: string) => {
    const selectedModel = printerModels.find((printerModel) => printerModel.id === modelId);

    setForm((currentForm) => ({
      ...currentForm,
      modelId,
      consumo_watts: selectedModel?.consumoWattsPadrao ?? currentForm.consumo_watts,
      vida_util_horas: selectedModel?.vidaUtilHorasPadrao ?? currentForm.vida_util_horas,
    }));
  };

  const resetForm = (models: PrinterModel[] = printerModels) => {
    setEditingPrinterId(null);
    setForm({
      nome: '',
      modelId: models[0]?.id || '',
      consumo_watts: models[0]?.consumoWattsPadrao || 120,
      custo_aquisicao: '',
      vida_util_horas: models[0]?.vidaUtilHorasPadrao || 2000,
    });
  };

  const loadPrinters = async (includeInactive: boolean) => {
    const [printersResponse, modelsResponse] = await Promise.all([
      api.get<Printer[]>('/printers', { params: includeInactive ? { includeInactive: true } : undefined }),
      api.get<PrinterModel[]>('/printer-models'),
    ]);

    setPrinters(printersResponse.data);
    setPrinterModels(modelsResponse.data);
    const initialModel = modelsResponse.data.find((model) => model.id === form.modelId) || modelsResponse.data[0];

    if (!initialModel) {
      return;
    }

    setForm((currentForm) => ({
      ...currentForm,
      modelId: currentForm.modelId || initialModel.id,
      consumo_watts: currentForm.modelId ? currentForm.consumo_watts : initialModel.consumoWattsPadrao,
      vida_util_horas: currentForm.modelId ? currentForm.vida_util_horas : initialModel.vidaUtilHorasPadrao,
    }));
  };

  useEffect(() => {
    loadPrinters(showInactive)
      .catch((requestError: any) => {
        setError(requestError?.response?.data?.error || 'Erro ao carregar impressoras e modelos.');
      });
  }, [showInactive]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (form.consumo_watts === '' || form.vida_util_horas === '') {
      setError('Preencha consumo e vida útil antes de salvar a impressora.');
      return;
    }

    try {
      const payload = {
        ...form,
        consumo_watts: Number(form.consumo_watts),
        custo_aquisicao: parseDecimalInput(form.custo_aquisicao),
        vida_util_horas: Number(form.vida_util_horas),
      };
      const response = editingPrinterId
        ? await api.put<Printer>(`/printers/${editingPrinterId}`, payload)
        : await api.post<Printer>('/printers', payload);

      setPrinters((currentPrinters) => {
        if (editingPrinterId) {
          return currentPrinters.map((printer) => (printer.id === editingPrinterId ? response.data : printer));
        }

        return [...currentPrinters, response.data];
      });
      resetForm();
      setSuccess(editingPrinterId ? 'Impressora atualizada com sucesso.' : 'Impressora cadastrada com sucesso.');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || 'Erro ao salvar impressora.');
    }
  };

  const handleEdit = (printer: Printer) => {
    setError(null);
    setSuccess(null);
    setEditingPrinterId(printer.id);
    setForm({
      nome: printer.nome,
      modelId: printer.modelId,
      consumo_watts: printer.consumo_watts,
      custo_aquisicao: formatDecimalInput(printer.custo_aquisicao),
      vida_util_horas: printer.vida_util_horas,
    });
  };

  const handleCancelEdit = () => {
    setError(null);
    setSuccess(null);
    resetForm();
  };

  const handleDelete = async (printer: Printer) => {
    if (!window.confirm(`Deseja realmente desativar a impressora ${printer.nome}?`)) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      await api.delete(`/printers/${printer.id}`);
      if (showInactive) {
        await loadPrinters(true);
      } else {
        setPrinters((currentPrinters) => currentPrinters.filter((currentPrinter) => currentPrinter.id !== printer.id));
      }

      if (editingPrinterId === printer.id) {
        resetForm();
      }

      setSuccess('Impressora desativada com sucesso.');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || 'Erro ao desativar impressora.');
    }
  };

  const handleReactivate = async (printer: Printer) => {
    setError(null);
    setSuccess(null);

    try {
      const response = await api.patch<Printer>(`/printers/${printer.id}/reactivate`);

      if (showInactive) {
        setPrinters((currentPrinters) => currentPrinters.map((currentPrinter) => (currentPrinter.id === printer.id ? response.data : currentPrinter)));
      } else {
        setPrinters((currentPrinters) => [...currentPrinters, response.data]);
      }

      setSuccess('Impressora reativada com sucesso.');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || 'Erro ao reativar impressora.');
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Impressoras</h1>
          <p className="mt-2 text-slate-600">Gerencie seus equipamentos e custos de amortização.</p>
        </div>
        <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(event) => setShowInactive(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
          />
          Exibir desativadas
        </label>
      </div>

      {error ? <div className="mb-6"><Alert type="error" message={error} onClose={() => setError(null)} /></div> : null}
      {success ? <div className="mb-6"><Alert type="success" message={success} onClose={() => setSuccess(null)} /></div> : null}

      {editingPrinterId ? (
        <div className="mb-6 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
          Editando impressora existente. Atualize os campos abaixo e salve para aplicar as mudanças.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="grid gap-5 rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm md:grid-cols-2 xl:grid-cols-5 xl:items-start">
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          Nome
          <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="form-control" placeholder="Ex: Ender 3" required />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          Modelo
          <select value={form.modelId} onChange={(e) => applyPrinterModelDefaults(e.target.value)} className="form-control" required>
            <option value="">Selecione um modelo</option>
            {printerModels.map((printerModel) => (
              <option key={printerModel.id} value={printerModel.id}>
                {printerModel.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          Consumo (W)
          <input type="number" value={form.consumo_watts} onChange={(e) => setForm({ ...form, consumo_watts: parseNumberInputValue(e.target.value) })} className="form-control" required />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          Custo aquisição
          <input
            type="text"
            inputMode="decimal"
            value={form.custo_aquisicao}
            onChange={(e) => setForm({ ...form, custo_aquisicao: e.target.value })}
            onBlur={() => {
              const parsedValue = parseDecimalInput(form.custo_aquisicao);

              if (Number.isFinite(parsedValue)) {
                setForm((currentForm) => ({
                  ...currentForm,
                  custo_aquisicao: formatDecimalInput(parsedValue),
                }));
              }
            }}
            className="form-control"
            placeholder="Ex: 3500,00"
            required
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          Vida útil (h)
          <input type="number" value={form.vida_util_horas} onChange={(e) => setForm({ ...form, vida_util_horas: parseNumberInputValue(e.target.value) })} className="form-control" required />
        </label>
        <div className="md:col-span-2 xl:col-span-5">
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
              {editingPrinterId ? 'Salvar alterações' : 'Adicionar impressora'}
            </button>
            {editingPrinterId ? (
              <button type="button" onClick={handleCancelEdit} className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                Cancelar edição
              </button>
            ) : null}
          </div>
        </div>
      </form>

      <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1.2fr_1fr_0.8fr_0.9fr_0.9fr_1fr_180px] gap-4 bg-slate-50 p-6 text-sm font-semibold text-slate-500">
          <span>Nome</span>
          <span>Modelo</span>
          <span>Consumo W</span>
          <span>Custo</span>
          <span>Vida útil (h)</span>
          <span>Status</span>
          <span className="text-right">Ações</span>
        </div>
        <div className="divide-y divide-slate-200">
          {printers.map((printer) => (
            <div key={printer.id} className="grid grid-cols-[1.2fr_1fr_0.8fr_0.9fr_0.9fr_1fr_180px] gap-4 px-6 py-4 text-sm text-slate-700">
              <span>{printer.nome}</span>
              <span>{printer.model?.name || '-'}</span>
              <span>{printer.consumo_watts}</span>
              <span>{formatCurrency(printer.custo_aquisicao)}</span>
              <span>{printer.vida_util_horas}</span>
              <span>
                {printer.data_desativacao ? `Desativada em ${new Date(printer.data_desativacao).toLocaleDateString()}` : 'Ativa'}
              </span>
              <div className="flex justify-end gap-2">
                {!printer.data_desativacao ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleEdit(printer)}
                      className="rounded-xl border border-cyan-200 px-3 py-2 font-medium text-cyan-700 transition hover:bg-cyan-50"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(printer)}
                      className="inline-flex items-center justify-center rounded-xl border border-rose-200 px-3 py-2 font-medium text-rose-700 transition hover:bg-rose-50"
                      title="Desativar impressora"
                      aria-label={`Desativar impressora ${printer.nome}`}
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
                    onClick={() => handleReactivate(printer)}
                    className="inline-flex items-center justify-center rounded-xl border border-emerald-200 px-3 py-2 font-medium text-emerald-700 transition hover:bg-emerald-50"
                    title="Reativar impressora"
                    aria-label={`Reativar impressora ${printer.nome}`}
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
