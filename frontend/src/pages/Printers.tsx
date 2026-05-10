import { FormEvent, useEffect, useState } from 'react';
import api from '../api';
import { Alert } from '../components/Alert';
import { Loading } from '../components/Loading';
import { NumericInput } from '../components/NumericInput';
import { SummaryWidget } from '../components/SummaryWidget';
import { Printer } from '../types';
import { parseLocaleNumber } from '../utils/number';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function Printers() {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [form, setForm] = useState({ nome: '', consumo_watts: 120, custo_aquisicao: 1500, vida_util_horas: 2000 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadPrinters = async () => {
      try {
        setIsLoading(true);
        const response = await api.get<Printer[]>('/printers');
        setPrinters(response.data);
      } catch (requestError: any) {
        setError(requestError?.response?.data?.error || 'Nao foi possivel carregar as impressoras.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPrinters();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      setIsLoading(true);
      const response = await api.post<Printer>('/printers', form);
      setPrinters((previousPrinters) => [...previousPrinters, response.data]);
      setForm({ nome: '', consumo_watts: 120, custo_aquisicao: 1500, vida_util_horas: 2000 });
      setSuccess('Perfil de impressora adicionado ao catalogo tecnico.');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || 'Nao foi possivel criar a impressora.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Loading isLoading={isLoading} label="Sincronizando impressoras..." />

      <section className="rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(8,14,30,0.96),rgba(7,24,44,0.96),rgba(45,212,191,0.12))] p-8 shadow-[0_28px_90px_rgba(0,0,0,0.28)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200">Perfis de maquina</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white">Perfis de impressora com leitura tecnica e impacto financeiro claro.</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">A estrutura tecnica da operacao agora segue a mesma linguagem premium da cotacao, sem virar planilha disfarçada.</p>
      </section>

      {error ? <Alert type="error" message={error} onClose={() => setError(null)} /> : null}
      {success ? <Alert type="success" message={success} onClose={() => setSuccess(null)} /> : null}

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryWidget label="Perfis ativos" value={String(printers.length)} description="Impressoras prontas para alimentar custo e capacidade." />
        <SummaryWidget label="Consumo medio" value={`${(printers.reduce((sum, printer) => sum + printer.consumo_watts, 0) / (printers.length || 1)).toFixed(0)} W`} description="Leitura rapida da faixa energetica do parque." />
        <SummaryWidget label="Investimento medio" value={formatCurrency(printers.reduce((sum, printer) => sum + printer.custo_aquisicao, 0) / (printers.length || 1))} description="Parametro medio de aquisicao para amortizacao." />
      </section>

      <form onSubmit={handleSubmit} className="rounded-[34px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.22)]">
        <div className="border-b border-white/10 pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-200">Novo perfil</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Adicionar impressora</h2>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className="block rounded-[28px] border border-white/10 bg-[#0a1228]/78 p-4">
            <span className="mb-2 block text-sm font-medium text-slate-200">Nome</span>
            <input value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} className="w-full rounded-2xl border border-white/10 bg-[#081120] p-3 text-white" placeholder="Ex: Ender 3" required />
          </label>
          <NumericInput label="Consumo" value={String(form.consumo_watts)} onChange={(value) => setForm({ ...form, consumo_watts: parseLocaleNumber(value) })} suffix="W" hint="energia" />
          <NumericInput label="Custo de aquisicao" value={String(form.custo_aquisicao)} onChange={(value) => setForm({ ...form, custo_aquisicao: parseLocaleNumber(value) })} prefix="R$" hint="capex" />
          <NumericInput label="Vida util" value={String(form.vida_util_horas)} onChange={(value) => setForm({ ...form, vida_util_horas: parseLocaleNumber(value) })} suffix="h" hint="uso" />
        </div>

        <button type="submit" className="brand-primary-action mt-6 rounded-2xl px-5 py-3 text-sm font-semibold transition">
          Adicionar impressora
        </button>
      </form>

      <section className="grid gap-4 xl:grid-cols-2">
        {printers.map((printer) => (
          <article key={printer.id} className="rounded-[30px] border border-white/10 bg-[#0a1228]/78 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Printer profile</p>
                <h3 className="mt-3 text-lg font-semibold text-white">{printer.nome}</h3>
              </div>
              <div className="rounded-full bg-teal-400/12 px-4 py-2 text-sm font-semibold text-teal-200">{printer.consumo_watts} W</div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Aquisicao</p>
                <p className="mt-2 text-sm font-semibold text-white">{formatCurrency(printer.custo_aquisicao)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Vida util</p>
                <p className="mt-2 text-sm font-semibold text-white">{printer.vida_util_horas} h</p>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}