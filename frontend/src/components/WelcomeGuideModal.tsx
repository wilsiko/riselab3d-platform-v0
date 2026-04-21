import { useState } from 'react';

interface WelcomeGuideModalProps {
  userName: string;
  onClose: (dontShowAgain: boolean) => void;
}

const quickSteps = [
  {
    title: '1. Cadastre suas impressoras',
    description:
      'Comece em Impressoras para registrar os equipamentos da operação, consumo, vida útil e custo de aquisição.',
  },
  {
    title: '2. Cadastre seus filamentos',
    description:
      'Em Filamentos, informe marca, tipo, lote e custo por quilo para o sistema calcular a base real da produção.',
  },
  {
    title: '3. Monte seus produtos',
    description:
      'Na tela Produtos, combine peso, tempo de impressão, filamento e demais custos para gerar o SKU e custos associados.',
  },
  {
    title: '4. Gere seus orçamentos',
    description:
      'Com os cadastros prontos, vá em Orçamentos para selecionar produtos, definir o tipo de venda e gerar o orçamento que pode ser exportado em PDF final.',
  },
];

export default function WelcomeGuideModal({ userName, onClose }: WelcomeGuideModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-[32px] border border-white/10 bg-white shadow-2xl">
        <div className="border-b border-slate-200 bg-gradient-to-r from-cyan-600 via-slate-900 to-amber-500 px-8 py-7 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">Boas-vindas</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">Seu painel está pronto, {userName.split(' ')[0] || 'usuario'}.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-100/90">
            Para ganhar velocidade desde o primeiro uso, siga esta sequência simples. Ela cobre o fluxo essencial da plataforma do cadastro técnico até a geração do orçamento.
          </p>
        </div>

        <div className="grid gap-4 px-8 py-8 md:grid-cols-2">
          {quickSteps.map((step) => (
            <div key={step.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-base font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200 px-8 py-6">
          <div className="rounded-3xl bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
            Dica: se quiser um fluxo ideal, cadastre primeiro impressoras e filamentos, depois produtos, e só então comece a montar os orçamentos.
          </div>

          <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <label className="flex items-center gap-3 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(event) => setDontShowAgain(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              Nao exibir novamente para este usuario neste navegador
            </label>

            <button
              type="button"
              onClick={() => onClose(dontShowAgain)}
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Entendi, vamos comecar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}