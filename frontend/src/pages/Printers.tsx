import { FormEvent, useEffect, useState } from 'react';
import api from '../api';
import { Printer } from '../types';

export default function Printers() {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [form, setForm] = useState({ nome: '', consumo_watts: 120, custo_aquisicao: 1500, vida_util_horas: 2000 });

  useEffect(() => {
    api.get<Printer[]>('/printers').then((res) => setPrinters(res.data));
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await api.post<Printer>('/printers', form);
    setPrinters((prev) => [...prev, response.data]);
    setForm({ nome: '', consumo_watts: 120, custo_aquisicao: 1500, vida_util_horas: 2000 });
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Impressoras</h1>
          <p className="mt-2 text-slate-600">Gerencie seus equipamentos e custos de amortização.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm sm:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-2 text-sm text-slate-700">
          Nome
          <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="w-full rounded-2xl border-slate-200 bg-white p-3" placeholder="Ex: Ender 3" required />
        </label>
        <label className="space-y-2 text-sm text-slate-700">
          Consumo (W)
          <input type="number" value={form.consumo_watts} onChange={(e) => setForm({ ...form, consumo_watts: Number(e.target.value) })} className="w-full rounded-2xl border-slate-200 bg-white p-3" required />
        </label>
        <label className="space-y-2 text-sm text-slate-700">
          Custo aquisição
          <input type="number" value={form.custo_aquisicao} onChange={(e) => setForm({ ...form, custo_aquisicao: Number(e.target.value) })} className="w-full rounded-2xl border-slate-200 bg-white p-3" required />
        </label>
        <label className="space-y-2 text-sm text-slate-700">
          Vida útil (h)
          <input type="number" value={form.vida_util_horas} onChange={(e) => setForm({ ...form, vida_util_horas: Number(e.target.value) })} className="w-full rounded-2xl border-slate-200 bg-white p-3" required />
        </label>
        <div className="sm:col-span-2 xl:col-span-4">
          <button type="submit" className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
            Adicionar impressora
          </button>
        </div>
      </form>

      <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-4 gap-4 p-6 text-sm font-semibold text-slate-500 bg-slate-50">
          <span>Nome</span>
          <span>Consumo W</span>
          <span>Custo</span>
          <span>Vida útil (h)</span>
        </div>
        <div className="divide-y divide-slate-200">
          {printers.map((printer) => (
            <div key={printer.id} className="grid grid-cols-4 gap-4 px-6 py-4 text-sm text-slate-700">
              <span>{printer.nome}</span>
              <span>{printer.consumo_watts}</span>
              <span>R$ {printer.custo_aquisicao.toFixed(2)}</span>
              <span>{printer.vida_util_horas}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
