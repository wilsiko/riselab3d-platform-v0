import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Printers from './pages/Printers';
import Filaments from './pages/Filaments';
import Products from './pages/Products';
import Quotes from './pages/Quotes';
import Catalog from './pages/Catalog';
import PricingSetup from './pages/PricingSetup';

const primaryNavItems = [
  { label: 'Home', path: '/' },
  { label: 'Orcamentos', path: '/quotes' },
];

const systemNavItems = [
  { label: 'Catalogo', path: '/catalog' },
  { label: 'Pricing Setup', path: '/pricing' },
];

const THEME_STORAGE_KEY = 'riselab3d.theme';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.localStorage.getItem(THEME_STORAGE_KEY) === 'dark';
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(THEME_STORAGE_KEY, isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 ${isDarkMode ? 'theme-dark' : ''}`}>
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-slate-200 bg-white px-6 py-8">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <div className="text-2xl font-semibold text-slate-900">RiseLab3D</div>
              <p className="mt-2 text-sm text-slate-500">Cotacao SaaS para operacoes de impressao 3D</p>
            </div>
            <button
              type="button"
              onClick={() => setIsDarkMode((currentValue) => !currentValue)}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:bg-slate-100"
              aria-label={isDarkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
            >
              {isDarkMode ? 'Light' : 'Dark'}
            </button>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-[linear-gradient(135deg,rgba(240,249,255,1),rgba(248,250,252,1))] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">Modo operacional</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              O produto agora gira em torno de montar orcamentos rapido. Cadastros e regras ficam em modulos separados para nao poluir o uso diario.
            </p>
            <Link to="/quotes" className="mt-4 inline-flex rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
              Iniciar orcamento
            </Link>
          </div>

          <div className="mt-8">
            <p className="mb-3 px-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Daily use</p>
            <nav className="space-y-1">
              {primaryNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `block rounded-xl px-4 py-3 text-sm font-medium transition ${
                      isActive ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
                    }`
                  }
                  end={item.path === '/'}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="mt-8">
            <p className="mb-3 px-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Setup</p>
            <nav className="space-y-1">
              {systemNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `block rounded-xl px-4 py-3 text-sm font-medium transition ${
                      isActive ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-slate-700 shadow-sm">
            <p className="font-semibold text-slate-900">Princípio do produto</p>
            <p className="mt-2">
              Primeiro quote, depois setup. Se uma informacao nao for necessaria para fechar o preco agora, ela nao deve aparecer no fluxo principal.
            </p>
          </div>
        </aside>

        <main className="px-6 py-8">
          <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Workspace</p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-900">Uma ferramenta de cotacao, nao uma planilha disfarçada.</h1>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/quotes" className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
                Novo orcamento
              </Link>
              <Link to="/pricing" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                Revisar regras
              </Link>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/quotes" element={<Quotes />} />
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/catalog/products" element={<Products />} />
              <Route path="/catalog/materials" element={<Filaments />} />
              <Route path="/catalog/printers" element={<Printers />} />
              <Route path="/pricing" element={<PricingSetup />} />
              <Route path="/dashboard" element={<Navigate to="/" replace />} />
              <Route path="/products" element={<Navigate to="/catalog/products" replace />} />
              <Route path="/filaments" element={<Navigate to="/catalog/materials" replace />} />
              <Route path="/printers" element={<Navigate to="/catalog/printers" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
