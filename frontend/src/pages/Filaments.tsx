import { useEffect, useState, FormEvent } from 'react';
import api from '../api';
import { Filament } from '../types';

export default function Filaments() {
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [form, setForm] = useState({ marca: '', tipo: '', custo_por_kg: 120 });

  useEffect(() => {
    api.get<Filament[]>('/filaments').then((res) => setFilaments(res.data));
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await api.post<Filament>('/filaments', form);
    setFilaments((prev) => [...prev, response.data]);
    setForm({ marca: '', tipo: '', custo_por_kg: 120 });
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Filamentos</h1>
          <p className="mt-2 text-slate-600">Registre insumos e tipos de material dinamicamente.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm sm:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-2 text-sm text-slate-700">
          Marca
          <input value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} className="w-full rounded-2xl border-slate-200 bg-white p-3" placeholder="Ex: Prusa" required />
        </label>
        <label className="space-y-2 text-sm text-slate-700">
          Tipo
          <input value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="w-full rounded-2xl border-slate-200 bg-white p-3" placeholder="Ex: PLA" required />
        </label>
        <label className="space-y-2 text-sm text-slate-700">
          Custo por kg
          <input type="number" value={form.custo_por_kg} onChange={(e) => setForm({ ...form, custo_por_kg: Number(e.target.value) })} className="w-full rounded-2xl border-slate-200 bg-white p-3" required />
        </label>
        <div className="sm:col-span-2 xl:col-span-4">
          <button type="submit" className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
            Adicionar filamento
          </button>
        </div>
      </form>

      <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-3 gap-4 p-6 text-sm font-semibold text-slate-500 bg-slate-50">
          <span>Marca</span>
          <span>Tipo</span>
          <span>Custo por kg</span>
        </div>
        <div className="divide-y divide-slate-200">
          {filaments.map((filament) => (
            <div key={filament.id} className="grid grid-cols-3 gap-4 px-6 py-4 text-sm text-slate-700">
              <span>{filament.marca}</span>
              <span>{filament.tipo}</span>
              <span>R$ {filament.custo_por_kg.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
