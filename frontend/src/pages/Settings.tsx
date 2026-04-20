import { useEffect, useState, FormEvent } from 'react';
import api from '../api';
import { Settings } from '../types';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({ custo_kwh: 1.05 });
  const [value, setValue] = useState(settings.custo_kwh);

  useEffect(() => {
    api.get<Settings>('/settings').then((res) => {
      setSettings(res.data);
      setValue(res.data.custo_kwh);
    });
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await api.put<Settings>('/settings', { custo_kwh: value });
    setSettings(response.data);
  };

  return (
    <div>
      <h1 className="text-3xl font-semibold text-slate-900">Configurações Globais</h1>
      <p className="mt-2 text-slate-600">Defina o custo de energia para cálculo de orçamentos.</p>

      <form onSubmit={handleSubmit} className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm sm:max-w-xl">
        <label className="space-y-2 text-sm text-slate-700">
          Custo do kWh
          <input
            type="number"
            step="0.01"
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="w-full rounded-2xl border-slate-200 bg-white p-3"
          />
        </label>
        <button type="submit" className="mt-4 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
          Salvar configurações
        </button>
      </form>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Custo atual de kWh:</p>
        <p className="mt-2 text-2xl font-semibold text-slate-900">R$ {settings.custo_kwh.toFixed(2)}</p>
      </div>
    </div>
  );
}
