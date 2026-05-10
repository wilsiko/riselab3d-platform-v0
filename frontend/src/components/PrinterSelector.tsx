import { Printer } from '../types';

interface PrinterSelectorProps {
  printers: Printer[];
  selectedPrinterId: string;
  onChange: (printerId: string) => void;
}

export function PrinterSelector({ printers, selectedPrinterId, onChange }: PrinterSelectorProps) {
  const selectedPrinter = printers.find((printer) => printer.id === selectedPrinterId) || null;

  return (
    <div className="rounded-[28px] border border-white/10 bg-[#0a1228]/78 p-5 shadow-[0_16px_50px_rgba(0,0,0,0.18)]">
      <div className="space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Impressora</p>

        <label className="relative block min-w-0">
          <select
            aria-label="Impressora"
            value={selectedPrinterId}
            onChange={(event) => onChange(event.target.value)}
            className="min-h-[68px] w-full appearance-none rounded-[24px] border border-white/10 bg-white/[0.04] px-5 pr-14 text-base font-semibold text-white outline-none transition focus:border-cyan-400/40 focus:bg-cyan-400/[0.05]"
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
      </div>
    </div>
  );
}