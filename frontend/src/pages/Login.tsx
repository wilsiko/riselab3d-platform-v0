import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Alert } from '../components/Alert';
import { GoogleLoginButton } from '../components/GoogleLoginButton';
import { useAuth } from '../auth/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login, register, loginWithGoogle, isLoading } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate((location.state as { from?: string } | null)?.from || '/', { replace: true });
    }
  }, [isAuthenticated, location.state, navigate]);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    if (query.get('verified') === '1') {
      setSuccess('E-mail confirmado. Sua sessao ja foi iniciada.');
    }
  }, [location.search]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    if (mode === 'login') {
      const result = await login({ email, password });
      if (result.error) {
        setError(result.error);
      }
    } else {
      const result = await register({ name, email, password });
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(result.message || 'Conta criada. Verifique seu e-mail para concluir.');
        setMode('login');
      }
    }

    setIsSubmitting(false);
  }

  async function handleGoogleCredential(credential: string) {
    setError(null);
    const result = await loginWithGoogle(credential);
    if (result.error) {
      setError(result.error);
    }
  }

  return (
    <div className="mx-auto max-w-[1220px] rounded-[38px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(103,232,249,0.12),transparent_26%),radial-gradient(circle_at_82%_18%,rgba(34,197,94,0.1),transparent_20%),linear-gradient(135deg,rgba(8,14,30,0.98),rgba(7,24,44,0.95),rgba(45,212,191,0.08))] p-4 shadow-[0_28px_90px_rgba(0,0,0,0.28)] sm:p-6 lg:p-8">
      <div className="grid gap-5 rounded-[34px] border border-white/10 bg-white/[0.03] p-4 sm:p-5 lg:grid-cols-[minmax(0,1.16fr)_430px] lg:items-stretch lg:gap-6 lg:p-6">
        <section className="order-2 overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6 sm:p-8 lg:order-1 lg:min-h-[640px]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/[0.08] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200">Conta RiseLab3D</span>
            <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Modo visitante continua aberto</span>
          </div>

          <div className="mt-6 max-w-[580px]">
            <h1 className="text-4xl font-semibold leading-[1.02] tracking-[-0.07em] text-white sm:text-[56px]">Entre, salve e transforme cálculo em operação.</h1>
            <p className="mt-5 max-w-[50ch] text-sm leading-7 text-slate-300 sm:text-[15px]">
              A navegação segue livre para simular preços. A conta destrava histórico, clientes, parâmetros e tudo que precisa permanecer organizado no seu tenant.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <article className="rounded-[28px] border border-white/10 bg-[#081120]/68 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">O que entra com a conta</p>
              <div className="mt-4 grid gap-3 text-sm text-slate-300">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <p className="font-semibold text-white">Histórico comercial salvo</p>
                  <p className="mt-1 text-slate-400">Recupere cotações e acompanhe o que já foi entregue ao cliente.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <p className="font-semibold text-white">Configuração por operação</p>
                  <p className="mt-1 text-slate-400">Impressoras, energia e margens passam a pertencer ao seu tenant.</p>
                </div>
                <div className="rounded-2xl border border-cyan-400/18 bg-cyan-400/[0.08] px-4 py-3 text-slate-200">
                  <p className="font-semibold text-white">Entrada rápida com Google</p>
                  <p className="mt-1 text-slate-300">Com e-mail próprio, o acesso é liberado após confirmar o link enviado.</p>
                </div>
              </div>
            </article>

            <div className="grid gap-3">
              <article className="rounded-[28px] border border-white/10 bg-white/[0.05] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Visitante</p>
                <p className="mt-2 text-xl font-semibold tracking-[-0.04em] text-white">Simule sem atrito</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">Pesquise preços, teste margens e explore a plataforma antes de entrar.</p>
              </article>

              <article className="rounded-[28px] border border-white/10 bg-white/[0.05] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Acesso autenticado</p>
                <p className="mt-2 text-xl font-semibold tracking-[-0.04em] text-white">Operação contínua</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">Centralize clientes, revise histórico e mantenha a base de cálculo da sua operação sempre pronta.</p>
              </article>

              <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(34,211,238,0.12),rgba(255,255,255,0.04))] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200">Sem compromisso inicial</p>
                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  <Link to="/quotes" className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 font-semibold text-white transition hover:bg-white/[0.1]">
                    Continuar como visitante
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="order-1 rounded-[32px] border border-white/10 bg-[#081120]/90 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.24)] sm:p-6 lg:order-2 lg:sticky lg:top-24">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Acesso</p>
              <p className="mt-2 text-xl font-semibold tracking-[-0.04em] text-white">Entre na sua operação</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.08] px-3 py-2 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Status</p>
              <p className="mt-1 text-sm font-semibold text-cyan-200">Login ativo</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-1.5">
            <button type="button" onClick={() => setMode('login')} className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${mode === 'login' ? 'bg-cyan-400 text-slate-950' : 'text-slate-300 hover:bg-white/[0.08] hover:text-white'}`}>
              Entrar
            </button>
            <button type="button" onClick={() => setMode('register')} className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${mode === 'register' ? 'bg-cyan-400 text-slate-950' : 'text-slate-300 hover:bg-white/[0.08] hover:text-white'}`}>
              Criar conta
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {error ? <Alert type="error" message={error} onClose={() => setError(null)} /> : null}
            {success ? <Alert type="success" message={success} onClose={() => setSuccess(null)} /> : null}
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {mode === 'register' ? (
              <label className="block rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                <span className="mb-2 block text-sm font-medium text-slate-200">Nome</span>
                <input value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#0a1228]/90 p-3 text-white outline-none focus:border-cyan-400/40" placeholder="Ex.: Wilson" />
              </label>
            ) : null}

            <label className="block rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
              <span className="mb-2 block text-sm font-medium text-slate-200">E-mail</span>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#0a1228]/90 p-3 text-white outline-none focus:border-cyan-400/40" placeholder="voce@empresa.com" />
            </label>

            <label className="block rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
              <span className="mb-2 block text-sm font-medium text-slate-200">Senha</span>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#0a1228]/90 p-3 text-white outline-none focus:border-cyan-400/40" placeholder="Minimo de 8 caracteres" />
            </label>

            <button type="submit" disabled={isSubmitting || isLoading} className="w-full rounded-2xl bg-cyan-400 px-5 py-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400">
              {mode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.22em] text-slate-500">
            <div className="h-px flex-1 bg-white/10" />
            <span>ou use Google</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <GoogleLoginButton onCredential={handleGoogleCredential} />

          <p className="mt-5 text-center text-xs leading-6 text-slate-500">
            Ao entrar, você mantém suas cotações, clientes e parâmetros vinculados à sua operação.
          </p>
        </section>
      </div>
    </div>
  );
}
