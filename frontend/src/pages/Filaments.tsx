import { FormEvent, useEffect, useState } from 'react';
import api from '../api';
import { Alert } from '../components/Alert';
import { Loading } from '../components/Loading';
import { NumericInput } from '../components/NumericInput';
import { SummaryWidget } from '../components/SummaryWidget';
import { Filament } from '../types';
import { parseLocaleNumber } from '../utils/number';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function Filaments() {
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [form, setForm] = useState({ marca: '', tipo: '', custo_por_kg: 120 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadFilaments = async () => {
      try {
        setIsLoading(true);
        const response = await api.get<Filament[]>('/filaments');
        setFilaments(response.data);
      } catch (requestError: any) {
        setError(requestError?.response?.data?.error || 'Nao foi possivel carregar os materiais.');
      } finally {
        setIsLoading(false);
      }
    };

    loadFilaments();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      setIsLoading(true);
      const response = await api.post<Filament>('/filaments', form);
      setFilaments((previousFilaments) => [...previousFilaments, response.data]);
      setForm({ marca: '', tipo: '', custo_por_kg: 120 });
      setSuccess('Material adicionado ao catalogo tecnico.');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || 'Nao foi possivel criar o material.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Loading isLoading={isLoading} label="Sincronizando materiais..." />

      <section className="rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(8,14,30,0.96),rgba(7,24,44,0.96),rgba(20,184,166,0.14))] p-8 shadow-[0_28px_90px_rgba(0,0,0,0.28)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200">Perfis de material</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white">Perfis de material claros, consistentes e prontos para compor custo base.</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">Cada material vira um ativo operacional com leitura comercial limpa, sem cair no visual pesado de cadastro interno.</p>
      </section>

      {error ? <Alert type="error" message={error} onClose={() => setError(null)} /> : null}
      {success ? <Alert type="success" message={success} onClose={() => setSuccess(null)} /> : null}

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryWidget label="Materiais ativos" value={String(filaments.length)} description="Perfis prontos para alimentar a cotacao e o SKU builder." />
        <SummaryWidget label="Custo medio" value={formatCurrency(filaments.reduce((sum, filament) => sum + filament.custo_por_kg, 0) / (filaments.length || 1))} description="Faixa media de referencia financeira por kg." />
        <SummaryWidget label="Cobertura" value={String(new Set(filaments.map((filament) => filament.tipo)).size)} description="Quantidade de tipos diferentes disponiveis na base." />
      </section>

      <form onSubmit={handleSubmit} className="rounded-[34px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.22)]">
        <div className="border-b border-white/10 pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-200">Novo material</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Adicionar material</h2>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <label className="block rounded-[28px] border border-white/10 bg-[#0a1228]/78 p-4">
            <span className="mb-2 block text-sm font-medium text-slate-200">Marca</span>
            <input value={form.marca} onChange={(event) => setForm({ ...form, marca: event.target.value })} className="w-full rounded-2xl border border-white/10 bg-[#081120] p-3 text-white" placeholder="Ex: Prusa" required />
          </label>
          <label className="block rounded-[28px] border border-white/10 bg-[#0a1228]/78 p-4">
            <span className="mb-2 block text-sm font-medium text-slate-200">Tipo</span>
            <input value={form.tipo} onChange={(event) => setForm({ ...form, tipo: event.target.value })} className="w-full rounded-2xl border border-white/10 bg-[#081120] p-3 text-white" placeholder="Ex: PLA" required />
          </label>
          <NumericInput label="Custo por kg" value={String(form.custo_por_kg)} onChange={(value) => setForm({ ...form, custo_por_kg: parseLocaleNumber(value) })} prefix="R$" hint="kg" />
        </div>

        <button type="submit" className="mt-6 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
          Adicionar material
        </button>
      </form>

      <section className="grid gap-4 xl:grid-cols-2">
        {filaments.map((filament) => (
          <article key={filament.id} className="rounded-[30px] border border-white/10 bg-[#0a1228]/78 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Material profile</p>
                <h3 className="mt-3 text-lg font-semibold text-white">{filament.tipo}</h3>
                <p className="mt-2 text-sm text-slate-400">{filament.marca}</p>
              </div>
              <div className="rounded-full bg-teal-400/12 px-4 py-2 text-sm font-semibold text-teal-200">{formatCurrency(filament.custo_por_kg)}</div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}