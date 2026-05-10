import { Printer } from '../types';

interface PrinterSelectorProps {
  printers: Printer[];
  selectedPrinterId: string;
  onChange: (printerId: string) => void;
  error?: string;
  required?: boolean;
}

export function PrinterSelector({ printers, selectedPrinterId, onChange, error, required = false }: PrinterSelectorProps) {
  const selectedPrinter = printers.find((printer) => printer.id === selectedPrinterId) || null;

  return (
    <div className={`rounded-[28px] border bg-[#0a1228]/78 p-5 shadow-[0_16px_50px_rgba(0,0,0,0.18)] ${error ? 'border-red-400/60' : 'border-white/10'}`}>
      <div className="space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          Impressora
          {required ? <span className="ml-1 text-red-300">*</span> : null}
        </p>

        <label className="relative block min-w-0">
          <select
            id="quote-printer"
            aria-label="Impressora"
            value={selectedPrinterId}
            onChange={(event) => onChange(event.target.value)}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? 'quote-printer-error' : undefined}
            className={`min-h-[68px] w-full appearance-none rounded-[24px] border bg-white/[0.04] px-5 pr-14 text-base font-semibold text-white outline-none transition focus:bg-cyan-400/[0.05] ${error ? 'border-red-400/60 focus:border-red-400/70' : 'border-white/10 focus:border-cyan-400/40'}`}
          >
            <option value="">Selecione uma impressora</option>
            {printers.map((printer) => (
              <option key={printer.id} value={printer.id}>
                {printer.nome}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-5 flex items-center text-slate-400">
            <svg width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M1 1.25L7 6.25L13 1.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </label>

        <div className="flex min-h-[60px] items-center justify-between gap-4 rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Consumo em watts</p>
          <div className="min-w-[96px] whitespace-nowrap rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-center text-sm font-semibold text-cyan-200">
            {selectedPrinter ? `${selectedPrinter.consumo_watts} W` : '--'}
          </div>
        </div>

        {error ? <p id="quote-printer-error" className="text-sm leading-5 text-red-300">{error}</p> : null}
      </div>
    </div>
  );
}