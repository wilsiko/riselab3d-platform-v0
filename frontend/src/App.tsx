import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import Home from './pages/Home';
import Printers from './pages/Printers';
import Products from './pages/Products';
import Quotes from './pages/Quotes';
import Catalog from './pages/Catalog';
import PricingSetup from './pages/PricingSetup';
import Login from './pages/Login';
import PublicQuote from './pages/PublicQuote';
import PasswordResetRequired from './pages/PasswordResetRequired';

const settingsNavItem = { label: 'Configuracoes', path: '/pricing' };

const VISUAL_MODE_STORAGE_KEY = 'riselab3d.visual-mode';

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path strokeLinecap="round" d="M12 2.75V5.25M12 18.75V21.25M21.25 12H18.75M5.25 12H2.75M18.54 5.46L16.77 7.23M7.23 16.77L5.46 18.54M18.54 18.54L16.77 16.77M7.23 7.23L5.46 5.46" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.2 14.1A8.5 8.5 0 1 1 9.9 3.8a7 7 0 0 0 10.3 10.3Z"
      />
    </svg>
  );
}

function App() {
  const { user, isAuthenticated, logout } = useAuth();
  const requiresPasswordChange = isAuthenticated && Boolean(user?.mustChangePassword);
  const primaryNavItems = isAuthenticated
    ? [
        { label: 'Home', path: '/' },
        { label: 'Cotacoes', path: '/quotes' },
      ]
    : [{ label: 'Cotacoes', path: '/quotes' }];
  const [visualMode, setVisualMode] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') {
      return 'dark';
    }

    const storedValue = window.localStorage.getItem(VISUAL_MODE_STORAGE_KEY);
    return storedValue === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(VISUAL_MODE_STORAGE_KEY, visualMode);
  }, [visualMode]);

  return (
    <div className={`min-h-screen overflow-x-clip ${visualMode === 'dark' ? 'bg-[#050816] text-slate-100 theme-dark' : 'bg-[#eef4fb] text-slate-900 theme-light'}`}>
      <div
        className={`pointer-events-none absolute inset-0 ${
          visualMode === 'dark'
            ? 'bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_85%_15%,rgba(45,212,191,0.14),transparent_24%),linear-gradient(180deg,rgba(5,8,22,1),rgba(9,14,31,1))]'
            : 'bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_85%_15%,rgba(45,212,191,0.12),transparent_22%),linear-gradient(180deg,rgba(238,244,251,1),rgba(226,236,247,1))]'
        }`}
      />
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-28 backdrop-blur-2xl ${
          visualMode === 'dark' ? 'border-b border-white/6 bg-white/[0.02]' : 'border-b border-slate-200/70 bg-white/35'
        }`}
      />

      <div className="relative mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 pb-10 pt-4 sm:px-6 lg:px-10">
        <header className="sticky top-4 z-20 rounded-[28px] border border-white/10 bg-white/5 px-5 py-4 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <Link to={isAuthenticated ? '/' : '/quotes'} className="min-w-fit">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-sm font-semibold tracking-[0.3em] text-cyan-200">
                    RL
                  </div>
                  <div>
                    <p className="text-lg font-semibold tracking-[0.18em] text-white">RiseLab3D</p>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                      {isAuthenticated ? 'Motor de precificacao para impressao 3D' : 'Cotacao guiada para impressao 3D'}
                    </p>
                  </div>
                </div>
              </Link>

              <div className="flex flex-wrap items-center gap-3">
                <nav className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-[#0a1228]/70 p-1.5">
                {primaryNavItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      `rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? 'brand-primary-active'
                          : 'text-slate-300 hover:bg-white/8 hover:text-white'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
                </nav>

                <NavLink
                  to={settingsNavItem.path}
                  className={({ isActive }) =>
                    `inline-flex items-center rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
                      isActive
                        ? 'brand-primary-active'
                        : 'border-cyan-400/20 bg-cyan-400/[0.08] text-cyan-200 hover:border-cyan-300/35 hover:bg-cyan-400/[0.14] hover:text-white'
                    }`
                  }
                >
                  {settingsNavItem.label}
                </NavLink>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-[#0a1228]/70 px-4 py-2.5 text-sm text-slate-300">
                {isAuthenticated ? (
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-semibold text-white">{user?.name || user?.email}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Cliente premium</p>
                    </div>
                    <button type="button" onClick={() => logout()} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.08] hover:text-white">
                      Sair
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-semibold text-white">Modo visitante</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Cotacao livre sem historico</p>
                    </div>
                    <Link to="/login" className="brand-primary-action rounded-xl px-3 py-2 text-xs font-semibold transition">
                      Entrar
                    </Link>
                  </div>
                )}
              </div>

              <div
                className={`flex items-center gap-1 rounded-full border p-1 backdrop-blur-2xl transition ${
                  visualMode === 'dark' ? 'border-white/10 bg-white/[0.05]' : 'border-slate-200/80 bg-white/80 shadow-[0_12px_32px_rgba(148,163,184,0.18)]'
                }`}
                aria-label="Modo de visualizacao"
              >
                <button
                  type="button"
                  onClick={() => setVisualMode('light')}
                  aria-label="Ativar modo claro"
                  aria-pressed={visualMode === 'light'}
                  title="Modo claro"
                  className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
                    visualMode === 'light'
                      ? 'border-amber-200 bg-amber-50 text-amber-700 shadow-[0_10px_24px_rgba(251,191,36,0.28)]'
                      : visualMode === 'dark'
                        ? 'border-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.08] hover:text-white'
                        : 'border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <SunIcon />
                </button>
                <button
                  type="button"
                  onClick={() => setVisualMode('dark')}
                  aria-label="Ativar modo escuro"
                  aria-pressed={visualMode === 'dark'}
                  title="Modo escuro"
                  className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
                    visualMode === 'dark'
                      ? 'border-cyan-300/20 bg-slate-950 text-cyan-300 shadow-[0_10px_24px_rgba(15,23,42,0.4)]'
                      : visualMode === 'light'
                        ? 'border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                        : 'border-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  <MoonIcon />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="relative mt-5 flex-1">
          <div className="rounded-[36px] border border-white/10 bg-white/[0.035] p-3 shadow-[0_30px_100px_rgba(0,0,0,0.24)] backdrop-blur-2xl sm:p-5 lg:p-6">
            <Routes>
              <Route path="/" element={isAuthenticated ? (requiresPasswordChange ? <Navigate to="/password-reset-required" replace /> : <Home />) : <Navigate to="/quotes" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/password-reset-required" element={isAuthenticated ? <PasswordResetRequired /> : <Navigate to="/login" replace />} />
              <Route path="/quotes" element={requiresPasswordChange ? <Navigate to="/password-reset-required" replace /> : <Quotes />} />
              <Route path="/shared/quotes/:token" element={requiresPasswordChange ? <Navigate to="/password-reset-required" replace /> : <PublicQuote />} />
              <Route path="/catalog" element={requiresPasswordChange ? <Navigate to="/password-reset-required" replace /> : <Catalog />} />
              <Route path="/catalog/products" element={requiresPasswordChange ? <Navigate to="/password-reset-required" replace /> : <Products />} />
              <Route path="/catalog/printers" element={requiresPasswordChange ? <Navigate to="/password-reset-required" replace /> : <Printers />} />
              <Route path="/pricing" element={requiresPasswordChange ? <Navigate to="/password-reset-required" replace /> : <PricingSetup />} />
              <Route path="/dashboard" element={<Navigate to="/" replace />} />
              <Route path="/products" element={<Navigate to="/catalog/products" replace />} />
              <Route path="/filaments" element={<Navigate to="/catalog/products" replace />} />
              <Route path="/printers" element={<Navigate to="/catalog/printers" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
