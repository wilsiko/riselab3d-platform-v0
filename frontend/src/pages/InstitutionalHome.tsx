import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import heroScene from '../assets/institutional-hero-scene.svg';
import materialsScene from '../assets/institutional-materials-scene.svg';
import showroomScene from '../assets/institutional-showroom-scene.svg';
import api from '../api';
import { Alert } from '../components/Alert';

const highlights = [
  {
    title: 'Filamentos',
    copy: 'PLA, PETG e materiais de giro rapido com estoque local para reduzir espera e manter a operacao rodando.',
    cta: 'Ver linha de materiais',
    href: '#contato',
  },
  {
    title: 'Impressoras 3D',
    copy: 'Curadoria tecnica para quem precisa comprar melhor, instalar com criterio e operar sem improviso.',
    cta: 'Solicitar atendimento',
    href: '#contato',
  },
  {
    title: 'Acessorios',
    copy: 'Itens essenciais para manter produtividade, acabamento e reposicao sem depender de prazos longos.',
    cta: 'Consultar disponibilidade',
    href: '#contato',
  },
  {
    title: 'Projetos personalizados',
    copy: 'Pecas funcionais, prototipos e pequenas series com leitura tecnica, viabilidade e resposta comercial objetiva.',
    cta: 'Enviar projeto',
    href: '#contato',
  },
  {
    title: 'Plataforma de calculo',
    copy: 'Precificacao, controle operacional e leitura de custo tecnico em uma plataforma propria e gratuita para impressao 3D.',
    cta: 'Acessar plataforma gratuita',
    href: '/quotes',
    externalRoute: true,
    featured: true,
  },
];

const differentiators = [
  'Estoque local em Santos/SP',
  'Pronta entrega para itens de maior giro',
  'Suporte tecnico com leitura pratica de impressao 3D',
  'Atendimento proximo para compra e pos-venda',
  'Plataforma propria para calculo e precificacao',
  'Impressao profissional para demandas funcionais',
];

const localSearchBlocks = [
  {
    title: 'Filamentos em Santos',
    copy: 'Linha de filamentos para quem busca PLA, PETG e reposicao rapida em Santos e Baixada Santista, com orientacao tecnica para compatibilidade, acabamento e uso real.',
  },
  {
    title: 'Impressoras 3D em Santos',
    copy: 'Curadoria de impressoras 3D para compra local com suporte tecnico, leitura de aplicacao e atendimento para Santos, Sao Vicente, Praia Grande e Guaruja.',
  },
  {
    title: 'Loja de impressao 3D na Baixada Santista',
    copy: 'Operacao focada em disponibilidade local, acessorios, produtos impressos e apoio comercial para clientes que precisam decidir sem depender apenas de marketplaces.',
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
        <div className="marketing-grid">
          <div className="marketing-hero-copy">
            <p className="marketing-eyebrow">Santos/SP • Estoque local • Suporte tecnico • Showroom em breve</p>
            <div className="marketing-hero-inline-visual marketing-visual-card" aria-hidden="true">
              <img src={heroScene} alt="" className="marketing-visual-image" />
            </div>
            <h1 className="marketing-display">Impressao 3D sem complicacao.</h1>
            <p className="marketing-lead">
              Filamentos, impressoras 3D, acessorios e producao sob demanda com leitura tecnica, agilidade comercial e operacao local.
            </p>
            <p className="marketing-local-seo-copy">
              Base em Santos com atendimento para Sao Vicente, Praia Grande, Guaruja e outras cidades litoraneas da Baixada Santista.
            </p>
            <div className="marketing-actions">
              <a href="#destaques" className="marketing-button marketing-button-primary">Conhecer produtos</a>
              <Link to="/quotes" className="marketing-button marketing-button-secondary">Acessar plataforma gratuita</Link>
            </div>
            <div className="marketing-proof-row" aria-label="Diferenciais principais">
              <span>Pronta entrega</span>
              <span>Revendedor oficial Bambu Lab</span>
              <span>Atendimento tecnico real</span>
              <span>Plataforma gratuita</span>
              <span>Operacao local em Santos</span>
            </div>
          </div>

          <div className="marketing-hero-stage" aria-hidden="true">
            <div className="marketing-visual-card marketing-visual-card-hero marketing-hero-desktop-visual">
              <img src={heroScene} alt="Ilustracao de impressora 3D, painel operacional e materiais da RiseLab3D" className="marketing-visual-image" />
            </div>
            <div className="marketing-stage-panel marketing-stage-panel-primary">
              <p className="marketing-stage-label">Operacao local</p>
              <p className="marketing-stage-title">Loja tecnica para quem compra com criterio.</p>
              <p className="marketing-stage-copy">Produtos de giro rapido, suporte proximo e base preparada para showroom interativo.</p>
              <div className="marketing-brand-badge">
                <span className="marketing-brand-badge-label">Revendedor oficial</span>
                <strong className="marketing-brand-badge-name">Bambu Lab</strong>
              </div>
            </div>
            <div className="marketing-stage-grid">
              <div className="marketing-stage-panel">
                <p className="marketing-stage-metric">24h</p>
                <p className="marketing-stage-caption">Resposta comercial em ritmo de operacao</p>
              </div>
              <div className="marketing-stage-panel">
                <p className="marketing-stage-metric">Santos</p>
                <p className="marketing-stage-caption">Base local para atendimento e retirada</p>
              </div>
              <div className="marketing-stage-panel marketing-stage-outline">
                <p className="marketing-stage-label">Plataforma propria</p>
                <p className="marketing-stage-caption">Custo, precificacao e leitura operacional em um fluxo unico.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="marketing-section" id="sobre">
        <div className="marketing-section-head">
          <p className="marketing-eyebrow">Sobre a RiseLab3D</p>
          <h2>Operacao tecnica, atendimento proximo e estoque real.</h2>
        </div>
        <div className="marketing-about-grid">
          <div className="marketing-about-copy">
            <p>
              A RiseLab3D atende Santos e regiao com foco em impressao 3D funcional. O trabalho combina venda de equipamentos,
              materiais e acessorios com suporte tecnico baseado em uso real, nao em discurso generico.
            </p>
            <p>
              A operacao foi desenhada para reduzir friccao: orientar a compra certa, manter itens essenciais em estoque local,
              acelerar reposicao e apoiar empresas e clientes que precisam produzir com previsibilidade.
            </p>
            <p>
              A atuacao cobre Santos, Sao Vicente, Praia Grande, Guaruja e outras cidades litoraneas da Baixada Santista,
              com foco em disponibilidade local, resposta rapida e suporte tecnico proximo.
            </p>
          </div>
          <div className="marketing-about-aside">
            <div className="marketing-visual-card marketing-visual-card-light">
              <img src={materialsScene} alt="Ilustracao de filamentos e materiais organizados para estoque local" className="marketing-visual-image" />
            </div>
            <div className="marketing-about-facts">
              <div className="marketing-about-fact">
                <span className="marketing-mini-label">Base</span>
                <strong>Santos/SP</strong>
              </div>
              <div className="marketing-about-fact">
                <span className="marketing-mini-label">Foco</span>
                <strong>Impressao 3D funcional e comercial</strong>
              </div>
              <div className="marketing-about-fact">
                <span className="marketing-mini-label">Parceria</span>
                <strong>Revenda oficial Bambu Lab</strong>
              </div>
              <div className="marketing-about-fact">
                <span className="marketing-mini-label">Expansao</span>
                <strong>Loja fisica e showroom interativo em breve</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="marketing-section" id="destaques">
        <div className="marketing-section-head marketing-section-head-inline">
          <div>
            <p className="marketing-eyebrow">Destaques</p>
            <h2>Linhas principais para compra, producao e suporte.</h2>
          </div>
          <p className="marketing-section-note">Cada frente foi pensada para atender operacao, reposicao e decisao tecnica com menos ruído.</p>
        </div>
        <div className="marketing-card-grid">
          {highlights.map((item, index) => {
            const Icon = sectionIcons[index];

            return (
              <article key={item.title} className={`marketing-card${item.featured ? ' marketing-card-featured' : ''}`}>
                <div className="marketing-card-icon">
                  <Icon />
                </div>
                {item.featured ? <span className="marketing-card-badge">Gratuita</span> : null}
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
                {item.externalRoute ? (
                  <Link to={item.href} className="marketing-card-link">
                    {item.cta}
                    <ArrowIcon />
                  </Link>
                ) : (
                  <a href={item.href} className="marketing-card-link">
                    {item.cta}
                    <ArrowIcon />
                  </a>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="marketing-section marketing-showroom" id="showroom">
        <div className="marketing-showroom-copy">
          <p className="marketing-eyebrow">Loja fisica e showroom</p>
          <h2>Uma base presencial para demonstracao, retirada e decisao com mais seguranca.</h2>
          <p>
            A proxima etapa da RiseLab3D inclui loja fisica e showroom interativo em Santos. A proposta e simples: aproximar teste,
            demonstracao, consultoria e disponibilidade real em um ambiente tecnico e direto.
          </p>
          <div className="marketing-showroom-list">
            <div className="marketing-showroom-list-item">
              <span className="marketing-showroom-list-title">Demonstracao real</span>
              <p>Comparacao de maquinas, materiais e aplicacoes em um ambiente preparado para decisao tecnica.</p>
            </div>
            <div className="marketing-showroom-list-item">
              <span className="marketing-showroom-list-title">Retirada e atendimento</span>
              <p>Base local para acelerar compra, retirada de itens e orientacao presencial quando fizer sentido.</p>
            </div>
            <div className="marketing-showroom-list-item">
              <span className="marketing-showroom-list-title">Experiencia pratica</span>
              <p>Contato direto com impressoras, acessorios e operacao real, sem depender apenas de foto ou ficha tecnica.</p>
            </div>
          </div>
        </div>
        <div className="marketing-showroom-stage" aria-hidden="true">
          <div className="marketing-showroom-visual marketing-showroom-visual-large">
            <img src={showroomScene} alt="Ilustracao de showroom tecnico com impressoras 3D e area de demonstracao" className="marketing-showroom-image" />
            <div className="marketing-showroom-overlay">
              <span className="marketing-mini-label">Base RiseLab3D</span>
              <strong>Showroom interativo com retirada, demonstracao e conversa tecnica no mesmo fluxo.</strong>
            </div>
          </div>
          <div className="marketing-showroom-grid">
            <div className="marketing-showroom-card">
              <span className="marketing-mini-label">Retirada local</span>
              <strong>Santos/SP com mais previsibilidade para compra e reposicao.</strong>
            </div>
            <div className="marketing-showroom-card">
              <span className="marketing-mini-label">Consultoria</span>
              <strong>Orientacao presencial para escolher maquina, material e aplicacao certa.</strong>
            </div>
          </div>
          <div className="marketing-showroom-note">
            <span className="marketing-mini-label">Em breve</span>
            <strong>Demonstracoes, comparacao de maquinas e experiencia pratica no mesmo espaco.</strong>
          </div>
        </div>
      </section>

      <section className="marketing-section" id="diferenciais">
        <div className="marketing-section-head">
          <p className="marketing-eyebrow">Diferenciais</p>
          <h2>Menos ruído. Mais previsibilidade comercial e tecnica.</h2>
        </div>
        <div className="marketing-differentials-grid">
          {differentiators.map((item) => (
            <div key={item} className="marketing-differential-item">
              <span className="marketing-differential-index">+</span>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="marketing-section" id="busca-local">
        <div className="marketing-section-head marketing-section-head-inline">
          <div>
            <p className="marketing-eyebrow">Busca local</p>
            <h2>Blocos orientados para quem procura impressao 3D em Santos.</h2>
          </div>
          <p className="marketing-section-note">Conteudo direto para consultas transacionais, sem enrolacao editorial e sem parecer texto enxertado.</p>
        </div>
        <div className="marketing-local-search-grid">
          {localSearchBlocks.map((item) => (
            <article key={item.title} className="marketing-local-search-card">
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-section marketing-platform" id="plataforma">
        <div className="marketing-platform-copy">
          <p className="marketing-eyebrow">Plataforma completa para calculo dos custos de impressao</p>
          <h2>Uma camada operacional propria para precificar melhor e manter controle real da producao.</h2>
          <p>
            A plataforma da RiseLab3D continua ativa como produto secundario do site institucional. Ela organiza custo tecnico,
            leitura de energia, amortizacao, precificacao por canal e historico operacional em um fluxo unico. O acesso e gratuito.
          </p>
          <p className="marketing-platform-emphasis">Uso gratuito para simular, calcular e estruturar a precificacao da operacao 3D.</p>
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
            <p className="marketing-eyebrow">Contato</p>
            <h2>Fale com a RiseLab3D pelo site.</h2>
          </div>
          <p className="marketing-section-note">Envie sua necessidade comercial ou tecnica. O formulario encaminha a mensagem para contato@riselab3d.com.br.</p>
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
          <p className="marketing-footer-copy">Impressoras 3D, filamentos, acessorios, produtos impressos e operacao tecnica com base em Santos/SP.</p>
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