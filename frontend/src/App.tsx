import { useEffect, useState } from 'react';
import { NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Admin from './pages/Admin';
import AdminPrinterModels from './pages/AdminPrinterModels';
import AdminProductColors from './pages/AdminProductColors';
import Dashboard from './pages/Dashboard';
import Printers from './pages/Printers';
import Filaments from './pages/Filaments';
import Settings from './pages/Settings';
import Products from './pages/Products';
import Quotes from './pages/Quotes';
import Help from './pages/Help';
import WelcomeGuideModal from './components/WelcomeGuideModal';
import { AuthSession, clearSession, dismissWelcomeGuide, loadSession, saveSession, shouldShowWelcomeGuide } from './auth';

const THEME_STORAGE_KEY = 'riselab3d.theme';

const primaryNavItems = [
  { label: 'Produtos', path: '/products' },
  { label: 'Orçamentos', path: '/quotes' },
];

const catalogNavItems = [
  { label: 'Impressoras', path: '/printers' },
  { label: 'Filamentos', path: '/filaments' },
];

const parameterNavItems = [{ label: 'Configurações', path: '/settings' }];

const supportNavItems = [{ label: 'Ajuda e Feedback', path: '/help' }];

const adminNavItems = [
  { label: 'Administração', path: '/admin' },
  { label: 'Modelos de Impressora', path: '/admin/printer-models' },
  { label: 'Cores de Produto', path: '/admin/product-colors' },
];

function App() {
  const [session, setSession] = useState<AuthSession | null>(() => loadSession());
  const [showWelcomeGuide, setShowWelcomeGuide] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.localStorage.getItem(THEME_STORAGE_KEY) === 'dark';
  });
  const navigate = useNavigate();
  const isClientUser = session?.user.role === 'client';

  useEffect(() => {
    function handleUnauthorized() {
      setSession(null);
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  useEffect(() => {
    if (!session || session.user.isPlatformAdmin) {
      setShowWelcomeGuide(false);
      return;
    }

    setShowWelcomeGuide(shouldShowWelcomeGuide(session));
  }, [session]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(THEME_STORAGE_KEY, isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  function handleAuthenticated(nextSession: AuthSession) {
    saveSession(nextSession);
    setSession(nextSession);
    navigate('/');
  }

  function handleLogout() {
    clearSession();
    setSession(null);
    navigate('/');
  }

  function handleCloseWelcomeGuide(dontShowAgain: boolean) {
    if (session && dontShowAgain) {
      dismissWelcomeGuide(session);
    }

    setShowWelcomeGuide(false);
  }

  function handleToggleTheme() {
    setIsDarkMode((currentValue) => !currentValue);
  }

  function navItemClass(isActive: boolean, variant: 'primary' | 'default' | 'parameter' = 'default') {
    if (variant === 'primary') {
      return isActive
        ? 'bg-slate-900 text-white shadow-sm'
        : 'bg-white text-slate-900 hover:bg-slate-100';
    }

    if (variant === 'parameter') {
      return isActive
        ? 'bg-amber-500 text-white shadow-sm'
        : 'text-amber-900 hover:bg-white/80';
    }

    return isActive
      ? 'bg-slate-900 text-white shadow-sm'
      : 'text-slate-700 hover:bg-slate-100';
  }

  if (!session) {
    return <Login onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 ${isDarkMode ? 'theme-dark' : ''}`}>
      {session && showWelcomeGuide ? (
        <WelcomeGuideModal userName={session.user.name} onClose={handleCloseWelcomeGuide} />
      ) : null}
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-slate-200 bg-white px-6 py-8">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <div className="text-2xl font-semibold text-slate-900">RiseLab3D</div>
              <p className="mt-2 text-sm text-slate-500">Gestão SaaS para impressão 3D</p>
            </div>
            <button
              type="button"
              onClick={handleToggleTheme}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:bg-slate-100"
              aria-label={isDarkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
            >
              {isDarkMode ? 'Light' : 'Dark'}
            </button>
          </div>
          <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Sessao</p>
            <p className="mt-3 text-sm font-medium text-slate-900">{session.user.name}</p>
            <p className="mt-1 text-sm text-slate-500">{session.user.email}</p>
            <p className="mt-1 text-sm text-slate-500">{session.user.tenantName}</p>
          </div>
          <div className="space-y-6">
            <div className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-slate-50 p-2 shadow-sm">
              <p className="px-3 pt-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">Visão geral</p>
              <p className="px-3 pt-2 text-xs leading-5 text-slate-500">Acompanhe o resumo da operação e os principais indicadores do cliente.</p>
              <nav className="mt-3 space-y-1">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `block rounded-xl px-4 py-3 text-sm font-medium transition ${
                      isActive ? 'bg-cyan-700 text-white shadow-sm' : 'text-cyan-900 hover:bg-white'
                    }`
                  }
                  end
                >
                  Dashboard
                </NavLink>
              </nav>
            </div>

            <div>
              <p className="mb-3 px-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Uso diário</p>
              <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-cyan-50 p-3 shadow-sm">
                <p className="px-2 text-sm font-semibold text-slate-900">Atalhos principais</p>
                <p className="px-2 pt-1 text-xs leading-5 text-slate-500">Deixe perto as telas usadas o tempo todo para cadastrar produtos e montar orçamentos.</p>
                <nav className="mt-3 space-y-2">
                  {primaryNavItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) => `block rounded-2xl px-4 py-3 text-sm font-semibold transition ${navItemClass(isActive, 'primary')}`}
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </nav>
              </div>
            </div>

            <div>
              <p className="mb-3 px-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Cadastros de produção</p>
              <nav className="space-y-1">
                {catalogNavItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `block rounded-xl px-4 py-3 text-sm font-medium transition ${navItemClass(isActive)}`}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>

            <div>
              <p className="mb-3 px-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Menus paramétricos</p>
              <nav className="space-y-1 rounded-2xl border border-amber-100 bg-amber-50/70 p-2">
                {parameterNavItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `block rounded-xl px-4 py-3 text-sm font-medium transition ${navItemClass(isActive, 'parameter')}`}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>

            {isClientUser ? (
              <div>
                <p className="mb-3 px-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Ajuda</p>
                <nav className="space-y-1 rounded-2xl border border-amber-100 bg-amber-50/70 p-2">
                  {supportNavItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `block rounded-xl px-4 py-3 text-sm font-medium transition ${
                          isActive ? 'bg-amber-500 text-white shadow-sm' : 'text-amber-900 hover:bg-white/80'
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </nav>
              </div>
            ) : null}
          </div>
          {session.user.isPlatformAdmin ? (
            <div className="mt-6 border-t border-slate-200 pt-6">
              <p className="mb-3 px-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">
                Administração
              </p>
              <nav className="space-y-1 rounded-2xl bg-cyan-50/70 p-2">
                {adminNavItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `block rounded-xl px-4 py-3 text-sm font-medium transition ${
                        isActive
                          ? 'bg-cyan-700 text-white shadow-sm'
                          : 'text-cyan-900 hover:bg-white/80'
                      }`
                    }
                    end={item.path === '/admin'}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>
          ) : null}
          <button
            type="button"
            onClick={handleLogout}
            className="mt-6 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Sair
          </button>
        </aside>

        <main className="px-6 py-8">
          {session.user.isPlatformAdmin ? (
            <div className="mb-4 flex items-center justify-between rounded-2xl border border-cyan-200 bg-cyan-50 px-5 py-4 text-sm text-cyan-900 shadow-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">Perfil ativo</p>
                <p className="mt-1 font-medium">Administrador da plataforma</p>
              </div>
              <span className="rounded-full bg-cyan-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">
                Acesso master
              </span>
            </div>
          ) : null}
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/printers" element={<Printers />} />
              <Route path="/filaments" element={<Filaments />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/products" element={<Products />} />
              <Route path="/quotes" element={<Quotes />} />
              {isClientUser ? <Route path="/help" element={<Help />} /> : null}
              {session.user.isPlatformAdmin ? <Route path="/admin" element={<Admin />} /> : null}
              {session.user.isPlatformAdmin ? <Route path="/admin/printer-models" element={<AdminPrinterModels />} /> : null}
              {session.user.isPlatformAdmin ? <Route path="/admin/product-colors" element={<AdminProductColors />} /> : null}
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
