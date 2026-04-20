import { useEffect, useState } from 'react';
import api from '../api';

interface DashboardStats {
  productsCount: number;
  quotesCount: number;
  printersCount: number;
  filamentsCount: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api.get('/dashboard').then((response) => setStats(response.data));
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-semibold text-slate-900">Dashboard</h1>
      <p className="mt-2 text-slate-600">Resumo da operação e principais métricas.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {['Produtos ativos', 'Orçamentos', 'Impressoras ativas', 'Filamentos ativos'].map((label, index) => {
          const value = stats
            ? [stats.productsCount, stats.quotesCount, stats.printersCount, stats.filamentsCount][index]
            : '...';
          return (
            <div key={label} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-4 text-4xl font-semibold text-slate-900">{value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
