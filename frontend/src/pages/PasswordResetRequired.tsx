import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from '../components/Alert';
import { useAuth } from '../auth/AuthContext';

export default function PasswordResetRequired() {
  const navigate = useNavigate();
  const { user, isAuthenticated, changePassword, isLoading } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      navigate('/login', { replace: true });
      return;
    }

    if (isAuthenticated && !user?.mustChangePassword) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, user?.mustChangePassword]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 8) {
      setError('A nova senha precisa ter ao menos 8 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('A confirmacao precisa ser igual a nova senha.');
      return;
    }

    setIsSubmitting(true);
    const result = await changePassword(newPassword);

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    setSuccess(result.message || 'Senha atualizada com sucesso.');
    setIsSubmitting(false);
    navigate('/', { replace: true });
  }

  return (
    <div className="mx-auto max-w-[760px] rounded-[38px] border border-white/10 bg-[linear-gradient(145deg,rgba(8,14,30,0.98),rgba(7,24,44,0.95),rgba(45,212,191,0.08))] p-4 shadow-[0_28px_90px_rgba(0,0,0,0.28)] sm:p-6 lg:p-8">
      <div className="rounded-[32px] border border-white/10 bg-[#081120]/90 p-6 shadow-[0_20px_70px_rgba(0,0,0,0.24)] sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200">Primeiro acesso com senha temporaria</p>
        <h1 className="mt-4 text-4xl font-semibold leading-[1.02] tracking-[-0.06em] text-white">Defina sua nova senha antes de continuar.</h1>
        <p className="mt-4 max-w-[56ch] text-sm leading-7 text-slate-300">
          Enviamos uma senha temporaria para {user?.email || 'seu e-mail'}. Por seguranca, o acesso completo so e liberado depois que voce cadastrar uma nova senha.
        </p>

        <div className="mt-6 space-y-4">
          {error ? <Alert type="error" message={error} onClose={() => setError(null)} /> : null}
          {success ? <Alert type="success" message={success} onClose={() => setSuccess(null)} /> : null}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
            <span className="mb-2 block text-sm font-medium text-slate-200">Nova senha</span>
            <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#0a1228]/90 p-3 text-white outline-none focus:border-cyan-400/40" placeholder="Minimo de 8 caracteres" />
          </label>

          <label className="block rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
            <span className="mb-2 block text-sm font-medium text-slate-200">Confirmar nova senha</span>
            <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#0a1228]/90 p-3 text-white outline-none focus:border-cyan-400/40" placeholder="Repita a nova senha" />
          </label>

          <button type="submit" disabled={isSubmitting || isLoading} className="brand-primary-action w-full rounded-2xl px-5 py-4 text-sm font-semibold transition disabled:cursor-not-allowed">
            {isSubmitting ? 'Atualizando senha...' : 'Salvar nova senha'}
          </button>
        </form>
      </div>
    </div>
  );
}