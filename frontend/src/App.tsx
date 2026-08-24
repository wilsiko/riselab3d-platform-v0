import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import './App.css';
import InstitutionalHome from './pages/InstitutionalHome';
import Printers from './pages/Printers';
import Products from './pages/Products';
import Quotes from './pages/Quotes';
import Catalog from './pages/Catalog';
import PricingSetup from './pages/PricingSetup';
import Login from './pages/Login';
import PublicQuote from './pages/PublicQuote';
import PasswordResetRequired from './pages/PasswordResetRequired';

const platformPrimaryNav = [
  { label: 'Cotacoes', path: '/quotes' },
];

const platformMobileNav = [
  { label: 'Cotacoes', path: '/quotes' },
  { label: 'Config', path: '/pricing' },
  { label: 'Site', path: '/site' },
];

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

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
      <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
      <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function App() {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [isPlatformMenuOpen, setIsPlatformMenuOpen] = useState(false);
  const requiresPasswordChange = isAuthenticated && Boolean(user?.mustChangePassword);
  const isMarketingRoute = location.pathname === '/site';

  useEffect(() => {
    setIsPlatformMenuOpen(false);
  }, [location.pathname]);

  if (isMarketingRoute) {
    return (
      <div className="min-h-screen bg-[var(--marketing-bg)] text-[var(--marketing-ink)]">
        <div className="marketing-backdrop" aria-hidden="true" />
        <div className="relative mx-auto min-h-screen max-w-[1440px] px-5 pb-12 pt-5 sm:px-8 lg:px-10">
          <header className="marketing-topbar">
            <div className="marketing-topbar-main">
              <Link to="/" className="marketing-brand">
                <span className="marketing-brand-mark">RL</span>
                <span>
                  <strong>RiseLab3D</strong>
                  <small>Filamentos, impressoras e suprimentos 3D em Santos</small>
                </span>
              </Link>

              <nav className="marketing-nav" aria-label="Navegacao principal">
                <a href="#destaques">Produtos</a>
                <a href="#sobre">Operacao</a>
                <a href="#showroom">Showroom</a>
                <a href="#plataforma">Plataforma de custos</a>
              </nav>
            </div>

            <div className="marketing-topbar-actions">
              <a href="#contato" className="marketing-inline-action">Solicitar atendimento</a>
              {isAuthenticated ? (
                <>
                  <Link to="/quotes" className="marketing-inline-ghost">Abrir plataforma</Link>
                  <button type="button" onClick={() => logout()} className="marketing-inline-ghost">Sair</button>
                </>
              ) : (
                <Link to="/login" className="marketing-inline-ghost">Entrar</Link>
              )}
            </div>
          </header>

          <main>
            <Routes>
              <Route path="/site" element={<InstitutionalHome />} />
            </Routes>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-clip bg-[#050816] text-slate-100 theme-dark">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_85%_15%,rgba(45,212,191,0.14),transparent_24%),linear-gradient(180deg,rgba(5,8,22,1),rgba(9,14,31,1))]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 border-b border-white/6 bg-white/[0.02] backdrop-blur-2xl" />

      <div className="relative mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 pb-10 pt-4 sm:px-6 lg:px-10 lg:pb-10">
        <header className="relative z-20 rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-2xl sm:px-5">
          <div className="flex items-center justify-between gap-3 lg:hidden">
            <Link to="/" className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-xs font-semibold tracking-[0.3em] text-cyan-200">
                  RL
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold tracking-[0.12em] text-white">RiseLab3D</p>
                  <p className="truncate text-[10px] uppercase tracking-[0.2em] text-slate-400">Plataforma de custos</p>
                </div>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setIsPlatformMenuOpen((value) => !value)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-slate-100 transition hover:bg-white/[0.1]"
              aria-expanded={isPlatformMenuOpen}
              aria-controls="platform-mobile-menu"
              aria-label={isPlatformMenuOpen ? 'Fechar menu da plataforma' : 'Abrir menu da plataforma'}
            >
              {isPlatformMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>

          {isPlatformMenuOpen ? (
            <div id="platform-mobile-menu" className="mt-4 grid gap-3 rounded-[24px] border border-white/10 bg-[#091126]/95 p-3 lg:hidden">
              <nav className="grid gap-2" aria-label="Navegacao da plataforma no mobile">
                {platformMobileNav.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                        isActive ? 'brand-primary-active' : 'bg-white/[0.03] text-slate-200 hover:bg-white/[0.08] hover:text-white'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                {isAuthenticated ? (
                  <div className="grid gap-3">
                    <div>
                      <p className="font-semibold text-white">{user?.name || user?.email}</p>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Conta da plataforma</p>
                    </div>
                    <button type="button" onClick={() => logout()} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-left text-xs font-semibold text-slate-200 transition hover:bg-white/[0.08] hover:text-white">
                      Sair
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    <div>
                      <p className="font-semibold text-white">Modo visitante</p>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Simulacao livre sem historico salvo</p>
                    </div>
                    <Link to="/login" className="brand-primary-action rounded-xl px-3 py-3 text-center text-xs font-semibold transition">
                      Entrar
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          <div className="hidden flex-col gap-4 xl:flex xl:flex-row xl:items-center xl:justify-between lg:flex">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <Link to="/" className="min-w-fit">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-sm font-semibold tracking-[0.3em] text-cyan-200">
                    RL
                  </div>
                  <div>
                    <p className="text-lg font-semibold tracking-[0.18em] text-white">RiseLab3D</p>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Plataforma completa para calculo dos custos de impressao</p>
                  </div>
                </div>
              </Link>

              <div className="flex flex-wrap items-center gap-3">
                <nav className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-[#0a1228]/70 p-1.5">
                  {platformPrimaryNav.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
                          isActive ? 'brand-primary-active' : 'text-slate-300 hover:bg-white/8 hover:text-white'
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </nav>

                <NavLink
                  to="/pricing"
                  className={({ isActive }) =>
                    `inline-flex items-center rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
                      isActive
                        ? 'brand-primary-active'
                        : 'border-cyan-400/20 bg-cyan-400/[0.08] text-cyan-200 hover:border-cyan-300/35 hover:bg-cyan-400/[0.14] hover:text-white'
                    }`
                  }
                >
                  Configuracoes
                </NavLink>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-[#0a1228]/70 px-4 py-2.5 text-sm text-slate-300">
                {isAuthenticated ? (
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-semibold text-white">{user?.name || user?.email}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Conta da plataforma</p>
                    </div>
                    <button type="button" onClick={() => logout()} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.08] hover:text-white">
                      Sair
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-semibold text-white">Modo visitante</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Simulacao livre sem historico salvo</p>
                    </div>
                    <Link to="/login" className="brand-primary-action rounded-xl px-3 py-2 text-xs font-semibold transition">
                      Entrar
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <nav className="mt-4 grid grid-cols-3 gap-2 rounded-[20px] border border-white/10 bg-[#091126]/90 p-2 shadow-[0_12px_30px_rgba(0,0,0,0.25)] backdrop-blur-2xl lg:hidden" aria-label="Atalhos da plataforma no mobile">
          {platformMobileNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `rounded-xl px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.12em] transition ${
                  isActive ? 'brand-primary-active' : 'text-slate-300 hover:bg-white/[0.08] hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <main className="relative mt-5 flex-1">
          <div className="rounded-[36px] border border-white/10 bg-white/[0.035] p-3 shadow-[0_30px_100px_rgba(0,0,0,0.24)] backdrop-blur-2xl sm:p-5 lg:p-6">
            <Routes>
              <Route path="/" element={<Navigate to="/quotes" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/password-reset-required" element={isAuthenticated ? <PasswordResetRequired /> : <Navigate to="/login" replace />} />
              <Route path="/quotes" element={requiresPasswordChange ? <Navigate to="/password-reset-required" replace /> : <Quotes />} />
              <Route path="/shared/quotes/:token" element={requiresPasswordChange ? <Navigate to="/password-reset-required" replace /> : <PublicQuote />} />
              <Route path="/catalog" element={requiresPasswordChange ? <Navigate to="/password-reset-required" replace /> : <Catalog />} />
              <Route path="/catalog/products" element={requiresPasswordChange ? <Navigate to="/password-reset-required" replace /> : <Products />} />
              <Route path="/catalog/printers" element={requiresPasswordChange ? <Navigate to="/password-reset-required" replace /> : <Printers />} />
              <Route path="/pricing" element={requiresPasswordChange ? <Navigate to="/password-reset-required" replace /> : <PricingSetup />} />
              <Route path="/dashboard" element={<Navigate to="/quotes" replace />} />
              <Route path="/products" element={<Navigate to="/catalog/products" replace />} />
              <Route path="/filaments" element={<Navigate to="/catalog/products" replace />} />
              <Route path="/printers" element={<Navigate to="/catalog/printers" replace />} />
              <Route path="/site" element={<InstitutionalHome />} />
              <Route path="*" element={<Navigate to="/quotes" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
