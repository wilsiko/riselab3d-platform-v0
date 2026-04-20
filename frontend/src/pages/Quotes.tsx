import { useEffect, useState, FormEvent } from 'react';
import api from '../api';
import { Printer, Product, Quote, QuoteSaleType, Settings } from '../types';
import { Loading } from '../components/Loading';
import { Alert } from '../components/Alert';
import { Pagination } from '../components/Pagination';
import { formatCurrency, formatDecimalInput, parseDecimalInput, parseNumberInputValue } from '../utils/numberFormat';

const ITEMS_PER_PAGE = 5;

interface QuoteItemLine {
  productId: string;
  printerId: string;
  quantidade: number | '';
  preco_unitario: string;
}

const SALE_TYPE_OPTIONS: Array<{ value: QuoteSaleType; label: string }> = [
  { value: 'venda_direta', label: 'Venda Direta' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'consumidor_final', label: 'Usuario Final' },
];

function saleTypeBadgeClass(saleType: QuoteSaleType) {
  if (saleType === 'venda_direta') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  }

  if (saleType === 'ecommerce') {
    return 'border-amber-200 bg-amber-50 text-amber-800';
  }

  return 'border-cyan-200 bg-cyan-50 text-cyan-800';
}

function calculateQuoteUnitPrice(product: Product, printer: Printer, custoKwh: number) {
  const custoEnergia = (printer.consumo_watts / 1000) * product.tempo_impressao_horas * custoKwh;
  const custoAmortizacao = (printer.custo_aquisicao / printer.vida_util_horas) * product.tempo_impressao_horas;
  const subtotal = product.custo_material + custoEnergia + custoAmortizacao + product.custo_adicional;
  const custoFalhas = subtotal * (product.falha_percentual / 100);

  return subtotal + custoFalhas;
}

function resolveMarginPercent(saleType: QuoteSaleType | '', settings: Settings) {
  if (saleType === 'venda_direta') {
    return settings.margem_venda_direta;
  }

  if (saleType === 'ecommerce') {
    return settings.margem_venda_ecommerce;
  }

  if (saleType === 'consumidor_final') {
    return settings.margem_venda_consumidor_final;
  }

  return null;
}

function applyMargin(value: number, marginPercent: number) {
  return value * (1 + marginPercent / 100);
}

export default function Quotes() {
  const [products, setProducts] = useState<Product[]>([]);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>({
    custo_kwh: 0,
    margem_venda_direta: 20,
    margem_venda_ecommerce: 35,
    margem_venda_consumidor_final: 50,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [clientName, setClientName] = useState('Cliente VIP');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [saleType, setSaleType] = useState<QuoteSaleType | ''>('');
  const [clientFilter, setClientFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [items, setItems] = useState<QuoteItemLine[]>([
    { productId: '', printerId: '', quantidade: 1, preco_unitario: '0,00' },
  ]);
  const [highlightedQuoteId, setHighlightedQuoteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const filteredQuotes = quotes.filter((quote) => {
    const normalizedClientFilter = clientFilter.trim().toLowerCase();
    const quoteDate = new Date(quote.data);

    if (normalizedClientFilter && !quote.nome_cliente.toLowerCase().includes(normalizedClientFilter)) {
      return false;
    }

    if (startDateFilter) {
      const startDate = new Date(`${startDateFilter}T00:00:00`);

      if (quoteDate < startDate) {
        return false;
      }
    }

    if (endDateFilter) {
      const endDate = new Date(`${endDateFilter}T23:59:59`);

      if (quoteDate > endDate) {
        return false;
      }
    }

    return true;
  });

  const paginatedQuotes = filteredQuotes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );
  const totalPages = Math.ceil(filteredQuotes.length / ITEMS_PER_PAGE);

  const resetForm = () => {
    setEditingQuoteId(null);
    setClientName('Cliente VIP');
    setDate(new Date().toISOString().substring(0, 10));
    setSaleType('');
    setItems([{ productId: '', printerId: '', quantidade: 1, preco_unitario: '0,00' }]);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [productsRes, printersRes, settingsRes, quotesRes] = await Promise.all([
          api.get<Product[]>('/products'),
          api.get<Printer[]>('/printers'),
          api.get<Settings>('/settings'),
          api.get<Quote[]>('/quotes'),
        ]);
        setProducts(productsRes.data);
        setPrinters(printersRes.data);
        setSettings(settingsRes.data);
        setQuotes(quotesRes.data);
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Erro ao carregar dados');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [clientFilter, startDateFilter, endDateFilter]);

  useEffect(() => {
    if (!highlightedQuoteId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setHighlightedQuoteId((currentId) => (currentId === highlightedQuoteId ? null : currentId));
    }, 8000);

    return () => window.clearTimeout(timeoutId);
  }, [highlightedQuoteId]);

  const addItem = () => setItems((prev) => [...prev, { productId: '', printerId: '', quantidade: 1, preco_unitario: '0,00' }]);

  const removeItem = (index: number) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, currentIndex) => currentIndex !== index)));
  };

  const updateItem = (index: number, partial: Partial<QuoteItemLine>) => {
    setItems((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...partial } : item)));
  };

  const buildDisplayUnitPrice = (product: Product | undefined, printer: Printer | undefined) => {
    if (!product || !printer) {
      return '0,00';
    }

    const baseCost = calculateQuoteUnitPrice(product, printer, settings.custo_kwh);

    return formatDecimalInput(baseCost);
  };

  const selectedMarginPercent = resolveMarginPercent(saleType, settings);
  const formTotalCost = items.reduce((sum, item) => {
    const unitPrice = parseDecimalInput(item.preco_unitario) || 0;
    return sum + Number(item.quantidade || 0) * unitPrice;
  }, 0);
  const formTotalSale = selectedMarginPercent === null ? formTotalCost : applyMargin(formTotalCost, selectedMarginPercent);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    // Validação
    if (!saleType) {
      setError('Selecione Venda Direta, E-commerce ou Usuario Final antes de gerar o orçamento.');
      return;
    }

    if (items.some((item) => !item.productId || !item.printerId || item.quantidade === '' || Number(item.quantidade) <= 0)) {
      setError('Todos os itens devem ter um produto e uma impressora selecionados');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        nome_cliente: clientName,
        data: date,
        tipo_venda: saleType,
        items: items.map((item) => ({
          ...item,
          quantidade: Number(item.quantidade),
        })),
      };
      const response = editingQuoteId
        ? await api.put<Quote>(`/quotes/${editingQuoteId}`, payload)
        : await api.post<Quote>('/quotes', payload);

      setQuotes((prev) => {
        if (editingQuoteId) {
          return prev.map((quote) => (quote.id === editingQuoteId ? response.data : quote));
        }

        return [response.data, ...prev];
      });
      setExpandedQuoteId(response.data.id);
      setHighlightedQuoteId(response.data.id);
      setSuccess(editingQuoteId ? 'Orçamento atualizado com sucesso!' : 'Orçamento criado com sucesso!');
      resetForm();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erro ao salvar orçamento');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (quote: Quote) => {
    setEditingQuoteId(quote.id);
    setError(null);
    setSuccess(null);
    setClientName(quote.nome_cliente);
    setDate(new Date(quote.data).toISOString().substring(0, 10));
    setSaleType(quote.tipo_venda);
    setItems(
      quote.items.map((item) => ({
        productId: item.productId,
        printerId: item.printerId || '',
        quantidade: item.quantidade,
        preco_unitario: formatDecimalInput(item.preco_unitario),
      })),
    );
  };

  const handleCancelEdit = () => {
    setError(null);
    setSuccess(null);
    resetForm();
  };

  const handleDownloadPdf = async (quote: Quote) => {
    setError(null);

    if (!quote.tipo_venda) {
      setError('Selecione uma modalidade de venda e salve o orçamento antes de exportar o PDF.');
      return;
    }

    try {
      const response = await api.get(`/quotes/${quote.id}/pdf`, {
        responseType: 'blob',
      });

      const pdfUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = window.document.createElement('a');
      link.href = pdfUrl;
      link.download = `quote-${quote.id}.pdf`;
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(pdfUrl);
    } catch (requestError: any) {
      if (requestError?.response?.data instanceof Blob) {
        try {
          const errorPayload = JSON.parse(await requestError.response.data.text());
          setError(errorPayload?.error || 'Erro ao exportar orçamento em PDF.');
          return;
        } catch {
          setError('Erro ao exportar orçamento em PDF.');
          return;
        }
      }

      setError(requestError?.response?.data?.error || 'Erro ao exportar orçamento em PDF.');
    }
  };

  return (
    <div>
      <Loading isLoading={isLoading} label="Processando orçamento..." />
      
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Orçamentos</h1>
          <p className="mt-2 text-slate-600">Monte orçamentos profissionais e exporte em PDF.</p>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      {editingQuoteId ? (
        <div className="mb-6 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
          Editando orçamento existente. Ajuste cliente, data e itens antes de salvar.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-700">
            Nome do cliente
            <input value={clientName} onChange={(e) => setClientName(e.target.value)} className="form-control" required />
          </label>
          <label className="space-y-2 text-sm text-slate-700">
            Data
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="form-control" required />
          </label>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Modalidade de venda</p>
              <p className="text-sm text-slate-500">Selecione a opção antes de gerar o orçamento ou exportar em PDF.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {SALE_TYPE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition ${saleType === option.value ? 'border-cyan-400 bg-cyan-50 text-cyan-900' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
                >
                  <input
                    type="radio"
                    name="saleType"
                    value={option.value}
                    checked={saleType === option.value}
                    onChange={(event) => {
                      const nextSaleType = event.target.value as QuoteSaleType;
                      setSaleType(nextSaleType);
                      setItems((prev) => prev.map((item) => {
                        const product = products.find((entry) => entry.id === item.productId);
                        const printer = printers.find((entry) => entry.id === item.printerId);

                        return {
                          ...item,
                          preco_unitario: buildDisplayUnitPrice(product, printer),
                        };
                      }));
                    }}
                    className="h-4 w-4"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-600">
            <span>Margem selecionada: <strong className="text-slate-900">{selectedMarginPercent !== null ? `${selectedMarginPercent.toFixed(2)}%` : 'Nao selecionada'}</strong></span>
            <span>Custo total de producao: <strong className="text-slate-900">{formatCurrency(formTotalCost)}</strong></span>
            <span>Total atual do orçamento: <strong className="text-slate-900">{formatCurrency(formTotalSale)}</strong></span>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-4 shadow-sm">
          <div className="grid grid-cols-12 gap-4 border-b border-slate-200 pb-3 text-sm font-semibold text-slate-500">
            <span className="col-span-4">Produto</span>
            <span className="col-span-3">Impressora</span>
            <span className="col-span-2 text-right">Qtd</span>
            <span className="col-span-2 text-right">Preço unitário</span>
            <span className="col-span-1 text-right">Subtotal</span>
          </div>
          <div className="space-y-3 py-4">
            {items.map((item, index) => {
              const product = products.find((product) => product.id === item.productId);
              const printer = printers.find((printer) => printer.id === item.printerId);
              const subtotal = Number(item.quantidade || 0) * (parseDecimalInput(item.preco_unitario) || 0);
              return (
                <div key={index} className="grid grid-cols-12 gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-sm text-slate-700">
                  <select
                    className="form-control col-span-4"
                    value={item.productId}
                    onChange={(e) => {
                      const product = products.find((product) => product.id === e.target.value);
                      const nextPrinterId = item.printerId || '';
                      const nextPrinter = printers.find((printer) => printer.id === nextPrinterId);
                      updateItem(index, {
                        productId: e.target.value,
                        printerId: nextPrinterId,
                        preco_unitario: product && nextPrinter
                          ? buildDisplayUnitPrice(product, nextPrinter)
                          : formatDecimalInput(product?.custo_total || parseDecimalInput(item.preco_unitario) || 0),
                      });
                    }}
                    required
                  >
                    <option value="">Escolher produto</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.sku} • {formatCurrency(product.custo_total)}
                      </option>
                    ))}
                  </select>
                  <select
                    className="form-control col-span-3"
                    value={item.printerId}
                    onChange={(e) => {
                      const nextPrinter = printers.find((printer) => printer.id === e.target.value);
                      updateItem(index, {
                        printerId: e.target.value,
                        preco_unitario: product && nextPrinter
                          ? buildDisplayUnitPrice(product, nextPrinter)
                          : formatDecimalInput(parseDecimalInput(item.preco_unitario) || 0),
                      });
                    }}
                    required
                  >
                    <option value="">Escolher impressora</option>
                    {printers.map((printer) => (
                      <option key={printer.id} value={printer.id}>
                        {printer.nome}
                      </option>
                    ))}
                  </select>
                  <input
                    className="form-control col-span-2 text-right"
                    type="number"
                    min="1"
                    value={item.quantidade}
                    onChange={(e) => updateItem(index, { quantidade: parseNumberInputValue(e.target.value) })}
                    required
                  />
                  <input
                    className="form-control col-span-2 text-right read-only:bg-slate-100 read-only:text-slate-500"
                    type="text"
                    inputMode="decimal"
                    value={item.preco_unitario}
                    onChange={(e) => updateItem(index, { preco_unitario: e.target.value })}
                    onBlur={() => {
                      const parsedValue = parseDecimalInput(item.preco_unitario);

                      if (Number.isFinite(parsedValue)) {
                        updateItem(index, { preco_unitario: formatDecimalInput(parsedValue) });
                      }
                    }}
                    readOnly={Boolean(item.printerId)}
                    required
                  />
                  <div className="col-span-1 text-right text-slate-900">{formatCurrency(subtotal)}</div>
                  <div className="col-span-12 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                    <span>
                      {printer ? `Cálculo interno com a impressora ${printer.nome}.` : 'Selecione a impressora para recalcular o valor do item.'}
                    </span>
                    <div className="flex items-center gap-3">
                      {product ? <span>Falhas aplicadas: {product.falha_percentual.toFixed(1)}%</span> : null}
                      {items.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="rounded-xl border border-rose-200 px-3 py-1 font-medium text-rose-700 transition hover:bg-rose-50"
                        >
                          Remover item
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <button type="button" onClick={addItem} className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">
            + Adicionar item
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="submit" className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
            {editingQuoteId ? 'Salvar alterações' : 'Gerar orçamento'}
          </button>
          {editingQuoteId ? (
            <button type="button" onClick={handleCancelEdit} className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
              Cancelar edição
            </button>
          ) : null}
        </div>
      </form>

      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <label className="flex-1 space-y-2 text-sm text-slate-700">
            Filtrar por cliente
            <input
              value={clientFilter}
              onChange={(event) => setClientFilter(event.target.value)}
              className="form-control"
              placeholder="Digite o nome do cliente"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-700">
            Data inicial
            <input
              type="date"
              value={startDateFilter}
              onChange={(event) => setStartDateFilter(event.target.value)}
              className="form-control"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-700">
            Data final
            <input
              type="date"
              value={endDateFilter}
              onChange={(event) => setEndDateFilter(event.target.value)}
              className="form-control"
            />
          </label>
          <button
            type="button"
            onClick={() => {
              setClientFilter('');
              setStartDateFilter('');
              setEndDateFilter('');
            }}
            className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Limpar filtros
          </button>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        {paginatedQuotes.map((quote) => (
          <div
            key={quote.id}
            className={`overflow-hidden rounded-3xl border shadow-sm transition ${highlightedQuoteId === quote.id ? 'border-cyan-300 bg-cyan-50/40 shadow-cyan-100' : 'border-slate-200 bg-white'}`}
          >
            <button
              type="button"
              onClick={() => setExpandedQuoteId((currentId) => (currentId === quote.id ? null : quote.id))}
              className={`flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition ${highlightedQuoteId === quote.id ? 'hover:bg-cyan-50/70' : 'hover:bg-slate-50'}`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <p className="text-lg font-semibold text-slate-900">{quote.nome_cliente}</p>
                  <p className="text-sm text-slate-500">{new Date(quote.data).toLocaleDateString()}</p>
                  <p className="text-sm text-slate-500">{quote.summary.items.length} item(ns)</p>
                  {highlightedQuoteId === quote.id ? (
                    <span className="inline-flex items-center rounded-full border border-cyan-200 bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-800">
                      Ultimo orçamento
                    </span>
                  ) : null}
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${saleTypeBadgeClass(quote.summary.selectedSaleType)}`}>
                    {quote.summary.selectedSaleTypeLabel}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Total do orçamento: <span className="font-medium text-slate-900">{formatCurrency(quote.valor_total)}</span>
                </p>
              </div>
              <svg
                viewBox="0 0 24 24"
                className={`h-5 w-5 shrink-0 text-slate-500 transition-transform ${expandedQuoteId === quote.id ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {expandedQuoteId === quote.id ? (
              <div className="border-t border-slate-200 px-6 py-5">
                <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                  <button
                    type="button"
                    onClick={() => handleEdit(quote)}
                    className="rounded-full border border-cyan-200 px-4 py-2 font-medium text-cyan-700 hover:bg-cyan-50"
                  >
                    Editar orçamento
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadPdf(quote)}
                    className="rounded-full bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
                  >
                    Baixar PDF
                  </button>
                </div>

                <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/50">
                  <div className="grid grid-cols-[1.4fr_0.6fr_1fr_0.8fr_0.8fr] gap-4 px-5 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    <span>Produto</span>
                    <span>Qtd</span>
                    <span>Impressora</span>
                    <span className="text-right">Custo unitário</span>
                    <span className="text-right">Subtotal</span>
                  </div>
                  <div className="divide-y divide-slate-200 bg-white">
                    {quote.summary.items.map((item) => (
                      <div key={`${quote.id}-${item.productId}-${item.printerId || 'sem-printer'}`} className="grid grid-cols-[1.4fr_0.6fr_1fr_0.8fr_0.8fr] gap-4 px-5 py-4 text-sm text-slate-700">
                        <div>
                          <p className="font-medium text-slate-900">{item.productName}</p>
                          <p className="text-xs text-slate-500">{item.productSku}</p>
                        </div>
                        <span>{item.quantity}</span>
                        <span>{item.printerName || 'Nao informada'}</span>
                        <span className="text-right">{formatCurrency(item.unitCost)}</span>
                        <span className="text-right font-medium text-slate-900">{formatCurrency(item.subtotalCost)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span>Custo base: <span className="font-medium text-slate-900">{formatCurrency(quote.summary.totalCost)}</span></span>
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${saleTypeBadgeClass(quote.summary.selectedSaleType)}`}>
                    {quote.summary.selectedSaleTypeLabel}
                  </span>
                  <span>Total final: <span className="font-medium text-slate-900">{formatCurrency(quote.valor_total)}</span></span>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-3">
                  {quote.summary.pricingOptions.map((option) => (
                    <div key={option.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">{option.label}</p>
                      <p className="mt-1 text-xs text-slate-500">Margem: {option.marginPercent.toFixed(2)}%</p>
                      <p className={`mt-3 text-xl font-semibold ${quote.summary.selectedSaleType === option.id ? 'text-cyan-700' : 'text-slate-900'}`}>{formatCurrency(option.finalPrice)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {!filteredQuotes.length ? (
        <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
          Nenhum orçamento encontrado para os filtros informados.
        </div>
      ) : null}

      {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
    </div>
  );
}
