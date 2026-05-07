import { Printer } from '../types';

interface PrinterSelectorProps {
  printers: Printer[];
  selectedPrinterId: string;
  onChange: (printerId: string) => void;
}

export function PrinterSelector({ printers, selectedPrinterId, onChange }: PrinterSelectorProps) {
  const selectedPrinter = printers.find((printer) => printer.id === selectedPrinterId) || null;

  return (
    <div className="rounded-[28px] border border-white/10 bg-[#0a1228]/78 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <label className="block min-w-0 flex-1">
          <span className="mb-2 block text-sm font-medium text-slate-200">Impressora</span>
          <select
            value={selectedPrinterId}
            onChange={(event) => onChange(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-[#081120] p-3 text-white"
          >
            <option value="">Selecione uma impressora</option>
            {printers.map((printer) => (
              <option key={printer.id} value={printer.id}>
                {printer.nome}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 md:min-w-[160px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Consumo</p>
          <p className="mt-1 text-lg font-semibold text-cyan-200">{selectedPrinter ? `${selectedPrinter.consumo_watts} W` : '--'}</p>
        </div>
      </div>
    </div>
  );
}