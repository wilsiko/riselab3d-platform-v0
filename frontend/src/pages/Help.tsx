import { FormEvent, useEffect, useState } from 'react';
import api from '../api';
import { Alert } from '../components/Alert';
import { Loading } from '../components/Loading';
import { Feedback } from '../types';

const feedbackCategories = [
  'Nova funcionalidade',
  'Dúvida',
  'Melhoria de usabilidade',
  'Bug ou comportamento inesperado',
];

export default function Help() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    category: feedbackCategories[0],
    subject: '',
    message: '',
  });

  useEffect(() => {
    const loadFeedbacks = async () => {
      try {
        setIsLoading(true);
        const response = await api.get<Feedback[]>('/feedback');
        setFeedbacks(response.data);
      } catch (requestError: any) {
        setError(requestError?.response?.data?.error || 'Erro ao carregar feedbacks.');
      } finally {
        setIsLoading(false);
      }
    };

    loadFeedbacks();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      setIsLoading(true);
      const response = await api.post<Feedback>('/feedback', form);
      setFeedbacks((currentFeedbacks) => [response.data, ...currentFeedbacks].slice(0, 10));
      setForm({
        category: feedbackCategories[0],
        subject: '',
        message: '',
      });
      setSuccess('Feedback enviado com sucesso. Obrigado por contribuir com a evolução da plataforma.');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || 'Não foi possível enviar seu feedback.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <Loading isLoading={isLoading} label="Enviando seu feedback..." />

      <div className="help-feedback-hero rounded-[28px] border border-amber-200 bg-[linear-gradient(135deg,rgba(254,243,199,0.8),rgba(255,255,255,0.95))] p-8 shadow-sm">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">Ajuda e feedback</p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900 xl:text-4xl">Seu olhar ajuda a melhorar a plataforma.</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Sugestões de novas funcionalidades, dúvidas sobre uso, melhorias de usabilidade e ajustes de fluxo são super bem-vindos.
            Este espaço existe para aproximar sua operação da evolução do produto.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { title: 'Peça novas features', text: 'Conte o que falta hoje para sua rotina ficar mais ágil.' },
            { title: 'Tire dúvidas', text: 'Se algo não estiver claro, envie sua pergunta direto por aqui.' },
            { title: 'Melhore a experiência', text: 'Se algum passo parecer lento ou confuso, queremos saber.' },
          ].map((item) => (
            <div key={item.title} className="help-feedback-hero-card rounded-3xl border border-white/70 bg-white/80 p-5">
              <p className="text-base font-semibold text-slate-900">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {error ? <div className="mt-6"><Alert type="error" message={error} onClose={() => setError(null)} /></div> : null}
      {success ? <div className="mt-6"><Alert type="success" message={success} onClose={() => setSuccess(null)} /></div> : null}

      <div className="mt-8 grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Enviar feedback</h2>
          <p className="mt-2 text-sm text-slate-500">Descreva o contexto com clareza para acelerar nossa análise.</p>

          <div className="mt-6 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Tipo de feedback</span>
              <select
                value={form.category}
                onChange={(event) => setForm((currentForm) => ({ ...currentForm, category: event.target.value }))}
                className="form-control"
                required
              >
                {feedbackCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Assunto</span>
              <input
                value={form.subject}
                onChange={(event) => setForm((currentForm) => ({ ...currentForm, subject: event.target.value }))}
                className="form-control"
                placeholder="Ex: Melhorar o fluxo de orçamento recorrente"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Mensagem</span>
              <textarea
                value={form.message}
                onChange={(event) => setForm((currentForm) => ({ ...currentForm, message: event.target.value }))}
                className="form-control min-h-40 resize-y"
                placeholder="Explique a sugestão, dúvida ou melhoria desejada. Se possível, diga também onde isso impacta sua operação."
                required
              />
            </label>
          </div>

          <button type="submit" className="mt-6 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
            Enviar feedback
          </button>
        </form>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Últimos feedbacks enviados</h2>
          <p className="mt-2 text-sm text-slate-500">Histórico recente da sua empresa para acompanhar temas já levantados.</p>

          <div className="mt-6 space-y-4">
            {feedbacks.length ? (
              feedbacks.map((feedback) => (
                <article key={feedback.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">
                      {feedback.category}
                    </span>
                    <span className="text-xs uppercase tracking-[0.16em] text-slate-400">
                      {new Date(feedback.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{feedback.subject}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{feedback.message}</p>
                </article>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                Nenhum feedback enviado ainda. Quando quiser, este canal está aberto para sugestões, dúvidas e melhorias.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}