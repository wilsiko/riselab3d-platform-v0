import { FormEvent, useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../auth/AuthContext';
import { Alert } from '../components/Alert';
import { useAuthRedirect } from '../hooks/useAuthRedirect';
import { Loading } from '../components/Loading';
import { NumericInput } from '../components/NumericInput';
import { SALE_CHANNELS } from '../constants/pricing';
import { Printer, Settings } from '../types';
import { parseLocaleNumber } from '../utils/number';

const defaultSettings: Settings = {
  custo_kwh: 1.05,
  direct_margin_percent: 20,
  ecommerce_margin_percent: 35,
  end_customer_margin_percent: 50,
};

interface PrinterDraft {
  id?: string;
  nome: string;
  consumo_watts: string;
  custo_aquisicao: string;
  vida_util_horas: string;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function mapSettingsToForm(settings: Settings) {
  return {
    custo_kwh: String(settings.custo_kwh),
    direct_margin_percent: String(settings.direct_margin_percent),
    ecommerce_margin_percent: String(settings.ecommerce_margin_percent),
    end_customer_margin_percent: String(settings.end_customer_margin_percent),
  };
}

function mapPrinterToDraft(printer: Printer): PrinterDraft {
  return {
    id: printer.id,
    nome: printer.nome,
    consumo_watts: String(printer.consumo_watts),
    custo_aquisicao: String(printer.custo_aquisicao),
    vida_util_horas: String(printer.vida_util_horas),
  };
}

function createEmptyPrinterDraft(): PrinterDraft {
  return {
    nome: '',
    consumo_watts: '120',
    custo_aquisicao: '1500',
    vida_util_horas: '2000',
  };
}

export default function PricingSetup() {
  const { isAuthenticated } = useAuth();
  const redirectToLogin = useAuthRedirect();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [settingsForm, setSettingsForm] = useState(mapSettingsToForm(defaultSettings));
  const [printerDrafts, setPrinterDrafts] = useState<PrinterDraft[]>([]);
  const [printerSearch, setPrinterSearch] = useState('');
  const [activePrinterIndex, setActivePrinterIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadPricing = async () => {
      try {
        setIsLoading(true);
        const [settingsRes, printersRes] = await Promise.all([
          api.get<Settings>('/settings'),
          api.get<Printer[]>('/printers'),
        ]);
        setSettings(settingsRes.data);
        setSettingsForm(mapSettingsToForm(settingsRes.data));
        setPrinterDrafts(printersRes.data.map(mapPrinterToDraft));
        setActivePrinterIndex(printersRes.data.length ? 0 : null);
      } catch (requestError: any) {
        setError(requestError?.response?.data?.error || 'Nao foi possivel carregar as configuracoes de precificacao.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPricing();
  }, []);

  function updateSettingsForm(field: keyof typeof settingsForm, value: string) {
    setSettingsForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  function updatePrinterDraft(index: number, field: keyof PrinterDraft, value: string) {
    setPrinterDrafts((currentDrafts) => currentDrafts.map((draft, currentIndex) => (currentIndex === index ? { ...draft, [field]: value } : draft)));
  }

  function addPrinterDraft() {
    if (!isAuthenticated) {
      redirectToLogin();
      return;
    }

    setPrinterDrafts((currentDrafts) => {
      const nextDrafts = [...currentDrafts, createEmptyPrinterDraft()];
      setActivePrinterIndex(nextDrafts.length - 1);
      return nextDrafts;
    });
    setPrinterSearch('');
  }

  useEffect(() => {
    if (!printerDrafts.length) {
      if (activePrinterIndex !== null) {
        setActivePrinterIndex(null);
      }
      return;
    }

    if (activePrinterIndex === null || activePrinterIndex >= printerDrafts.length) {
      setActivePrinterIndex(0);
    }
  }, [activePrinterIndex, printerDrafts]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isAuthenticated) {
      redirectToLogin();
      return;
    }

    const payloadSettings = {
      custo_kwh: parseLocaleNumber(settingsForm.custo_kwh),
      direct_margin_percent: parseLocaleNumber(settingsForm.direct_margin_percent),
      ecommerce_margin_percent: parseLocaleNumber(settingsForm.ecommerce_margin_percent),
      end_customer_margin_percent: parseLocaleNumber(settingsForm.end_customer_margin_percent),
    };

    if (Object.values(payloadSettings).some((value) => !Number.isFinite(value) || value < 0)) {
      setError('Revise energia e margens dos canais antes de salvar.');
      return;
    }

    const normalizedPrinterDrafts = printerDrafts
      .map((draft) => ({
        ...draft,
        nome: draft.nome.trim(),
        consumo_watts: parseLocaleNumber(draft.consumo_watts),
        custo_aquisicao: parseLocaleNumber(draft.custo_aquisicao),
        vida_util_horas: parseLocaleNumber(draft.vida_util_horas),
      }))
      .filter((draft) => draft.nome || draft.id);

    const hasInvalidPrinter = normalizedPrinterDrafts.some((draft) => (
      !draft.nome
      || !Number.isFinite(draft.consumo_watts)
      || draft.consumo_watts <= 0
      || !Number.isFinite(draft.custo_aquisicao)
      || draft.custo_aquisicao <= 0
      || !Number.isFinite(draft.vida_util_horas)
      || draft.vida_util_horas <= 0
    ));

    if (hasInvalidPrinter) {
      setError('Complete nome, consumo, custo de aquisicao e vida util de cada impressora antes de salvar.');
      return;
    }

    try {
      setIsLoading(true);
      const settingsResponse = await api.put<Settings>('/settings', payloadSettings);

      const existingPrinters = normalizedPrinterDrafts.filter((draft) => draft.id);
      const newPrinters = normalizedPrinterDrafts.filter((draft) => !draft.id);

      const updatedPrinters = await Promise.all(existingPrinters.map(async (draft) => {
        const response = await api.put<Printer>(`/printers/${draft.id}`, {
          nome: draft.nome,
          consumo_watts: draft.consumo_watts,
          custo_aquisicao: draft.custo_aquisicao,
          vida_util_horas: draft.vida_util_horas,
        });

        return response.data;
      }));

      const createdPrinters = await Promise.all(newPrinters.map(async (draft) => {
        const response = await api.post<Printer>('/printers', {
          nome: draft.nome,
          consumo_watts: draft.consumo_watts,
          custo_aquisicao: draft.custo_aquisicao,
          vida_util_horas: draft.vida_util_horas,
        });

        return response.data;
      }));

      setSettings(settingsResponse.data);
      setSettingsForm(mapSettingsToForm(settingsResponse.data));
      setPrinterDrafts([...updatedPrinters, ...createdPrinters].map(mapPrinterToDraft));
      setActivePrinterIndex(updatedPrinters.length + createdPrinters.length ? 0 : null);
      setSuccess('Configuracoes salvas com energia, canais e impressoras atualizados.');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || 'Nao foi possivel salvar as configuracoes.');
    } finally {
      setIsLoading(false);
    }
  }

  const normalizedPrinterSearch = printerSearch.trim().toLowerCase();
  const visiblePrinters = printerDrafts
    .map((printer, index) => ({ printer, index }))
    .filter(({ printer }) => {
      if (!normalizedPrinterSearch) {
        return true;
      }

      return printer.nome.toLowerCase().includes(normalizedPrinterSearch);
    });
  const activePrinter = activePrinterIndex !== null ? printerDrafts[activePrinterIndex] : null;

  return (
    <div className="space-y-8">
      <Loading isLoading={isLoading} label="Ajustando sua engrenagem de precos..." />

      <section className="rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(8,14,30,0.96),rgba(7,24,44,0.96),rgba(99,102,241,0.12))] p-8 shadow-[0_28px_90px_rgba(0,0,0,0.28)]">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200">Sistema de precificacao</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white">Configuracoes centrais com energia, canais e parque de impressoras no mesmo fluxo.</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
          Tudo que alimenta a cotacao manual fica nesta tela. Ajuste energia, margens dos canais e perfis tecnicos das impressoras, depois salve uma unica vez.
        </p>
      </section>

      {error ? <Alert type="error" message={error} onClose={() => setError(null)} /> : null}
      {success ? <Alert type="success" message={success} onClose={() => setSuccess(null)} /> : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        {!isAuthenticated ? (
          <Alert type="info" message="Voce esta em modo visitante. Energia, canais e impressoras ficam visiveis, mas salvar alteracoes exige login." />
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.22)]">
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">Energia e canais</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">Edite o kWh e as margens que a plataforma usa em cada contexto comercial.</p>

            <div className="mt-6 rounded-[28px] border border-white/10 bg-[#0a1228]/78 p-5">
              <p className="text-sm text-slate-400">Base ativa hoje</p>
              <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-cyan-200">{formatCurrency(settings.custo_kwh)}</p>
            </div>

            <div className="mt-6">
              <NumericInput label="Custo do kWh" value={settingsForm.custo_kwh} onChange={(value) => updateSettingsForm('custo_kwh', value)} prefix="R$" hint="energia" />
            </div>

            <div className="mt-6 space-y-4">
              {SALE_CHANNELS.map((channel) => {
                const field = channel.id === 'direct' ? 'direct_margin_percent' : channel.id === 'ecommerce' ? 'ecommerce_margin_percent' : 'end_customer_margin_percent';

                return (
                  <div key={channel.id} className="rounded-[28px] border border-white/10 bg-[#0a1228]/78 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="max-w-[420px]">
                        <p className="text-lg font-semibold text-white">{channel.label}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-400">{channel.description}</p>
                      </div>
                      <div className="w-full max-w-[220px]">
                        <NumericInput label="Margem" value={settingsForm[field]} onChange={(value) => updateSettingsForm(field, value)} suffix="%" hint="canal" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.22)]">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">Cadastro de impressoras</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">Use a lista compacta para localizar uma impressora e edite apenas a selecionada. Tudo entra no mesmo salvar.</p>
              </div>
              <button type="button" onClick={addPrinterDraft} className="inline-flex rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]">
                Nova impressora
              </button>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
              <div className="rounded-[28px] border border-white/10 bg-[#0a1228]/70 p-4">
                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#081120] px-4 py-3 focus-within:border-cyan-400/35 focus-within:bg-cyan-400/[0.05]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 text-slate-400" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M10.75 18a7.25 7.25 0 1 1 0-14.5 7.25 7.25 0 0 1 0 14.5Z" />
                  </svg>
                  <input
                    type="search"
                    value={printerSearch}
                    onChange={(event) => setPrinterSearch(event.target.value)}
                    placeholder="Buscar impressora"
                    className="w-full border-0 bg-transparent p-0 text-sm font-medium text-white outline-none placeholder:text-slate-500"
                  />
                </label>

                <div className="mt-4 max-h-[540px] space-y-2 overflow-y-auto pr-1">
                  {visiblePrinters.length ? (
                    visiblePrinters.map(({ printer, index }) => {
                      const isActive = index === activePrinterIndex;

                      return (
                        <button
                          key={printer.id || `printer-${index}`}
                          type="button"
                          onClick={() => setActivePrinterIndex(index)}
                          className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                            isActive ? 'border-cyan-400/35 bg-cyan-400/[0.08]' : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-white">{printer.nome || 'Nova impressora sem nome'}</p>
                              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{printer.id ? 'cadastrada' : 'nova'}</p>
                            </div>
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${isActive ? 'bg-cyan-300/20 text-cyan-200' : 'bg-white/[0.06] text-slate-400'}`}>
                              {printer.consumo_watts || '--'} W
                            </span>
                          </div>
                          <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-400">
                            <span>{printer.vida_util_horas || '--'} h</span>
                            <span>{printer.custo_aquisicao ? formatCurrency(parseLocaleNumber(printer.custo_aquisicao)) : '--'}</span>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-slate-400">
                      Nenhuma impressora encontrada com esse filtro.
                    </div>
                  )}
                </div>
              </div>

              <div>
                {activePrinter ? (
                  <article className="rounded-[28px] border border-white/10 bg-[#0a1228]/78 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{activePrinter.id ? 'Impressora selecionada' : 'Nova impressora'}</p>
                        <p className="mt-2 text-lg font-semibold text-white">{activePrinter.nome || 'Preencha o nome da impressora'}</p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 xl:grid-cols-2">
                      <label className="block rounded-[28px] border border-white/10 bg-[#081120] p-4">
                        <span className="mb-2 block text-sm font-medium text-slate-200">Nome</span>
                        <input value={activePrinter.nome} onChange={(event) => updatePrinterDraft(activePrinterIndex!, 'nome', event.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#0a1228]/90 p-3 text-white outline-none focus:border-cyan-400/40" placeholder="Ex: Bambu Lab P1S" />
                      </label>
                      <NumericInput label="Consumo" value={activePrinter.consumo_watts} onChange={(value) => updatePrinterDraft(activePrinterIndex!, 'consumo_watts', value)} suffix="W" hint="energia" />
                      <NumericInput label="Custo de aquisicao" value={activePrinter.custo_aquisicao} onChange={(value) => updatePrinterDraft(activePrinterIndex!, 'custo_aquisicao', value)} prefix="R$" hint="capex" />
                      <NumericInput label="Vida util" value={activePrinter.vida_util_horas} onChange={(value) => updatePrinterDraft(activePrinterIndex!, 'vida_util_horas', value)} suffix="h" hint="uso" />
                    </div>
                  </article>
                ) : (
                  <div className="rounded-[28px] border border-dashed border-white/10 bg-[#0a1228]/60 p-5 text-sm leading-6 text-slate-400">
                    Nenhuma impressora cadastrada ainda. Use o botao acima para criar a primeira impressora e salvar junto com o restante das configuracoes.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button type="submit" className="rounded-2xl bg-cyan-400 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400" disabled={isLoading}>
            Salvar configuracoes
          </button>
        </div>
      </form>
    </div>
  );
}