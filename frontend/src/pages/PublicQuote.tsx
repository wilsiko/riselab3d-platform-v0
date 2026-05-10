import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api';
import { Alert } from '../components/Alert';
import { Loading } from '../components/Loading';
import { Quote } from '../types';
import { SaleChannel, getSaleChannel } from '../constants/pricing';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatQuoteDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

function getSaleChannelFromQuote(value?: string): SaleChannel {
  if (value === 'ecommerce' || value === 'end_customer' || value === 'direct') {
    return value;
  }

  return 'direct';
}

function getQuotePrimarySummary(quote: Quote) {
  const primaryItem = quote.items[0];
  const productName = primaryItem?.snapshot_nome || primaryItem?.product?.nome || 'Item sem titulo';
  const totalQuantity = quote.items.reduce((sum, item) => sum + item.quantidade, 0);

  return {
    productName,
    totalQuantity,
  };
}

export default function PublicQuote() {
  const { token = '' } = useParams();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Link publico da cotacao invalido.');
      return;
    }

    let isActive = true;

    const loadQuote = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await api.get<Quote>(`/quotes/public/${token}`);

        if (!isActive) {
          return;
        }

        setQuote(response.data);
      } catch (requestError: any) {
        if (!isActive) {
          return;
        }

        setError(requestError?.response?.data?.error || 'Nao foi possivel carregar a cotacao publica.');
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadQuote();

    return () => {
      isActive = false;
    };
  }, [token]);

  const summary = useMemo(() => (quote ? getQuotePrimarySummary(quote) : null), [quote]);
  const saleChannel = quote ? getSaleChannel(getSaleChannelFromQuote(quote.sale_channel)) : null;

  return (
    <div className="space-y-8">
      <Loading isLoading={isLoading} label="Abrindo cotacao publica..." />
      {error ? <Alert type="error" message={error} onClose={() => setError(null)} /> : null}

      {quote ? (
        <section className="public-quote-card mx-auto max-w-[880px] rounded-[34px] border p-6 shadow-[0_28px_90px_rgba(34,211,238,0.12)] sm:p-8">
          <p className="public-quote-eyebrow text-[11px] font-semibold uppercase tracking-[0.28em]">Cotacao publica</p>
          <h1 className="public-quote-title mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{summary?.productName || 'Cotacao compartilhada'}</h1>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <div>
              <p className="public-quote-label text-sm">Cliente</p>
              <p className="public-quote-value mt-2 text-2xl font-medium">{quote.nome_cliente || 'Cliente nao informado'}</p>
            </div>
            <div>
              <p className="public-quote-label text-sm">Data</p>
              <p className="public-quote-value mt-2 text-2xl font-medium">{formatQuoteDate(quote.data)}</p>
            </div>
            <div>
              <p className="public-quote-label text-sm">Canal</p>
              <p className="public-quote-value mt-2 text-2xl font-medium">{saleChannel?.label || 'Venda direta'}</p>
            </div>
            <div>
              <p className="public-quote-label text-sm">Quantidade</p>
              <p className="public-quote-value mt-2 text-2xl font-medium">{summary?.totalQuantity || 0} un</p>
            </div>
          </div>

          <div className="public-quote-total mt-8 rounded-[28px] border p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="public-quote-label text-sm">Valor total</p>
                <p className="public-quote-price mt-2 text-4xl font-semibold tracking-[-0.04em]">{formatCurrency(quote.valor_total)}</p>
              </div>
              <div className="public-quote-badge rounded-2xl border px-4 py-3 text-right">
                <p className="public-quote-label text-[11px] font-semibold uppercase tracking-[0.18em]">Resumo RiseLab3D</p>
                <p className="public-quote-badge-copy mt-1 text-sm">Leitura comercial rapida</p>
              </div>
            </div>
          </div>

          <p className="public-quote-copy mt-8 text-base leading-8">Esta e uma visualizacao publica da cotacao compartilhada. Para editar parametros, recalcular ou salvar uma nova versao, acesse sua conta na plataforma.</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/login" className="inline-flex rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
              Entrar para editar
            </Link>
            <Link to="/quotes" className="public-quote-secondary-action inline-flex rounded-2xl border px-5 py-3 text-sm font-semibold transition">
              Abrir simulador
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}