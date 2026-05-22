import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import heroScene from '../assets/institutional-hero-scene.svg';
import materialsScene from '../assets/institutional-materials-scene.svg';
import showroomScene from '../assets/institutional-showroom-scene.svg';
import api from '../api';
import { Alert } from '../components/Alert';

const differentiators = [
  'Pronta entrega',
  'Estoque local',
  'Santos/SP',
  'Suporte tecnico',
  'Loja fisica em breve',
  'Plataforma propria',
];

const highlights = [
  {
    title: 'Filamentos',
    copy: 'PLA, PETG e materiais de giro rapido para reposicao, estoque local e compra recorrente.',
    cta: 'Ver linha de materiais',
    href: '#contato',
  },
  {
    title: 'Impressoras 3D',
    copy: 'Impressoras 3D com orientacao tecnica para compra, aplicacao e operacao com mais criterio.',
    cta: 'Solicitar atendimento',
    href: '#contato',
  },
  {
    title: 'Acessorios',
    copy: 'Bicos, superficies, manutencao e itens de apoio para manter sua operacao rodando.',
    cta: 'Consultar disponibilidade',
    href: '#contato',
  },
  {
    title: 'Projetos sob demanda',
    copy: 'Pecas funcionais, prototipos e pequenas series com resposta comercial objetiva e leitura tecnica.',
    cta: 'Enviar projeto',
    href: '#contato',
  },
];

const seoKeywords = [
  'impressao 3D Santos',
  'filamentos em Santos',
  'impressoras 3D Santos',
  'loja de impressao 3D',
  'filamento PLA PETG',
  'impressao 3D profissional',
  'Baixada Santista impressao 3D',
  'Sao Vicente impressao 3D',
  'Praia Grande impressao 3D',
  'Guaruja impressao 3D',
  'cidades litoraneas impressao 3D',
].join(', ');

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 4.5 7 12 11l7.5-4L12 3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 7v10L12 21l7.5-4V7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 11v10" />
    </svg>
  );
}

function PrinterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 8V4h10v4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18H5a2 2 0 0 1-2-2v-5a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v5a2 2 0 0 1-2 2h-1" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 14h10v6H7z" />
      <circle cx="17" cy="11" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ToolIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 0 0 5.4-5.4l-2.3 2.3-2.7-2.6 2.3-2.4Z" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m12 4 8 4-8 4-8-4 8-4Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m4 12 8 4 8-4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m4 16 8 4 8-4" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19h16" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 15V9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15V5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 15v-3" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

const sectionIcons = [BoxIcon, PrinterIcon, ToolIcon, LayersIcon, ChartIcon];

export default function InstitutionalHome() {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [contactError, setContactError] = useState('');
  const [contactSuccess, setContactSuccess] = useState('');
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);

  useEffect(() => {
    document.title = 'RiseLab3D | Impressao 3D, filamentos e impressoras 3D em Santos e Baixada Santista';

    const description = 'RiseLab3D em Santos/SP. Filamentos, impressoras 3D, acessorios, produtos impressos e plataforma gratuita de calculo para Santos, Sao Vicente, Praia Grande, Guaruja e cidades litoraneas da Baixada Santista.';
    const descriptionTag = document.querySelector('meta[name="description"]');
    const keywordsTag = document.querySelector('meta[name="keywords"]');

    if (descriptionTag) {
      descriptionTag.setAttribute('content', description);
    }

    if (keywordsTag) {
      keywordsTag.setAttribute('content', seoKeywords);
    }
  }, []);

  async function handleContactSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setContactError('');
    setContactSuccess('');
    setIsSubmittingContact(true);

    try {
      const response = await api.post('/contact', contactForm);
      setContactSuccess(response.data?.message || 'Mensagem enviada com sucesso.');
      setContactForm({
        name: '',
        email: '',
        phone: '',
        message: '',
      });
    } catch (error: any) {
      setContactError(error?.response?.data?.error || 'Nao foi possivel enviar a mensagem agora. Tente novamente em instantes.');
    } finally {
      setIsSubmittingContact(false);
    }
  }

  return (
    <div className="marketing-shell">
      <section className="marketing-hero" id="topo">
        <div className="marketing-hero-grid">
          <div className="marketing-hero-copy">
            <p className="marketing-eyebrow">Santos/SP • Estoque local • Operacao real</p>
            <h1 className="marketing-display">Impressao 3D profissional a pronta entrega.</h1>
            <p className="marketing-lead">
              Filamentos, impressoras, acessorios e suporte tecnico especializado. Loja fisica e showroom interativo em construcao.
            </p>
            <p className="marketing-local-seo-copy">
              Operacao local em Santos para atender compra, reposicao e suporte tecnico em toda a Baixada Santista.
            </p>
            <div className="marketing-actions">
              <a href="#destaques" className="marketing-button marketing-button-primary">Ver produtos</a>
              <Link to="/quotes" className="marketing-button marketing-button-secondary">Plataforma de calculo</Link>
            </div>
            <div className="marketing-proof-row" aria-label="Diferenciais principais">
              <span>Estoque local</span>
              <span>Pronta entrega</span>
              <span>Suporte tecnico</span>
              <span>Santos/SP</span>
              <span>Showroom em construcao</span>
            </div>
          </div>

          <div className="marketing-hero-stage">
            <div className="marketing-hero-visual" aria-hidden="true">
              <img src={heroScene} alt="Ilustracao de impressora 3D, painel operacional e materiais da RiseLab3D" className="marketing-visual-image" />
            </div>
            <div className="marketing-hero-panels">
              <div className="marketing-stage-panel marketing-stage-panel-primary">
                <p className="marketing-stage-label">Operacao</p>
                <p className="marketing-stage-title">Compra tecnica com estoque, suporte e atendimento local.</p>
                <p className="marketing-stage-copy">Suprimentos, impressoras 3D e acessorios para quem precisa operar com previsibilidade.</p>
              </div>
              <div className="marketing-stage-panel">
                <p className="marketing-stage-label">Base local</p>
                <p className="marketing-stage-caption">Santos/SP com atendimento para compra, retirada e suporte tecnico.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="marketing-section" id="diferenciais">
        <div className="marketing-section-head">
          <p className="marketing-eyebrow">Diferenciais</p>
          <h2>Clareza comercial para uma operacao tecnica real.</h2>
        </div>
        <div className="marketing-differentials-grid">
          {differentiators.map((item) => (
            <article key={item} className="marketing-differential-item">
              <span className="marketing-differential-index">+</span>
              <p>{item}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-section" id="destaques">
        <div className="marketing-section-head marketing-section-head-inline">
          <div>
            <p className="marketing-eyebrow">Produtos principais</p>
            <h2>Venda tecnica para suprimentos, impressoras e operacao 3D.</h2>
          </div>
          <p className="marketing-section-note">Loja especializada para compra, reposicao e suporte em impressao 3D.</p>
        </div>
        <div className="marketing-products-grid">
          <div className="marketing-products-copy">
            <p>
              A RiseLab3D opera em Santos com foco em impressoras 3D, filamentos, acessorios e apoio tecnico para quem precisa comprar com criterio e manter a operacao rodando.
            </p>
            <div className="marketing-products-visual" aria-hidden="true">
              <img src={materialsScene} alt="Ilustracao de filamentos e materiais organizados para estoque local" className="marketing-visual-image" />
            </div>
          </div>
          <div className="marketing-card-grid">
            {highlights.map((item, index) => {
              const Icon = sectionIcons[index];

              return (
                <article key={item.title} className="marketing-card">
                  <div className="marketing-card-icon">
                    <Icon />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                  <a href={item.href} className="marketing-card-link">
                    {item.cta}
                    <ArrowIcon />
                  </a>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="marketing-section marketing-showroom" id="showroom">
        <div className="marketing-showroom-copy">
          <p className="marketing-eyebrow">Showroom interativo</p>
          <h2>Showroom interativo em construcao.</h2>
          <p>
            Estamos construindo um espaco fisico para demonstracoes, testes de materiais e experiencia pratica com impressao 3D.
          </p>
          <div className="marketing-showroom-list marketing-showroom-list-compact">
            <div className="marketing-showroom-list-item">
              <span className="marketing-showroom-list-title">Demonstracoes reais</span>
            </div>
            <div className="marketing-showroom-list-item">
              <span className="marketing-showroom-list-title">Testes de materiais</span>
            </div>
            <div className="marketing-showroom-list-item">
              <span className="marketing-showroom-list-title">Experiencia pratica</span>
            </div>
          </div>
        </div>
        <div className="marketing-showroom-stage" aria-hidden="true">
          <div className="marketing-showroom-visual marketing-showroom-visual-large">
            <img src={showroomScene} alt="Ilustracao de showroom tecnico com impressoras 3D e area de demonstracao" className="marketing-showroom-image" />
            <div className="marketing-showroom-overlay">
              <span className="marketing-mini-label">Base RiseLab3D</span>
              <strong>Espaco em desenvolvimento para demonstracao de impressoras, testes de materiais e atendimento proximo.</strong>
            </div>
          </div>
          <div className="marketing-showroom-note">
            <span className="marketing-mini-label">Expansao da marca</span>
            <strong>Loja fisica e showroom em desenvolvimento para fortalecer a operacao local.</strong>
          </div>
        </div>
      </section>

      <section className="marketing-section marketing-platform" id="plataforma">
        <div className="marketing-platform-copy">
          <p className="marketing-eyebrow">Plataforma completa para calculo dos custos de impressao</p>
          <h2>Ferramenta profissional da operacao RiseLab3D.</h2>
          <p>
            A plataforma da RiseLab3D permanece ativa como ferramenta secundaria da empresa. Ela organiza custo tecnico, amortizacao, energia, precificacao e historico operacional em um fluxo unico.
          </p>
          <p className="marketing-platform-emphasis">Uso gratuito para calcular custos e estruturar a precificacao da producao 3D.</p>
          <ul className="marketing-feature-list">
            <li>Calculo de custo por material, energia e amortizacao</li>
            <li>Controle operacional de cotacoes e historico</li>
            <li>Precificacao com margem por canal comercial</li>
            <li>Gestao de impressao com leitura tecnica clara</li>
          </ul>
          <div className="marketing-actions">
            <Link to="/quotes" className="marketing-button marketing-button-primary">Entrar na plataforma gratuita</Link>
            <a href="https://instagram.com/riselab3d" target="_blank" rel="noreferrer" className="marketing-button marketing-button-secondary">Falar com a RiseLab3D</a>
          </div>
        </div>
        <div className="marketing-platform-panel" aria-hidden="true">
          <div className="marketing-platform-row">
            <span>Custo tecnico</span>
            <strong>Material + energia + amortizacao</strong>
          </div>
          <div className="marketing-platform-row">
            <span>Precificacao</span>
            <strong>Margem por canal e leitura unitária</strong>
          </div>
          <div className="marketing-platform-row">
            <span>Operacao</span>
            <strong>Historico, compartilhamento e controle</strong>
          </div>
        </div>
      </section>

      <section className="marketing-section" id="contato">
        <div className="marketing-section-head marketing-section-head-inline">
          <div>
            <p className="marketing-eyebrow">Solicite atendimento</p>
            <h2>Envie sua demanda comercial ou tecnica.</h2>
          </div>
          <p className="marketing-section-note">Formulario direto para impressoras, filamentos, acessorios, suporte ou projetos personalizados.</p>
        </div>
        <div className="marketing-contact-grid">
          <form className="marketing-contact-form" onSubmit={handleContactSubmit}>
            <label className="marketing-field">
              <span>Nome</span>
              <input
                type="text"
                value={contactForm.name}
                onChange={(event) => setContactForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Seu nome"
                required
              />
            </label>
            <label className="marketing-field">
              <span>E-mail</span>
              <input
                type="email"
                value={contactForm.email}
                onChange={(event) => setContactForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="voce@empresa.com"
                required
              />
            </label>
            <label className="marketing-field">
              <span>Telefone</span>
              <input
                type="tel"
                value={contactForm.phone}
                onChange={(event) => setContactForm((current) => ({ ...current, phone: event.target.value }))}
                placeholder="(13) 99999-9999"
                required
              />
            </label>
            <label className="marketing-field marketing-field-full">
              <span>Mensagem</span>
              <textarea
                value={contactForm.message}
                onChange={(event) => setContactForm((current) => ({ ...current, message: event.target.value }))}
                placeholder="Descreva o que voce precisa: impressoras, filamentos, acessorios, projeto ou suporte."
                rows={6}
                required
              />
            </label>
            {contactError ? <Alert type="error" message={contactError} onClose={() => setContactError('')} /> : null}
            {contactSuccess ? <Alert type="success" message={contactSuccess} onClose={() => setContactSuccess('')} /> : null}
            <button type="submit" className="marketing-button marketing-button-primary marketing-contact-submit" disabled={isSubmittingContact}>
              {isSubmittingContact ? 'Enviando mensagem...' : 'Enviar contato'}
            </button>
          </form>

          <div className="marketing-contact-aside">
            <div>
              <span className="marketing-mini-label">Destino</span>
              <strong>contato@riselab3d.com.br</strong>
            </div>
            <div>
              <span className="marketing-mini-label">Canal</span>
              <strong>Atendimento comercial e tecnico pelo site institucional</strong>
            </div>
            <div>
              <span className="marketing-mini-label">Cobertura</span>
              <strong>Santos, Sao Vicente, Praia Grande, Guaruja e Baixada Santista</strong>
            </div>
            <div>
              <span className="marketing-mini-label">Instagram</span>
              <strong>
                <a href="https://instagram.com/riselab3d" target="_blank" rel="noreferrer" className="marketing-social-link" aria-label="Instagram oficial da RiseLab3D">
                  <InstagramIcon />
                </a>
              </strong>
            </div>
          </div>
        </div>
      </section>

      <footer className="marketing-footer">
        <div>
          <p className="marketing-eyebrow">RiseLab3D</p>
          <p className="marketing-footer-copy">Operacao tecnica de impressao 3D com base em Santos/SP, estoque local e showroom em desenvolvimento.</p>
        </div>
        <div>
          <span className="marketing-mini-label">Localizacao</span>
          <strong>Santos/SP</strong>
        </div>
        <p className="marketing-copyright">© 2026 RiseLab3D. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}