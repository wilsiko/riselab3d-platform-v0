import { FormEvent, useState } from 'react';
import api from '../api';
import { AuthSession } from '../auth';

interface LoginProps {
  onAuthenticated: (session: AuthSession) => void;
}

export default function Login({ onAuthenticated }: LoginProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('admin@riselab3d.com.br');
  const [password, setPassword] = useState('RiseLab@16');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === 'register') {
      if (!name.trim()) {
        setErrorMessage('Informe o nome completo.');
        return;
      }

      if (password !== confirmPassword) {
        setErrorMessage('A confirmacao da senha precisa ser igual a senha.');
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const payload = mode === 'login' ? { email, password } : { name, email, password };
      const response = await api.post<AuthSession>(endpoint, payload);
      onAuthenticated(response.data);
    } catch (error: any) {
      setErrorMessage(
        error?.response?.data?.error ||
          (mode === 'login' ? 'Nao foi possivel autenticar.' : 'Nao foi possivel criar a conta.'),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6 py-10 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.32),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.24),_transparent_30%)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:34px_34px]" />

      <div className="relative grid w-full max-w-6xl gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur xl:p-12">
          <div className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
            RiseLab3D Platform
          </div>
          <h1 className="mt-6 max-w-xl text-4xl font-semibold tracking-tight text-white xl:text-6xl">
            Transforme sua operacao 3D em uma maquina de previsibilidade, escala e margem.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 xl:text-lg">
            Centralize impressoras, filamentos, produtos e orcamentos em um unico painel pensado para acelerar decisoes e dar mais controle ao seu negocio.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Mais controle', value: 'Custos claros' },
              { label: 'Mais velocidade', value: 'Orcamentos rapidos' },
              { label: 'Mais crescimento', value: 'Operacao escalavel' },
            ].map((item) => (
              <div key={item.label} className="rounded-3xl border border-white/10 bg-slate-900/60 p-5">
                <p className="text-sm text-slate-400">{item.label}</p>
                <p className="mt-3 text-2xl font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-800 bg-white p-8 text-slate-900 shadow-2xl shadow-cyan-950/20 xl:p-10">
          <div>
            <div className="inline-flex rounded-full bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage('');
                }}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  mode === 'login' ? 'bg-slate-950 text-white' : 'text-slate-600'
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage('');
                  setEmail('');
                  setPassword('');
                  setConfirmPassword('');
                }}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  mode === 'register' ? 'bg-slate-950 text-white' : 'text-slate-600'
                }`}
              >
                Criar conta
              </button>
            </div>
            <p className="mt-6 text-sm font-medium uppercase tracking-[0.22em] text-slate-400">
              {mode === 'login' ? 'Login' : 'Cadastro'}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              {mode === 'login' ? 'Acesse sua conta' : 'Crie sua conta'}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {mode === 'login'
                ? 'Usuario inicial para testes: admin@riselab3d.com.br com a senha RiseLab@16.'
                : 'Informe seus dados para criar um workspace e entrar automaticamente no painel.'}
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {mode === 'register' ? (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Nome completo</span>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="form-control-strong px-4"
                  placeholder="Seu nome completo"
                  autoComplete="name"
                />
              </label>
            ) : null}

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">E-mail</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="form-control-strong px-4"
                placeholder="voce@empresa.com"
                autoComplete="email"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Senha</span>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="form-control-strong px-4"
                placeholder="Sua senha"
                autoComplete="current-password"
              />
            </label>

            {mode === 'register' ? (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Confirmacao da senha</span>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="form-control-strong px-4"
                  placeholder="Confirme sua senha"
                  autoComplete="new-password"
                />
              </label>
            ) : null}

            <label className="flex items-center gap-3 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={showPasswords}
                onChange={(event) => setShowPasswords(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              Mostrar senhas
            </label>

            {errorMessage ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {errorMessage}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSubmitting
                ? mode === 'login'
                  ? 'Entrando...'
                  : 'Criando conta...'
                : mode === 'login'
                  ? 'Entrar no painel'
                  : 'Criar conta e entrar'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}