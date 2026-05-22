import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Alert } from '../components/Alert';
import { GoogleLoginButton } from '../components/GoogleLoginButton';
import { useAuth } from '../auth/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, login, register, loginWithGoogle, requestPasswordReset, isLoading } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRequestingPasswordReset, setIsRequestingPasswordReset] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(user?.mustChangePassword ? '/password-reset-required' : (location.state as { from?: string } | null)?.from || '/quotes', { replace: true });
    }
  }, [isAuthenticated, location.state, navigate, user?.mustChangePassword]);

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

  async function handleForgotPassword() {
    if (!email.trim()) {
      setError('Informe o e-mail cadastrado para receber a senha temporaria.');
      return;
    }

    setError(null);
    setSuccess(null);
    setIsRequestingPasswordReset(true);
    const result = await requestPasswordReset(email);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(result.message || 'Se o e-mail existir, enviaremos uma senha temporaria.');
    }

    setIsRequestingPasswordReset(false);
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-12rem)] max-w-[520px] items-center justify-center">
      <section className="w-full rounded-[30px] border border-white/10 bg-[#081120]/88 p-6 shadow-[0_22px_70px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Conta RiseLab3D</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">Entrar na plataforma</h1>
          </div>
          <Link to="/" className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white">
            Voltar ao site
          </Link>
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-400">
          Acesse sua operação para salvar cotações, histórico e configurações. Se preferir, você ainda pode simular sem login.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-1.5">
            <button type="button" onClick={() => setMode('login')} className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${mode === 'login' ? 'brand-primary-active' : 'text-slate-300 hover:bg-white/[0.08] hover:text-white'}`}>
              Entrar
            </button>
            <button type="button" onClick={() => setMode('register')} className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${mode === 'register' ? 'brand-primary-active' : 'text-slate-300 hover:bg-white/[0.08] hover:text-white'}`}>
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

            {mode === 'login' ? (
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={isRequestingPasswordReset || isSubmitting || isLoading}
                className="text-left text-sm font-medium text-cyan-200 transition hover:text-white disabled:cursor-not-allowed disabled:text-slate-500"
              >
                {isRequestingPasswordReset ? 'Enviando senha temporaria...' : 'Esqueci minha senha'}
              </button>
            ) : null}

            <button type="submit" disabled={isSubmitting || isLoading} className="brand-primary-action w-full rounded-2xl px-5 py-4 text-sm font-semibold transition disabled:cursor-not-allowed">
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
          Ao entrar, suas cotações, clientes e parâmetros ficam vinculados à sua conta.
        </p>

        <div className="mt-6 border-t border-white/10 pt-4">
          <div className="grid gap-2 text-center text-[11px] leading-5 text-slate-500 sm:grid-cols-3 sm:text-left">
            <p>Seus dados de acesso e operacao permanecem vinculados à sua conta.</p>
            <p>As sessoes do app usam cookie HTTP-only para reduzir exposicao no navegador.</p>
            <p>Recuperacao de senha e confirmacao de e-mail exigem validacao pelo endereco cadastrado.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
