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
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_200px]">
        <label className="block min-w-0">
          <select
            aria-label="Impressora"
            value={selectedPrinterId}
            onChange={(event) => onChange(event.target.value)}
            className="min-h-[60px] w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-base font-semibold text-white outline-none transition focus:border-cyan-400/40 focus:bg-cyan-400/[0.05]"
          >
            <option value="">Selecione uma impressora</option>
            {printers.map((printer) => (
              <option key={printer.id} value={printer.id}>
                {printer.nome}
              </option>
            ))}
          </select>
        </label>

        <div className="flex min-h-[60px] flex-col justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Consumo</p>
          <p className="mt-1 text-lg font-semibold text-cyan-200">{selectedPrinter ? `${selectedPrinter.consumo_watts} W` : '--'}</p>
        </div>
      </div>
    </div>
  );
}