import { useEffect, useState, FormEvent } from 'react';
import api from '../api';
import { Settings } from '../types';
import { Alert } from '../components/Alert';
import { formatCurrency, formatDecimalInput, parseDecimalInput } from '../utils/numberFormat';

const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024;
const MAX_LOGO_DATA_URL_LENGTH = 2_800_000;

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo selecionado.'));
    reader.readAsDataURL(file);
  });
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    custo_kwh: 1.05,
    margem_venda_direta: 20,
    margem_venda_ecommerce: 35,
    margem_venda_consumidor_final: 50,
    logo_data_url: null,
  });
  const [savedLogoDataUrl, setSavedLogoDataUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    custo_kwh: formatDecimalInput(1.05),
    margem_venda_direta: formatDecimalInput(20),
    margem_venda_ecommerce: formatDecimalInput(35),
    margem_venda_consumidor_final: formatDecimalInput(50),
    logo_data_url: '' as string | null,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    api.get<Settings>('/settings')
      .then((res) => {
        setSettings(res.data);
        setSavedLogoDataUrl(res.data.logo_data_url || null);
        setForm({
          custo_kwh: formatDecimalInput(res.data.custo_kwh),
          margem_venda_direta: formatDecimalInput(res.data.margem_venda_direta),
          margem_venda_ecommerce: formatDecimalInput(res.data.margem_venda_ecommerce),
          margem_venda_consumidor_final: formatDecimalInput(res.data.margem_venda_consumidor_final),
          logo_data_url: res.data.logo_data_url || null,
        });
      })
      .catch((requestError: any) => {
        setError(requestError?.response?.data?.error || 'Não foi possível carregar as configurações.');
      });
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const response = await api.put<Settings>('/settings', {
        custo_kwh: parseDecimalInput(form.custo_kwh),
        margem_venda_direta: parseDecimalInput(form.margem_venda_direta),
        margem_venda_ecommerce: parseDecimalInput(form.margem_venda_ecommerce),
        margem_venda_consumidor_final: parseDecimalInput(form.margem_venda_consumidor_final),
        logo_data_url: form.logo_data_url,
      });
      setSettings(response.data);
      setSavedLogoDataUrl(response.data.logo_data_url || null);
      setForm({
        custo_kwh: formatDecimalInput(response.data.custo_kwh),
        margem_venda_direta: formatDecimalInput(response.data.margem_venda_direta),
        margem_venda_ecommerce: formatDecimalInput(response.data.margem_venda_ecommerce),
        margem_venda_consumidor_final: formatDecimalInput(response.data.margem_venda_consumidor_final),
        logo_data_url: response.data.logo_data_url || null,
      });
      setSuccess('Configurações salvas com sucesso.');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || 'Não foi possível salvar as configurações.');
    }
  };

  const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Selecione um arquivo de imagem válido.');
      return;
    }

    if (file.size > MAX_LOGO_SIZE_BYTES) {
      setError('O logo deve ter no máximo 2 MB.');
      return;
    }

    try {
      const logoDataUrl = await readFileAsDataUrl(file);

      if (logoDataUrl.length > MAX_LOGO_DATA_URL_LENGTH) {
        setError('O logo excede o limite aceito após o upload. Use uma imagem menor que 2 MB.');
        return;
      }

      setError(null);
      setForm((currentForm) => ({
        ...currentForm,
        logo_data_url: logoDataUrl,
      }));
    } catch (requestError: any) {
      setError(requestError?.message || 'Não foi possível carregar o logo.');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-semibold text-slate-900">Configurações Globais</h1>
      <p className="mt-2 text-slate-600">Defina o custo de energia, as margens padrão e o logo da empresa usado no PDF do orçamento.</p>

      {error ? <div className="mt-6"><Alert type="error" message={error} onClose={() => setError(null)} /></div> : null}
      {success ? <div className="mt-6"><Alert type="success" message={success} onClose={() => setSuccess(null)} /></div> : null}

      <form onSubmit={handleSubmit} className="mt-8 grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm sm:max-w-3xl sm:grid-cols-2">
        <label className="space-y-2 text-sm text-slate-700">
          Custo do kWh
          <input
            type="text"
            inputMode="decimal"
            value={form.custo_kwh}
            onChange={(e) => setForm((currentForm) => ({ ...currentForm, custo_kwh: e.target.value }))}
            onBlur={() => {
              const parsedValue = parseDecimalInput(form.custo_kwh);

              if (Number.isFinite(parsedValue)) {
                setForm((currentForm) => ({
                  ...currentForm,
                  custo_kwh: formatDecimalInput(parsedValue),
                }));
              }
            }}
            className="form-control"
          />
        </label>
        <label className="space-y-2 text-sm text-slate-700">
          Margem Venda Direta (B2B) %
          <input
            type="text"
            inputMode="decimal"
            value={form.margem_venda_direta}
            onChange={(e) => setForm((currentForm) => ({ ...currentForm, margem_venda_direta: e.target.value }))}
            onBlur={() => {
              const parsedValue = parseDecimalInput(form.margem_venda_direta);

              if (Number.isFinite(parsedValue)) {
                setForm((currentForm) => ({
                  ...currentForm,
                  margem_venda_direta: formatDecimalInput(parsedValue),
                }));
              }
            }}
            className="form-control"
          />
        </label>
        <label className="space-y-2 text-sm text-slate-700">
          Margem E-Commerce %
          <input
            type="text"
            inputMode="decimal"
            value={form.margem_venda_ecommerce}
            onChange={(e) => setForm((currentForm) => ({ ...currentForm, margem_venda_ecommerce: e.target.value }))}
            onBlur={() => {
              const parsedValue = parseDecimalInput(form.margem_venda_ecommerce);

              if (Number.isFinite(parsedValue)) {
                setForm((currentForm) => ({
                  ...currentForm,
                  margem_venda_ecommerce: formatDecimalInput(parsedValue),
                }));
              }
            }}
            className="form-control"
          />
        </label>
        <label className="space-y-2 text-sm text-slate-700">
          Margem Usuário Final %
          <input
            type="text"
            inputMode="decimal"
            value={form.margem_venda_consumidor_final}
            onChange={(e) => setForm((currentForm) => ({ ...currentForm, margem_venda_consumidor_final: e.target.value }))}
            onBlur={() => {
              const parsedValue = parseDecimalInput(form.margem_venda_consumidor_final);

              if (Number.isFinite(parsedValue)) {
                setForm((currentForm) => ({
                  ...currentForm,
                  margem_venda_consumidor_final: formatDecimalInput(parsedValue),
                }));
              }
            }}
            className="form-control"
          />
        </label>
        <div className="space-y-3 text-sm text-slate-700 sm:col-span-2">
          <span className="block">Logo da empresa</span>
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-24 w-40 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50">
                {form.logo_data_url ? (
                  <img src={form.logo_data_url} alt="Logo da empresa" className="h-full w-full object-contain" />
                ) : (
                  <span className="px-4 text-center text-xs text-slate-500">Nenhum logo enviado</span>
                )}
              </div>
              <div>
                <p className="font-medium text-slate-900">PDF do orçamento</p>
                <p className="mt-1 text-xs text-slate-500">PNG, JPG ou WEBP com até 2 MB.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <label className="cursor-pointer rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                Escolher logo
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleLogoChange} />
              </label>
              {form.logo_data_url ? (
                <button
                  type="button"
                  onClick={() => setForm((currentForm) => ({ ...currentForm, logo_data_url: null }))}
                  className="rounded-2xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                >
                  Remover logo
                </button>
              ) : null}
            </div>
          </div>
        </div>
        <button type="submit" className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 sm:col-span-2 sm:justify-self-start">
          Salvar configurações
        </button>
      </form>

      <div className="mt-6 grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="text-sm text-slate-600">Custo atual de kWh</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(settings.custo_kwh)}</p>
        </div>
        <div>
          <p className="text-sm text-slate-600">Venda Direta (B2B)</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{settings.margem_venda_direta.toFixed(2)}%</p>
        </div>
        <div>
          <p className="text-sm text-slate-600">E-Commerce</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{settings.margem_venda_ecommerce.toFixed(2)}%</p>
        </div>
        <div>
          <p className="text-sm text-slate-600">Usuário Final</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{settings.margem_venda_consumidor_final.toFixed(2)}%</p>
        </div>
        <div className="sm:col-span-2 xl:col-span-4">
          <p className="text-sm text-slate-600">Logo atual da empresa</p>
          <div className="mt-3 flex h-28 w-full max-w-xs items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            {savedLogoDataUrl ? (
              <img key={savedLogoDataUrl} src={savedLogoDataUrl} alt="Logo atual da empresa" className="h-full w-full object-contain" />
            ) : (
              <span className="text-sm text-slate-500">Nenhum logo configurado</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
