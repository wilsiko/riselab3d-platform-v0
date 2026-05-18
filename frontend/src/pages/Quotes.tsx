import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import api from '../api';
import { useAuth } from '../auth/AuthContext';
import { Alert } from '../components/Alert';
import { useAuthRedirect } from '../hooks/useAuthRedirect';
import { Loading } from '../components/Loading';
import { NumericInput } from '../components/NumericInput';
import { PricingCard } from '../components/PricingCard';
import { PrinterSelector } from '../components/PrinterSelector';
import { getSaleChannel, getSaleChannels, SaleChannel } from '../constants/pricing';
import { Client, Printer, Quote, Settings } from '../types';
import { parseLocaleNumber } from '../utils/number';

const QUOTE_DRAFT_STORAGE_KEY = 'riselab3d.quote-draft';

interface QuoteDraft {
  productName: string;
  clientName: string;
  date: string;
  notes: string;
  saleChannel: SaleChannel;
  printerId: string;
  materialWeightGrams: string;
  filamentCostPerKg: string;
  printHours: string;
  quantity: string;
  laborCost: string;
  packagingCost: string;
}

type QuoteFieldName = 'productName' | 'materialWeightGrams' | 'filamentCostPerKg' | 'printHours' | 'quantity' | 'printerId';
type QuoteFieldErrors = Partial<Record<QuoteFieldName, string>>;

interface ShareQuoteResponse {
  quoteId: string;
  shareUrl: string;
}

interface ManualQuoteMetadata {
  productName?: string;
  printerId?: string;
  materialWeightGrams?: number;
  filamentCostPerKg?: number;
  printHours?: number;
  quantity?: number;
  errorRatePercent?: number;
  technicalBaseCostPerUnit?: number;
  failureCostPerUnit?: number;
}

interface QuotePrimarySummary {
  productName: string;
  unitCost: number | null;
  errorRatePercent: number | null;
  technicalBaseCostPerUnit: number | null;
  failureCostPerUnit: number | null;
}

function getCurrentQuoteDate() {
  return new Date().toISOString().substring(0, 10);
}

function formatQuoteDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return value;
  }

  return new Intl.DateTimeFormat('pt-BR').format(new Date(year, month - 1, day));
}

function formatQuoteTimestamp(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value));
}

function getDefaultDraft(): QuoteDraft {
  return {
    productName: '',
    clientName: '',
    date: getCurrentQuoteDate(),
    notes: '',
    saleChannel: 'direct',
    printerId: '',
    materialWeightGrams: '',
    filamentCostPerKg: '',
    printHours: '',
    quantity: '1',
    laborCost: '0',
    packagingCost: '0',
  };
}

function loadDraft(): QuoteDraft {
  if (typeof window === 'undefined') {
    return getDefaultDraft();
  }

  const rawDraft = window.localStorage.getItem(QUOTE_DRAFT_STORAGE_KEY);

  if (!rawDraft) {
    return getDefaultDraft();
  }

  try {
    const parsedDraft = JSON.parse(rawDraft) as Partial<QuoteDraft>;
    return {
      ...getDefaultDraft(),
      ...parsedDraft,
    };
  } catch {
    window.localStorage.removeItem(QUOTE_DRAFT_STORAGE_KEY);
    return getDefaultDraft();
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function ChannelIcon({ channelId }: { channelId: string }) {
  if (channelId === 'direct') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16M13 5l7 7-7 7" />
      </svg>
    );
  }

  if (channelId === 'ecommerce') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5" aria-hidden="true">
        <circle cx="9" cy="19" r="1.5" />
        <circle cx="17" cy="19" r="1.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h2l2.4 9.2a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.76L20 8H7" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-6-4.35-6-10a3.75 3.75 0 0 1 6-2.98A3.75 3.75 0 0 1 18 11c0 5.65-6 10-6 10Z" />
    </svg>
  );
}

function renderChannelPriceBadges(unitCost: number | null, saleChannels: ReturnType<typeof getSaleChannels>) {
  if (unitCost === null) {
    return (
      <span className="text-sm text-slate-500">Valores nao informados</span>
    );
  }

  return saleChannels.map((channel) => {
    const salePrice = unitCost * (1 + channel.marginPercent / 100);

    return (
      <span
        key={channel.id}
        title={channel.label}
        aria-label={`${channel.label}: ${formatCurrency(salePrice)}`}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-slate-300"
      >
        <span className="text-cyan-200">
          <ChannelIcon channelId={channel.id} />
        </span>
        <span className="font-medium text-slate-200">{formatCurrency(salePrice)}</span>
      </span>
    );
  });
}

function parseDecimal(value: string) {
  return parseLocaleNumber(value);
}

function parseDurationHours(value: string) {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return 0;
  }

  if (!/^\d+:\d{2}$/.test(normalizedValue)) {
    return 0;
  }

  const [hoursPart, minutesPart] = normalizedValue.split(':').map(Number);

  if (minutesPart >= 60) {
    return 0;
  }

  return hoursPart + minutesPart / 60;
}

function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}

function calculatePrinterEnergyCost(printer: Printer | null, printHours: number, costPerKwh: number) {
  if (!printer || printHours <= 0 || costPerKwh <= 0) {
    return 0;
  }

  return (printer.consumo_watts / 1000) * printHours * costPerKwh;
}

function calculatePrinterHourlyCost(printer: Printer | null) {
  if (!printer || printer.custo_aquisicao <= 0 || printer.vida_util_horas <= 0) {
    return 0;
  }

  return printer.custo_aquisicao / printer.vida_util_horas;
}

function calculatePrinterAmortizationCost(printer: Printer | null, printHours: number) {
  if (!printer || printHours <= 0) {
    return 0;
  }

  return calculatePrinterHourlyCost(printer) * printHours;
}

function formatDurationFromHours(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return '';
  }

  const totalMinutes = Math.round(value * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return [hours, minutes].map((part) => String(part).padStart(2, '0')).join(':');
}

function getDraftSignature(draft: QuoteDraft) {
  return JSON.stringify({
    productName: draft.productName.trim(),
    clientName: draft.clientName.trim(),
    date: draft.date,
    saleChannel: draft.saleChannel,
    printerId: draft.printerId,
    materialWeightGrams: draft.materialWeightGrams.trim(),
    filamentCostPerKg: draft.filamentCostPerKg.trim(),
    printHours: draft.printHours.trim(),
    quantity: draft.quantity.trim(),
    laborCost: draft.laborCost.trim(),
    packagingCost: draft.packagingCost.trim(),
    notes: draft.notes.trim(),
  });
}

function extractManualQuoteMetadata(notes?: string | null): ManualQuoteMetadata | null {
  if (!notes) {
    return null;
  }

  const metadataLine = notes
    .split('\n')
    .find((line) => line.startsWith('__RL3D_MANUAL__'));

  if (!metadataLine) {
    return null;
  }

  try {
    return JSON.parse(metadataLine.replace('__RL3D_MANUAL__', '')) as ManualQuoteMetadata;
  } catch {
    return null;
  }
}

function getSaleChannelFromQuote(value?: string): SaleChannel {
  if (value === 'ecommerce' || value === 'end_customer' || value === 'direct') {
    return value;
  }

  return 'direct';
}

function buildDraftFromQuote(quote: Quote): QuoteDraft | null {
  const metadata = extractManualQuoteMetadata(quote.notes);
  const primaryItem = quote.items[0];

  if (!primaryItem) {
    return null;
  }

  return {
    productName: metadata?.productName || primaryItem.snapshot_nome || primaryItem.product?.nome || '',
    clientName: quote.nome_cliente === 'Cliente nao informado' ? '' : quote.nome_cliente,
    date: typeof quote.data === 'string' ? quote.data.substring(0, 10) : getCurrentQuoteDate(),
    notes: '',
    saleChannel: getSaleChannelFromQuote(quote.sale_channel),
    printerId: metadata?.printerId || '',
    materialWeightGrams: metadata?.materialWeightGrams ? String(metadata.materialWeightGrams) : '',
    filamentCostPerKg: metadata?.filamentCostPerKg ? String(metadata.filamentCostPerKg) : '',
    printHours: metadata?.printHours ? formatDurationFromHours(metadata.printHours) : '',
    quantity: metadata?.quantity ? String(metadata.quantity) : String(primaryItem.quantidade || 1),
    laborCost: '0',
    packagingCost: '0',
  };
}

function getQuotePrimarySummary(quote: Quote): QuotePrimarySummary {
  const primaryItem = quote.items[0];
  const metadata = extractManualQuoteMetadata(quote.notes);
  const productName = primaryItem?.snapshot_nome || primaryItem?.product?.nome || 'Item sem titulo';
  const totalQuantity = quote.items.reduce((sum, item) => sum + item.quantidade, 0);
  const unitCost = primaryItem?.custo_base_unitario
    ?? (typeof primaryItem?.subtotal_custo === 'number' && primaryItem.quantidade > 0 ? primaryItem.subtotal_custo / primaryItem.quantidade : null)
    ?? (typeof quote.subtotal_custo === 'number' && totalQuantity > 0 ? quote.subtotal_custo / totalQuantity : null);
  const product = primaryItem?.product;
  const derivedTechnicalBaseCostPerUnit = product
    ? product.custo_material + product.custo_energia + product.custo_amortizacao
    : null;
  const derivedFailureCostPerUnit = product && derivedTechnicalBaseCostPerUnit !== null
    ? Math.max(product.custo_total - derivedTechnicalBaseCostPerUnit, 0)
    : null;
  const derivedErrorRatePercent = derivedTechnicalBaseCostPerUnit && derivedTechnicalBaseCostPerUnit > 0 && derivedFailureCostPerUnit !== null
    ? (derivedFailureCostPerUnit / derivedTechnicalBaseCostPerUnit) * 100
    : null;

  return {
    productName,
    unitCost,
    errorRatePercent: metadata?.errorRatePercent ?? derivedErrorRatePercent ?? null,
    technicalBaseCostPerUnit: metadata?.technicalBaseCostPerUnit ?? derivedTechnicalBaseCostPerUnit ?? null,
    failureCostPerUnit: metadata?.failureCostPerUnit ?? derivedFailureCostPerUnit ?? null,
  };
}

function QuoteErrorRateSummary({ summary }: { summary: QuotePrimarySummary }) {
  if (
    summary.errorRatePercent === null
    || summary.technicalBaseCostPerUnit === null
    || summary.failureCostPerUnit === null
  ) {
    return null;
  }

  return (
    <div className="rounded-[22px] border border-amber-300/15 bg-amber-300/[0.06] p-3">
      <div className="grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200/70">Taxa de erro</p>
          <p className="mt-2 font-semibold text-white">{summary.errorRatePercent.toFixed(2)}%</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200/70">Impacto por unidade</p>
          <p className="mt-2 font-semibold text-white">{formatCurrency(roundCurrency(summary.failureCostPerUnit))}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200/70">Base tecnica antes da taxa</p>
          <p className="mt-2 font-semibold text-white">{formatCurrency(roundCurrency(summary.technicalBaseCostPerUnit))}</p>
        </div>
      </div>
    </div>
  );
}

const sectionTitleClassName = 'text-[28px] font-semibold tracking-[-0.04em] text-white';
const sectionDescriptionClassName = 'mt-2 text-sm leading-6 text-slate-400';
const mainPanelClassName = 'rounded-[34px] border border-white/10 bg-white/[0.035] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.24)] backdrop-blur-2xl sm:p-6 lg:min-h-[760px]';

export default function Quotes() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const redirectToLogin = useAuthRedirect();
  const [clients, setClients] = useState<Client[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [settings, setSettings] = useState<Settings>({ custo_kwh: 0, direct_margin_percent: 20, ecommerce_margin_percent: 35, end_customer_margin_percent: 50, error_rate_percent: 10 });
  const [draft, setDraft] = useState<QuoteDraft>(() => loadDraft());
  const [isLoading, setIsLoading] = useState(false);
  const [showQuantityPresets, setShowQuantityPresets] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<QuoteFieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSharingLink, setIsSharingLink] = useState(false);
  const [isClientPickerOpen, setIsClientPickerOpen] = useState(false);
  const [isUnitCostBreakdownOpen, setIsUnitCostBreakdownOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [isSavingClient, setIsSavingClient] = useState(false);
  const [persistedQuote, setPersistedQuote] = useState<Quote | null>(null);
  const [persistedSignature, setPersistedSignature] = useState<string | null>(null);
  const [publicShareUrl, setPublicShareUrl] = useState<string | null>(null);
  const shareToken = useMemo(() => new URLSearchParams(location.search).get('share') || '', [location.search]);
  const quoteId = useMemo(() => new URLSearchParams(location.search).get('quote') || '', [location.search]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [settingsRes, printersRes] = await Promise.all([
          api.get<Settings>('/settings'),
          api.get<Printer[]>('/printers'),
        ]);

        setSettings(settingsRes.data);
        setPrinters(printersRes.data);

        if (isAuthenticated) {
          const [quotesRes, clientsRes] = await Promise.all([
            api.get<Quote[]>('/quotes'),
            api.get<Client[]>('/clients').catch(() => ({ data: [] as Client[] })),
          ]);

          setQuotes(quotesRes.data);
          setClients(clientsRes.data);
        } else {
          setQuotes([]);
          setClients([]);
        }
      } catch (requestError: any) {
        setError(requestError?.response?.data?.error || 'Nao foi possivel carregar o espaco de cotacoes.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const hasMeaningfulDraft = Object.entries(draft).some(([key, value]) => {
      if (key === 'date') {
        return value !== getCurrentQuoteDate();
      }

      if (key === 'saleChannel') {
        return value !== 'direct';
      }

      if (key === 'quantity') {
        return value !== '1';
      }

      if (key === 'laborCost' || key === 'packagingCost') {
        return value !== '0';
      }

      return value.trim() !== '';
    });

    if (!hasMeaningfulDraft) {
      window.localStorage.removeItem(QUOTE_DRAFT_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(QUOTE_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, [draft]);

  useEffect(() => {
    if (shareToken) {
      navigate(`/shared/quotes/${shareToken}`, { replace: true });
    }
  }, [navigate, shareToken]);

  useEffect(() => {
    if (!shareToken) {
      return;
    }

    let isActive = true;

    const loadSharedQuote = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await api.get<Quote>(`/quotes/public/${shareToken}`);

        if (!isActive) {
          return;
        }

        const nextDraft = buildDraftFromQuote(response.data);

        if (!nextDraft) {
          setError('Nao foi possivel reconstruir esta cotacao publica.');
          return;
        }

        setDraft(nextDraft);
        setFieldErrors({});
        setPersistedQuote(response.data);
        setPersistedSignature(getDraftSignature(nextDraft));
        setPublicShareUrl(`${window.location.origin}/shared/quotes/${shareToken}`);
        setSuccess('Cotacao publica carregada na plataforma.');
      } catch (requestError: any) {
        if (!isActive) {
          return;
        }

        setError(requestError?.response?.data?.error || 'Nao foi possivel abrir a cotacao publica.');
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadSharedQuote();

    return () => {
      isActive = false;
    };
  }, [shareToken]);

  useEffect(() => {
    if (shareToken || !quoteId) {
      return;
    }

    if (!isAuthenticated) {
      redirectToLogin();
      return;
    }

    let isActive = true;

    const loadSavedQuote = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await api.get<Quote>(`/quotes/${quoteId}`);

        if (!isActive) {
          return;
        }

        const nextDraft = buildDraftFromQuote(response.data);

        if (!nextDraft) {
          setError('Nao foi possivel reconstruir esta cotacao salva.');
          return;
        }

        setDraft(nextDraft);
        setFieldErrors({});
        setPersistedQuote(response.data);
        setPersistedSignature(getDraftSignature(nextDraft));
        setPublicShareUrl(response.data.publicShareToken ? `${window.location.origin}/shared/quotes/${response.data.publicShareToken}` : null);
        setSuccess('Cotacao carregada para revisao. Ao salvar, um novo registro sera criado.');
      } catch (requestError: any) {
        if (!isActive) {
          return;
        }

        setError(requestError?.response?.data?.error || 'Nao foi possivel abrir esta cotacao salva.');
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadSavedQuote();

    return () => {
      isActive = false;
    };
  }, [isAuthenticated, quoteId, redirectToLogin, shareToken]);

  useEffect(() => {
    if (!draft.printerId) {
      return;
    }

    if (!printers.length) {
      return;
    }

    const printerStillAvailable = printers.some((printer) => printer.id === draft.printerId);

    if (!printerStillAvailable) {
      setDraft((currentDraft) => ({ ...currentDraft, printerId: '' }));
      setPersistedQuote(null);
      setPersistedSignature(null);
      setPublicShareUrl(null);
    }
  }, [draft.printerId, printers]);

  const saleChannels = getSaleChannels(settings);
  const selectedChannel = getSaleChannel(draft.saleChannel, settings);
  const selectedPrinter = printers.find((printer) => printer.id === draft.printerId) || null;
  const materialWeightGrams = parseDecimal(draft.materialWeightGrams);
  const filamentCostPerKg = parseDecimal(draft.filamentCostPerKg);
  const printHours = parseDurationHours(draft.printHours);
  const quantity = Math.max(1, Math.round(parseDecimal(draft.quantity) || 1));
  const appliedMargin = selectedChannel.marginPercent;
  const laborCost = parseDecimal(draft.laborCost);
  const packagingCost = parseDecimal(draft.packagingCost);
  const additionalOperationalCost = laborCost + packagingCost;
  const materialCostPerUnit = materialWeightGrams > 0 && filamentCostPerKg > 0 ? (materialWeightGrams / 1000) * filamentCostPerKg : 0;
  const energyCostPerUnit = calculatePrinterEnergyCost(selectedPrinter, printHours, settings.custo_kwh);
  const hourlyPrinterCost = calculatePrinterHourlyCost(selectedPrinter);
  const amortizationCostPerUnit = calculatePrinterAmortizationCost(selectedPrinter, printHours);
  const technicalBaseCostPerUnit = materialCostPerUnit + energyCostPerUnit + amortizationCostPerUnit;
  const failureCostPerUnit = technicalBaseCostPerUnit * (settings.error_rate_percent / 100);

  const unitTechnicalCost = useMemo(() => {
    if (!selectedPrinter || materialWeightGrams <= 0 || filamentCostPerKg <= 0 || printHours <= 0) {
      return 0;
    }

    const materialCost = (materialWeightGrams / 1000) * filamentCostPerKg;
    const energyCost = calculatePrinterEnergyCost(selectedPrinter, printHours, settings.custo_kwh);
    const amortizationCost = calculatePrinterAmortizationCost(selectedPrinter, printHours);
    const technicalBaseCost = materialCost + energyCost + amortizationCost;
    return technicalBaseCost + technicalBaseCost * (settings.error_rate_percent / 100);
  }, [filamentCostPerKg, materialWeightGrams, printHours, selectedPrinter, settings.custo_kwh, settings.error_rate_percent]);

  const totalItemCost = unitTechnicalCost * quantity;
  const totalPrintHours = printHours * quantity;
  const totalQuantity = quantity;
  const productionCost = totalItemCost + additionalOperationalCost;
  const suggestedPrice = roundCurrency(productionCost * (1 + appliedMargin / 100));
  const netProfit = roundCurrency(suggestedPrice - productionCost);
  const unitProductCost = totalQuantity ? roundCurrency(productionCost / totalQuantity) : 0;
  const averageUnitPrice = totalQuantity ? suggestedPrice / totalQuantity : 0;
  const recentQuotes = quotes.slice(0, 4);
  const isSubmitDisabled = isLoading;
  const canShareQuote = isAuthenticated && suggestedPrice > 0 && productionCost > 0 && !!selectedPrinter;
  const draftSignature = useMemo(() => getDraftSignature(draft), [draft]);
  const isViewingSharedQuote = false;
  const isViewingSavedQuote = Boolean(quoteId) && !shareToken;
  const sharedQuoteSummary = persistedQuote ? getQuotePrimarySummary(persistedQuote) : null;
  const normalizedClientSearch = clientSearch.trim().toLowerCase();
  const filteredClients = clients.filter((client) => client.name.toLowerCase().includes(normalizedClientSearch));
  const hasExactClientMatch = clients.some((client) => client.name.trim().toLowerCase() === normalizedClientSearch);
  const unitCostBreakdownModal = isUnitCostBreakdownOpen && typeof document !== 'undefined'
    ? createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/74 px-4 backdrop-blur-sm">
          <div className="w-full max-w-[760px] rounded-[32px] border border-white/10 bg-[#081120] p-5 shadow-[0_32px_100px_rgba(0,0,0,0.45)]">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-xl font-semibold text-white">Memoria de calculo do custo do produto</h3>
                <p className="mt-1 text-sm text-slate-400">Detalhamento em tempo real do valor unitario exibido no painel, incluindo material, energia eletrica, amortizacao e custos operacionais.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsUnitCostBreakdownOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
                aria-label="Fechar memoria de calculo"
              >
                x
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Entradas da simulacao</p>
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  <div className="flex items-center justify-between gap-4"><span>Peso informado</span><strong className="text-white">{materialWeightGrams > 0 ? `${materialWeightGrams.toFixed(2)} g` : '--'}</strong></div>
                  <div className="flex items-center justify-between gap-4"><span>Preco do material</span><strong className="text-white">{filamentCostPerKg > 0 ? `${formatCurrency(filamentCostPerKg)}/kg` : '--'}</strong></div>
                  <div className="flex items-center justify-between gap-4"><span>Tempo de impressao</span><strong className="text-white">{draft.printHours || '--'}</strong></div>
                  <div className="flex items-center justify-between gap-4"><span>Quantidade</span><strong className="text-white">{totalQuantity}</strong></div>
                  <div className="flex items-center justify-between gap-4"><span>Impressora</span><strong className="text-right text-white">{selectedPrinter?.nome || '--'}</strong></div>
                  <div className="flex items-center justify-between gap-4"><span>Consumo eletrico</span><strong className="text-white">{selectedPrinter ? `${selectedPrinter.consumo_watts} W` : '--'}</strong></div>
                  <div className="flex items-center justify-between gap-4"><span>Custo da energia</span><strong className="text-white">{formatCurrency(settings.custo_kwh)}/kWh</strong></div>
                  <div className="flex items-center justify-between gap-4"><span>Taxa de erro</span><strong className="text-white">{settings.error_rate_percent.toFixed(2)}%</strong></div>
                  <div className="flex items-center justify-between gap-4"><span>Custo de aquisicao</span><strong className="text-white">{selectedPrinter ? formatCurrency(selectedPrinter.custo_aquisicao) : '--'}</strong></div>
                  <div className="flex items-center justify-between gap-4"><span>Vida util da impressora</span><strong className="text-white">{selectedPrinter ? `${selectedPrinter.vida_util_horas} h` : '--'}</strong></div>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Memoria tecnica por unidade</p>
                <div className="mt-4 space-y-4 text-sm text-slate-300">
                  <div>
                    <p className="text-slate-400">Material</p>
                    <p className="mt-1 text-white">({(materialWeightGrams / 1000).toFixed(4)} kg) x {formatCurrency(filamentCostPerKg)}/kg = {formatCurrency(roundCurrency(materialCostPerUnit))}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Energia eletrica</p>
                    <p className="mt-1 text-white">({selectedPrinter ? (selectedPrinter.consumo_watts / 1000).toFixed(4) : '0.0000'} kW) x {printHours.toFixed(4)} h x {formatCurrency(settings.custo_kwh)}/kWh = {formatCurrency(roundCurrency(energyCostPerUnit))}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Amortizacao da impressora</p>
                    <p className="mt-1 text-white">Custo/h: {selectedPrinter ? `${formatCurrency(roundCurrency(hourlyPrinterCost))} (${formatCurrency(selectedPrinter.custo_aquisicao)} / ${selectedPrinter.vida_util_horas} h)` : '--'}</p>
                    <p className="mt-1 text-white">{formatCurrency(roundCurrency(hourlyPrinterCost))} x {printHours.toFixed(4)} h = {formatCurrency(roundCurrency(amortizationCostPerUnit))}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Taxa de erro aplicada</p>
                    <p className="mt-1 text-white">({formatCurrency(roundCurrency(technicalBaseCostPerUnit))}) x {settings.error_rate_percent.toFixed(2)}% = {formatCurrency(roundCurrency(failureCostPerUnit))}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-[#0a1228]/78 p-3">
                    <div className="flex items-center justify-between gap-4"><span>Custo tecnico por unidade</span><strong className="text-cyan-200">{formatCurrency(roundCurrency(unitTechnicalCost))}</strong></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Custos adicionais da cotacao</p>
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  <div className="flex items-center justify-between gap-4"><span>Mao de obra</span><strong className="text-white">{formatCurrency(laborCost)}</strong></div>
                  <div className="flex items-center justify-between gap-4"><span>Embalagem</span><strong className="text-white">{formatCurrency(packagingCost)}</strong></div>
                  <div className="flex items-center justify-between gap-4"><span>Custos operacionais adicionais</span><strong className="text-white">{formatCurrency(roundCurrency(additionalOperationalCost))}</strong></div>
                </div>
              </div>

              <div className="rounded-[28px] border border-cyan-400/20 bg-cyan-400/[0.06] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Fechamento do custo exibido</p>
                <div className="mt-4 space-y-3 text-sm text-slate-200">
                  <div className="flex items-center justify-between gap-4"><span>Custo tecnico total</span><strong>{formatCurrency(roundCurrency(totalItemCost))}</strong></div>
                  <div className="flex items-center justify-between gap-4"><span>Custo total da cotacao</span><strong>{formatCurrency(roundCurrency(productionCost))}</strong></div>
                  <div className="flex items-center justify-between gap-4"><span>Divisao por quantidade</span><strong>{totalQuantity} un</strong></div>
                  <div className="border-t border-white/10 pt-3">
                    <div className="flex items-center justify-between gap-4 text-base font-semibold text-white"><span>Custo do produto (unidade)</span><strong className="text-cyan-200">{formatCurrency(unitProductCost)}</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )
    : null;
  const clientPickerModal = isClientPickerOpen && typeof document !== 'undefined'
    ? createPortal(
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#020617]/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-[560px] rounded-[32px] border border-white/10 bg-[#081120] p-5 shadow-[0_32px_100px_rgba(0,0,0,0.45)]">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-xl font-semibold text-white">Cliente</h3>
                <p className="mt-1 text-sm text-slate-400">Busque um nome existente ou cadastre um novo cliente para esta cotacao.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsClientPickerOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
                aria-label="Fechar selecao de cliente"
              >
                x
              </button>
            </div>

            <div className="mt-5">
              <label className="flex min-h-[60px] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 focus-within:border-cyan-400/40 focus-within:bg-cyan-400/[0.05]">
                <input
                  autoFocus
                  type="text"
                  value={clientSearch}
                  onChange={(event) => setClientSearch(event.target.value)}
                  placeholder="Digite o nome do cliente"
                  className="w-full border-0 bg-transparent p-0 text-base font-semibold text-white outline-none placeholder:text-slate-500"
                />
              </label>
            </div>

            <div className="mt-5 max-h-[280px] space-y-2 overflow-y-auto pr-1">
              {filteredClients.length ? (
                filteredClients.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => handleSelectClient(client.name)}
                    className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left transition hover:border-cyan-400/35 hover:bg-cyan-400/[0.08]"
                  >
                    <span className="text-sm font-semibold text-white">{client.name}</span>
                    <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Selecionar</span>
                  </button>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-slate-400">
                  Nenhum cliente encontrado com esse nome.
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => {
                  updateDraft({ clientName: '' });
                  setClientSearch('');
                  setIsClientPickerOpen(false);
                }}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
              >
                Sem cliente
              </button>

              <button
                type="button"
                onClick={handleCreateClient}
                disabled={!clientSearch.trim() || hasExactClientMatch || isSavingClient}
                className="brand-primary-action rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed"
              >
                {hasExactClientMatch ? 'Cliente ja cadastrado' : isSavingClient ? 'Salvando...' : 'Cadastrar cliente'}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )
    : null;

  async function handleCreateClient() {
    const nextClientName = clientSearch.trim();

    if (!nextClientName) {
      return;
    }

    try {
      setIsSavingClient(true);
      const response = await api.post<Client>('/clients', { name: nextClientName });
      setClients((currentClients) => {
        const alreadyExists = currentClients.some((client) => client.id === response.data.id);
        const nextClients = alreadyExists ? currentClients : [...currentClients, response.data];
        return nextClients.sort((left, right) => left.name.localeCompare(right.name));
      });
      updateDraft({ clientName: response.data.name });
      setClientSearch('');
      setIsClientPickerOpen(false);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || 'Nao foi possivel cadastrar o cliente.');
    } finally {
      setIsSavingClient(false);
    }
  }

  function handleSelectClient(name: string) {
    updateDraft({ clientName: name });
    setClientSearch('');
    setIsClientPickerOpen(false);
  }

  function clearFieldErrors(partial: Partial<QuoteDraft>) {
    const keys = Object.keys(partial) as QuoteFieldName[];

    if (!keys.length) {
      return;
    }

    setFieldErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      let hasChanges = false;

      keys.forEach((key) => {
        if (key in nextErrors) {
          delete nextErrors[key];
          hasChanges = true;
        }
      });

      return hasChanges ? nextErrors : currentErrors;
    });
  }

  function updateDraft(partial: Partial<QuoteDraft>) {
    clearFieldErrors(partial);
    setDraft((currentDraft) => ({ ...currentDraft, ...partial }));
  }

  function validateDraft(): { fieldErrors: QuoteFieldErrors; formError: string | null } {
    const nextFieldErrors: QuoteFieldErrors = {};

    if (!draft.productName.trim()) {
      nextFieldErrors.productName = 'Informe o nome do produto para identificar esta cotacao.';
    }

    if (!draft.materialWeightGrams.trim() || materialWeightGrams <= 0) {
      nextFieldErrors.materialWeightGrams = 'Informe um peso maior que zero em gramas.';
    }

    if (!draft.filamentCostPerKg.trim() || filamentCostPerKg <= 0) {
      nextFieldErrors.filamentCostPerKg = 'Informe um preco por kg maior que zero para o material.';
    }

    if (!draft.printHours.trim()) {
      nextFieldErrors.printHours = 'Informe o tempo de impressao em horas, usando HH:MM.';
    } else if (printHours <= 0) {
      nextFieldErrors.printHours = 'Use horas em formato HH:MM. Exemplo: 10:00 ou 01:30.';
    }

    if (!draft.quantity.trim() || quantity <= 0) {
      nextFieldErrors.quantity = 'Informe uma quantidade inteira maior que zero.';
    }

    if (!draft.printerId || !selectedPrinter) {
      nextFieldErrors.printerId = 'Selecione a impressora usada para produzir esta cotacao.';
    }

    if (!draft.date) {
      return {
        fieldErrors: nextFieldErrors,
        formError: 'Nao foi possivel definir a data da cotacao. Atualize a pagina e tente novamente.',
      };
    }

    if (!printers.length) {
      return {
        fieldErrors: nextFieldErrors,
        formError: 'Cadastre pelo menos uma impressora antes de salvar a cotacao.',
      };
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      return {
        fieldErrors: nextFieldErrors,
        formError: 'Revise os campos obrigatorios destacados antes de salvar a cotacao.',
      };
    }

    if (suggestedPrice <= 0) {
      return {
        fieldErrors: nextFieldErrors,
        formError: 'Nao foi possivel calcular um valor de venda valido. Revise os dados informados.',
      };
    }

    return {
      fieldErrors: {},
      formError: null,
    };
  }

  function focusFirstInvalidField(errors: QuoteFieldErrors) {
    if (typeof window === 'undefined') {
      return;
    }

    const fieldOrder: Array<{ key: QuoteFieldName; elementId: string }> = [
      { key: 'productName', elementId: 'quote-product-name' },
      { key: 'materialWeightGrams', elementId: 'quote-weight' },
      { key: 'filamentCostPerKg', elementId: 'quote-filament-cost' },
      { key: 'printHours', elementId: 'quote-print-hours' },
      { key: 'quantity', elementId: 'quote-quantity' },
      { key: 'printerId', elementId: 'quote-printer' },
    ];

    const firstInvalid = fieldOrder.find(({ key }) => errors[key]);

    if (!firstInvalid) {
      return;
    }

    window.requestAnimationFrame(() => {
      document.getElementById(firstInvalid.elementId)?.focus();
    });
  }

  function applyQuantityPreset(nextQuantity: number) {
    updateDraft({ quantity: String(nextQuantity) });
  }

  function resetComposer() {
    setDraft(getDefaultDraft());
    setClientSearch('');
    setPersistedQuote(null);
    setPersistedSignature(null);
    setPublicShareUrl(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(QUOTE_DRAFT_STORAGE_KEY);
    }
    navigate('/quotes', { replace: true });
  }

  function upsertQuoteInHistory(quote: Quote) {
    setQuotes((currentQuotes) => {
      const nextQuotes = [quote, ...currentQuotes.filter((currentQuote) => currentQuote.id !== quote.id)];
      return nextQuotes;
    });
  }

  async function createQuoteFromDraft() {
    const validationResult = validateDraft();

    if (validationResult.formError) {
      setFieldErrors(validationResult.fieldErrors);
      setError(validationResult.formError);
      focusFirstInvalidField(validationResult.fieldErrors);
      return null;
    }

    setFieldErrors({});

    const marginMultiplier = 1 + appliedMargin / 100;
    const targetTotal = roundCurrency((totalItemCost + additionalOperationalCost) * marginMultiplier);
    const unitPrice = Number((targetTotal / quantity).toFixed(4));
    const payloadItems = [
      {
        productName: draft.productName.trim(),
        printerId: draft.printerId,
        materialWeightGrams,
        filamentCostPerKg,
        printHours,
        quantidade: quantity,
        preco_unitario: unitPrice,
      },
    ];

    const manualMetadata = {
      productName: draft.productName.trim(),
      printerId: draft.printerId,
      materialWeightGrams,
      filamentCostPerKg,
      printHours,
      quantity,
      errorRatePercent: settings.error_rate_percent,
      technicalBaseCostPerUnit: roundCurrency(technicalBaseCostPerUnit),
      failureCostPerUnit: roundCurrency(failureCostPerUnit),
    };

    const contextNotes = [
      draft.notes.trim() || null,
      `Contexto comercial: canal ${selectedChannel.label}; mao de obra ${formatCurrency(laborCost)}; embalagem ${formatCurrency(packagingCost)}.`,
      `__RL3D_MANUAL__${JSON.stringify(manualMetadata)}`,
    ]
      .filter(Boolean)
      .join('\n\n');

    const response = await api.post<Quote>('/quotes', {
      nome_cliente: draft.clientName,
      data: draft.date || getCurrentQuoteDate(),
      notes: contextNotes,
      sale_channel: draft.saleChannel,
      subtotal_custo: roundCurrency(productionCost),
      margem_percentual: Number(appliedMargin.toFixed(2)),
      items: payloadItems,
    });

    upsertQuoteInHistory(response.data);
    setPersistedQuote(response.data);
    setPersistedSignature(draftSignature);
    setPublicShareUrl(null);
    return response.data;
  }

  async function ensurePersistedQuote() {
    if (persistedQuote && persistedSignature === draftSignature) {
      return persistedQuote;
    }

    return createQuoteFromDraft();
  }

  async function generatePublicShareUrl() {
    const quote = await ensurePersistedQuote();

    if (!quote) {
      return null;
    }

    const response = await api.post<ShareQuoteResponse>(`/quotes/${quote.id}/share`);
    setPublicShareUrl(response.data.shareUrl);
    return response.data.shareUrl;
  }

  async function handleCopyShareLink() {
    if (!isAuthenticated) {
      redirectToLogin();
      return;
    }

    if (!canShareQuote) {
      setError('Preencha a cotacao com uma impressora valida antes de copiar o link publico.');
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      setIsSharingLink(true);

      const shareUrl = await generatePublicShareUrl();

      if (!shareUrl) {
        return;
      }

      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setSuccess('Link publico copiado para a area de transferencia.');
        return;
      }

      setSuccess('Link publico gerado. Copie a URL exibida pelo navegador.');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || 'Nao foi possivel copiar o link publico desta cotacao.');
    } finally {
      setIsSharingLink(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isAuthenticated) {
      redirectToLogin();
      return;
    }

    try {
      setIsLoading(true);
      const quote = await createQuoteFromDraft();

      if (!quote) {
        return;
      }

      setSuccess('Cotacao salva como um novo registro comercial.');
      resetComposer();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || 'Nao foi possivel salvar a cotacao.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <Loading isLoading={isLoading} label="Atualizando o cockpit comercial..." />

      {error ? <Alert type="error" message={error} onClose={() => setError(null)} /> : null}
      {success ? <Alert type="success" message={success} onClose={() => setSuccess(null)} /> : null}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid gap-6 min-[900px]:grid-cols-3">
          <section className={mainPanelClassName}>
            <div className="border-b border-white/10 pb-5">
              <h2 className={sectionTitleClassName}>{isAuthenticated ? 'Produto' : 'Simulação'}</h2>
              <p className={sectionDescriptionClassName}>
                {isAuthenticated
                  ? 'Informe produto, cliente, peso, tempo e quantidade, depois selecione a impressora usada na producao.'
                  : 'Informe peso, tempo e quantidade, depois selecione a impressora usada para calcular a cotacao.'}
              </p>
              <p className="mt-3 text-sm font-medium text-slate-300">
                <span className="text-red-300">*</span> Campos obrigatorios
              </p>
            </div>

            <div className="mt-6 space-y-5">
              {isAuthenticated ? (
                <div className="grid gap-4">
                  <label className="block rounded-[28px] border border-white/10 bg-[#0a1228]/85 p-4 shadow-[0_16px_50px_rgba(0,0,0,0.18)]">
                    <span className="block text-sm font-medium text-slate-200">Nome do produto <span className="text-red-300">*</span></span>
                    <input
                      id="quote-product-name"
                      value={draft.productName}
                      onChange={(event) => updateDraft({ productName: event.target.value })}
                      placeholder="Ex: Suporte de celular"
                      aria-invalid={fieldErrors.productName ? 'true' : 'false'}
                      aria-describedby={fieldErrors.productName ? 'quote-product-name-error' : undefined}
                      className={`mt-4 min-h-[60px] w-full rounded-2xl border bg-white/[0.04] px-4 text-base font-semibold text-white outline-none transition focus:bg-cyan-400/[0.05] ${fieldErrors.productName ? 'border-red-400/60 focus:border-red-400/70' : 'border-white/10 focus:border-cyan-400/40'}`}
                    />
                    {fieldErrors.productName ? <span id="quote-product-name-error" className="mt-3 block text-sm leading-5 text-red-300">{fieldErrors.productName}</span> : null}
                  </label>

                  <label className="block rounded-[28px] border border-white/10 bg-[#0a1228]/85 p-4 shadow-[0_16px_50px_rgba(0,0,0,0.18)]">
                    <span className="block text-sm font-medium text-slate-200">Cliente</span>
                    <button
                      type="button"
                      onClick={() => {
                        setClientSearch(draft.clientName);
                        setIsClientPickerOpen(true);
                      }}
                      className="mt-4 flex min-h-[60px] w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-left text-base font-semibold text-white outline-none transition hover:border-cyan-400/35 hover:bg-cyan-400/[0.05]"
                    >
                      <span className={draft.clientName ? 'text-white' : 'text-slate-500'}>{draft.clientName || 'Selecionar ou cadastrar cliente'}</span>
                      <span className="text-cyan-200" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M10.75 18a7.25 7.25 0 1 1 0-14.5 7.25 7.25 0 0 1 0 14.5Z" />
                        </svg>
                      </span>
                    </button>
                  </label>
                </div>
              ) : null}

              {!isAuthenticated ? (
                <Alert type="info" message="Voce pode calcular livremente como visitante. Para salvar cotacoes, registrar clientes e acessar historico, entre com sua conta." />
              ) : null}

              <div className="grid gap-4 xl:grid-cols-2">
                <NumericInput id="quote-weight" label="Peso" value={draft.materialWeightGrams} onChange={(materialWeightGramsValue) => updateDraft({ materialWeightGrams: materialWeightGramsValue })} suffix="g" hint="material" required error={fieldErrors.materialWeightGrams} />
                <NumericInput id="quote-filament-cost" label="Preco do material" value={draft.filamentCostPerKg} onChange={(filamentCostPerKgValue) => updateDraft({ filamentCostPerKg: filamentCostPerKgValue })} prefix="R$" hint="kg" required error={fieldErrors.filamentCostPerKg} />
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <label className={`flex min-h-[132px] flex-col rounded-[28px] border bg-[#0a1228]/85 p-4 shadow-[0_16px_50px_rgba(0,0,0,0.18)] ${fieldErrors.printHours ? 'border-red-400/60' : 'border-white/10'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="block text-sm font-medium leading-5 text-slate-200">Tempo <span className="text-red-300">*</span></span>
                      <span className="block text-[11px] uppercase tracking-[0.22em] text-slate-500">HH:MM</span>
                    </div>
                    <div className="group relative shrink-0">
                      <button
                        type="button"
                        aria-label="Ajuda sobre o formato de tempo"
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xs font-semibold text-slate-300 transition hover:border-cyan-400/35 hover:bg-cyan-400/[0.08] hover:text-cyan-200 focus:border-cyan-400/35 focus:bg-cyan-400/[0.08] focus:text-cyan-200 focus:outline-none"
                      >
                        ?
                      </button>
                      <div className="pricing-help-popover pointer-events-none absolute right-0 top-[calc(100%+10px)] z-20 w-72 rounded-2xl p-4 text-left text-sm leading-6 opacity-0 transition duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
                        <p className="pricing-help-title text-[11px] font-semibold uppercase tracking-[0.2em]">Formato esperado</p>
                        <p className="mt-2">Use apenas `HH:MM`.<br />Exemplos validos: `10:00`, `01:30` ou `00:45`.</p>
                      </div>
                    </div>
                  </div>

                  <div className={`mt-4 flex min-h-[60px] items-center gap-3 rounded-2xl border bg-white/[0.04] px-4 py-3 focus-within:bg-cyan-400/[0.05] ${fieldErrors.printHours ? 'border-red-400/60 focus-within:border-red-400/70' : 'border-white/10 focus-within:border-cyan-400/40'}`}>
                    <input
                      id="quote-print-hours"
                      type="text"
                      inputMode="numeric"
                      value={draft.printHours}
                      onChange={(event) => updateDraft({ printHours: event.target.value })}
                      placeholder="Ex: 10:00 ou 01:30"
                      aria-invalid={fieldErrors.printHours ? 'true' : 'false'}
                      aria-describedby={fieldErrors.printHours ? 'quote-print-hours-error' : undefined}
                      className="w-full border-0 bg-transparent p-0 text-base font-semibold text-white outline-none placeholder:text-slate-500"
                    />
                  </div>

                  {fieldErrors.printHours ? <span id="quote-print-hours-error" className="mt-2 text-sm leading-5 text-red-300">{fieldErrors.printHours}</span> : null}
                </label>

                <div className={`relative flex min-h-[132px] flex-col rounded-[28px] border bg-[#0a1228]/85 p-4 shadow-[0_16px_50px_rgba(0,0,0,0.18)] ${fieldErrors.quantity ? 'border-red-400/60' : 'border-white/10'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="block text-sm font-medium leading-5 text-slate-200">Quantidade <span className="text-red-300">*</span></span>
                      <span className="block text-[11px] uppercase tracking-[0.22em] text-slate-500">unid.</span>
                    </div>
                    <button
                      type="button"
                      aria-label="Abrir presets de quantidade"
                      aria-expanded={showQuantityPresets}
                      onClick={() => setShowQuantityPresets((currentValue) => !currentValue)}
                      className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition ${
                        showQuantityPresets ? 'border-cyan-400/35 bg-cyan-400/[0.08] text-cyan-200' : 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'
                      }`}
                    >
                      +
                    </button>
                  </div>

                  <div className={`mt-4 flex min-h-[60px] items-center gap-3 rounded-2xl border bg-white/[0.04] px-4 py-3 focus-within:bg-cyan-400/[0.05] ${fieldErrors.quantity ? 'border-red-400/60 focus-within:border-red-400/70' : 'border-white/10 focus-within:border-cyan-400/40'}`}>
                    <input
                      id="quote-quantity"
                      aria-label="Quantidade"
                      type="number"
                      inputMode="decimal"
                      step="1"
                      min="1"
                      value={draft.quantity}
                      onChange={(event) => updateDraft({ quantity: event.target.value })}
                      aria-invalid={fieldErrors.quantity ? 'true' : 'false'}
                      aria-describedby={fieldErrors.quantity ? 'quote-quantity-error' : undefined}
                      className="w-full border-0 bg-transparent p-0 text-base font-semibold text-white outline-none placeholder:text-slate-500"
                    />
                  </div>

                  {fieldErrors.quantity ? <span id="quote-quantity-error" className="mt-3 text-sm leading-5 text-red-300">{fieldErrors.quantity}</span> : null}

                  {showQuantityPresets ? (
                    <div className="quantity-preset-popover absolute right-4 top-[calc(100%+12px)] z-20 w-[220px] rounded-[24px] p-3">
                      <p className="quantity-preset-title px-1 text-[11px] font-semibold uppercase tracking-[0.2em]">Preset rapido</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                      {[1, 5, 10, 25].map((presetQuantity) => (
                        <button
                          key={presetQuantity}
                          type="button"
                          onClick={() => {
                            applyQuantityPreset(presetQuantity);
                            setShowQuantityPresets(false);
                          }}
                          className={`quantity-preset-option rounded-full border px-3 py-2 text-xs font-semibold transition ${
                            totalQuantity === presetQuantity ? 'brand-primary-active' : ''
                          }`}
                        >
                          {presetQuantity} un
                        </button>
                      ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <NumericInput label="Mao de obra" value={draft.laborCost} onChange={(laborCostValue) => updateDraft({ laborCost: laborCostValue })} prefix="R$" hint="fixo" />
                <NumericInput label="Embalagem" value={draft.packagingCost} onChange={(packagingCostValue) => updateDraft({ packagingCost: packagingCostValue })} prefix="R$" hint="fixo" />
              </div>

              {printers.length ? (
                <PrinterSelector printers={printers} selectedPrinterId={draft.printerId} onChange={(printerId) => updateDraft({ printerId })} required error={fieldErrors.printerId} />
              ) : (
                <div className="rounded-[28px] border border-dashed border-white/10 bg-[#0a1228]/60 p-5 text-sm leading-6 text-slate-400">
                  Nenhuma impressora cadastrada. Cadastre a impressora em Configuracoes para liberar a mesa de cotacao.
                  <div className="mt-4">
                    <Link to="/pricing" className="inline-flex rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]">
                      Abrir configuracoes
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className={mainPanelClassName}>
            <div className="border-b border-white/10 pb-5">
              <h2 className={sectionTitleClassName}>Custos adicionais e margem</h2>
              <p className={sectionDescriptionClassName}>Escolha o canal comercial e confira a data automatica da cotacao.</p>
            </div>

            <div className="mt-6 rounded-[30px] border border-white/10 bg-[#0a1228]/78 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white">Canal de venda</p>
                  <p className="mt-1 text-sm text-slate-400">Escolha o contexto comercial e consulte a explicacao so quando precisar.</p>
                </div>
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.08] px-4 py-3 text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Margem atual</p>
                  <p className="mt-1 text-lg font-semibold text-cyan-200">{selectedChannel.marginPercent}%</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {saleChannels.map((channel) => {
                  const isSelected = draft.saleChannel === channel.id;

                  return (
                    <div key={channel.id} className="w-full">
                      <button
                        type="button"
                        onClick={() => updateDraft({ saleChannel: channel.id })}
                        className={`flex min-h-[60px] w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                          isSelected ? 'border-cyan-400/35 bg-cyan-400/[0.08]' : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08]'
                        }`}
                      >
                        <span className="text-sm font-semibold text-white">{channel.label}</span>
                        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${isSelected ? 'bg-cyan-300/20 text-cyan-200' : 'bg-white/[0.06] text-slate-300'}`}>
                          {channel.marginPercent}%
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 rounded-[28px] border border-white/10 bg-[#0a1228]/85 p-4 shadow-[0_16px_50px_rgba(0,0,0,0.18)]">
              <div className="space-y-1">
                <span className="block text-sm font-medium leading-5 text-slate-200">Data da cotacao</span>
                <span className="block text-[11px] uppercase tracking-[0.22em] text-slate-500">preenchimento automatico</span>
              </div>
              <div className="mt-4 flex min-h-[60px] items-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <span className="text-base font-semibold text-white">{formatQuoteDate(draft.date)}</span>
              </div>
            </div>
          </section>

          <aside className="flex h-fit self-start flex-col rounded-[34px] border border-cyan-400/15 bg-[linear-gradient(180deg,rgba(7,11,22,0.98),rgba(8,17,32,0.98))] p-5 shadow-[0_32px_100px_rgba(0,0,0,0.32)] backdrop-blur-2xl sm:p-6 min-[900px]:sticky min-[900px]:top-28">
            <div className="border-b border-white/10 pb-5">
              <h2 className={sectionTitleClassName}>Painel de preco</h2>
              <p className={sectionDescriptionClassName}>Boa leitura para decisao rapida, mas agora com menos altura e menos ruido visual.</p>
            </div>

            {isViewingSavedQuote && persistedQuote ? (
              <div className="mt-6 rounded-[30px] border border-cyan-400/20 bg-cyan-400/[0.08] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200">Cotacao reaberta</p>
                <h3 className="mt-2 text-lg font-semibold text-white">{sharedQuoteSummary?.productName || 'Cotacao compartilhada'}</h3>
                <div className="mt-3 grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
                  <div>
                    <p className="text-slate-400">Cliente</p>
                    <p className="mt-1 font-medium text-white">{persistedQuote.nome_cliente || 'Cliente nao informado'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Data</p>
                    <p className="mt-1 font-medium text-white">{formatQuoteDate(typeof persistedQuote.data === 'string' ? persistedQuote.data.substring(0, 10) : draft.date)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Canal</p>
                    <p className="mt-1 font-medium text-white">{getSaleChannel(getSaleChannelFromQuote(persistedQuote.sale_channel), settings).label}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Valor total salvo</p>
                    <p className="mt-1 font-medium text-cyan-100">{formatCurrency(persistedQuote.valor_total)}</p>
                  </div>
                </div>
                {sharedQuoteSummary ? <div className="mt-4"><QuoteErrorRateSummary summary={sharedQuoteSummary} /></div> : null}
                <p className="mt-4 text-sm leading-6 text-slate-300">Voce pode ajustar esta base e salvar novamente. O salvamento cria uma nova cotacao, sem sobrescrever o registro anterior.</p>
              </div>
            ) : null}

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
              <PricingCard
                label="Custo do produto (unidade)"
                value={unitProductCost}
                formatter={formatCurrency}
                description={"Formula: custo total / quantidade.\n\nConsidera a divisao do custo total da cotacao pela quantidade informada, incluindo custo tecnico, mao de obra e embalagem."}
                actionAriaLabel="Abrir memoria de calculo do custo do produto"
                actionIcon={(
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75H18" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 12H18" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 17.25H18" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 6.75h.008v.008H4.5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h.008v.008H4.5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 17.25h.008v.008H4.5z" />
                  </svg>
                )}
                onActionClick={() => setIsUnitCostBreakdownOpen(true)}
              />
              <PricingCard label="Valor de venda (unidade)" value={averageUnitPrice} formatter={formatCurrency} description={"Formula: valor venda total / quantidade.\n\nRepresenta o preco medio de venda de cada unidade depois da aplicacao da margem do canal escolhido."} tone="warm" />
              <PricingCard label="Custo total" value={productionCost} formatter={formatCurrency} description={"Formula: custo tecnico total + mao de obra + embalagem.\n\nO custo tecnico total soma material, energia e amortizacao da impressora multiplicados pela quantidade."} />
              <PricingCard label="Valor venda total" value={suggestedPrice} formatter={formatCurrency} description={"Formula: custo total x (1 + margem / 100).\n\nEste e o valor final sugerido para a cotacao completa com a margem comercial aplicada."} tone="accent" emphasize />
              <div className="sm:col-span-2 xl:col-span-2">
                <PricingCard label="Lucro liquido" value={netProfit} formatter={formatCurrency} description={"Formula: valor venda total - custo total.\n\nMostra quanto sobra na cotacao depois de cobrir o custo tecnico e os custos operacionais adicionais."} tone="success" />
              </div>
            </div>

            {isAuthenticated && publicShareUrl ? (
              <div className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Link publico</p>
                    <p className="mt-1 text-sm leading-6 text-slate-300">Use este link para abrir a cotacao direto na plataforma.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyShareLink}
                    disabled={isSharingLink}
                    className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.08] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200 transition hover:border-cyan-300/35 hover:bg-cyan-300/[0.14] disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.04] disabled:text-slate-500"
                  >
                    Copiar
                  </button>
                </div>
                <div className="mt-3 rounded-2xl border border-white/10 bg-[#0a1228]/70 px-4 py-3 text-sm font-medium text-slate-200">
                  <span className="break-all">{publicShareUrl}</span>
                </div>
              </div>
            ) : null}

            <div className="mt-auto flex items-center gap-3 pt-6">
              {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={handleCopyShareLink}
                    disabled={!canShareQuote || isSharingLink}
                    aria-label="Gerar e copiar link publico da cotacao"
                    className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition ${
                      canShareQuote && !isSharingLink
                        ? 'border-cyan-400/25 bg-cyan-400/[0.08] text-cyan-200 hover:border-cyan-300/45 hover:bg-cyan-300/[0.14]'
                        : 'cursor-not-allowed border-white/10 bg-white/[0.04] text-slate-500'
                    }`}
                    title={canShareQuote ? 'Gerar e copiar link publico da cotacao' : 'Preencha e salve a cotacao para copiar o link publico'}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
                      <rect x="9" y="9" width="10" height="10" rx="2" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
                    </svg>
                  </button>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="brand-primary-action w-full rounded-2xl px-5 py-4 text-sm font-semibold transition disabled:cursor-not-allowed"
              >
                Salvar cotacao
              </button>
            </div>
          </aside>
        </div>

        <section className="rounded-[34px] border border-white/10 bg-white/[0.035] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.24)] backdrop-blur-2xl sm:p-6">
          <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Historico operacional</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Cotacoes recentes para consulta rapida</h2>
            </div>
            <p className="text-sm text-slate-400">A proposta fica comercialmente legivel sem abrir telas auxiliares.</p>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-4">
            {!isAuthenticated ? (
              <div className="rounded-[30px] border border-dashed border-cyan-400/25 bg-cyan-400/[0.06] p-6 text-sm leading-7 text-slate-300 xl:col-span-4">
                O historico salvo fica vinculado à conta autenticada.
                <div className="mt-4">
                  <Link to="/login" className="brand-primary-action inline-flex rounded-2xl px-4 py-3 text-sm font-semibold transition">
                    Entrar para liberar historico
                  </Link>
                </div>
              </div>
            ) : recentQuotes.length ? (
              recentQuotes.map((quote) => {
                const summary = getQuotePrimarySummary(quote);
                const { productName, unitCost } = summary;

                return (
                  <Link key={quote.id} to={`/quotes?quote=${quote.id}`} className="block rounded-[30px] border border-white/10 bg-[#0a1228]/78 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.2)] transition hover:border-cyan-400/35 hover:bg-cyan-400/[0.08]">
                    <h3 className="mt-3 text-lg font-semibold text-white">{productName}</h3>
                    <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-cyan-200">{unitCost !== null ? formatCurrency(unitCost) : 'Custo unitario nao informado'}</p>
                    <div className="mt-4 flex flex-wrap gap-2">{renderChannelPriceBadges(unitCost, saleChannels)}</div>
                    <div className="mt-4 space-y-1 text-sm text-slate-400">
                      <p>{quote.nome_cliente}</p>
                      <p>{formatQuoteTimestamp(quote.createdAt)}</p>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="rounded-[30px] border border-dashed border-white/10 bg-[#0a1228]/60 p-6 text-sm leading-6 text-slate-400 xl:col-span-4">
                Ainda nao ha historico salvo nesta base. Monte a primeira cotacao acima e use o painel dominante como referencia principal.
              </div>
            )}
          </div>
        </section>

        <div className="fixed inset-x-4 bottom-4 z-30 lg:hidden">
          <div className="rounded-[28px] border border-white/10 bg-[#081120]/92 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Live total</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">{formatCurrency(suggestedPrice)}</p>
              </div>
              <div className="flex items-center gap-3">
                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={handleCopyShareLink}
                    disabled={!canShareQuote || isSharingLink}
                    aria-label="Gerar e copiar link publico da cotacao"
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition ${
                      canShareQuote && !isSharingLink
                        ? 'border-cyan-400/25 bg-cyan-400/[0.08] text-cyan-200 hover:border-cyan-300/45 hover:bg-cyan-300/[0.14]'
                        : 'cursor-not-allowed border-white/10 bg-white/[0.04] text-slate-500'
                    }`}
                    title={canShareQuote ? 'Gerar e copiar link publico da cotacao' : 'Preencha e salve a cotacao para copiar o link publico'}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5" aria-hidden="true">
                      <rect x="9" y="9" width="10" height="10" rx="2" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
                    </svg>
                  </button>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitDisabled}
                  className="brand-primary-action rounded-2xl px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {unitCostBreakdownModal}
      {clientPickerModal}
    </div>
  );
}