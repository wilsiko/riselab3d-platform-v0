import { Filament } from '../types';

interface MaterialSelectorProps {
  materials: Filament[];
  selectedMaterialId: string;
  onChange: (materialId: string) => void;
}

export function MaterialSelector({ materials, selectedMaterialId, onChange }: MaterialSelectorProps) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-slate-200">Material</p>
        <p className="text-sm text-slate-400">Filtre a biblioteca pelo material dominante do job.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <button
          type="button"
          onClick={() => onChange('')}
          className={`rounded-[26px] border p-4 text-left transition ${
            selectedMaterialId === ''
              ? 'border-teal-400/40 bg-teal-400/10 text-white'
              : 'border-white/10 bg-[#0a1228]/80 text-slate-300 hover:bg-white/[0.06]'
          }`}
        >
          <p className="text-sm font-semibold">Todos os materiais</p>
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">Biblioteca completa</p>
        </button>

        {materials.map((material) => (
          <button
            key={material.id}
            type="button"
            onClick={() => onChange(material.id)}
            className={`rounded-[26px] border p-4 text-left transition ${
              selectedMaterialId === material.id
                ? 'border-teal-400/40 bg-teal-400/10 text-white'
                : 'border-white/10 bg-[#0a1228]/80 text-slate-300 hover:bg-white/[0.06]'
            }`}
          >
            <p className="text-sm font-semibold">{material.tipo}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">{material.marca}</p>
          </button>
        ))}
      </div>
    </div>
  );
}