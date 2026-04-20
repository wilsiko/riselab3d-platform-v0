import { NavLink, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Printers from './pages/Printers';
import Filaments from './pages/Filaments';
import Settings from './pages/Settings';
import Products from './pages/Products';
import Quotes from './pages/Quotes';

const navItems = [
  { label: 'Dashboard', path: '/' },
  { label: 'Impressoras', path: '/printers' },
  { label: 'Filamentos', path: '/filaments' },
  { label: 'Configurações', path: '/settings' },
  { label: 'Produtos', path: '/products' },
  { label: 'Orçamentos', path: '/quotes' },
];

function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-slate-200 bg-white px-6 py-8">
          <div className="mb-8">
            <div className="text-2xl font-semibold text-slate-900">RiseLab3D</div>
            <p className="mt-2 text-sm text-slate-500">Gestão SaaS para impressão 3D</p>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => (
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
        </aside>

        <main className="px-6 py-8">
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/printers" element={<Printers />} />
              <Route path="/filaments" element={<Filaments />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/products" element={<Products />} />
              <Route path="/quotes" element={<Quotes />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
