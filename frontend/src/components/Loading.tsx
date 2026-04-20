interface LoadingProps {
  isLoading: boolean;
  label?: string;
}

export function Loading({ isLoading, label = 'Carregando...' }: LoadingProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="rounded-3xl bg-white p-6 shadow-xl">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"></div>
          <p className="text-sm font-medium text-slate-700">{label}</p>
        </div>
      </div>
    </div>
  );
}
