import { useAnalysis } from '../../context/AnalysisContext';

export function Header() {
  const { config, result, selectedInstitutions } = useAnalysis();
  const institutionLabel =
    config.selectedInstitutionId === 'ALL'
      ? 'Todas las instituciones'
      : selectedInstitutions[0]?.name ?? '—';

  const formattedPct = result.coveragePercentage.toFixed(1);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:px-6">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white shadow-sm">
          <CompassIcon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-slate-900 lg:text-base">
            ¿Dónde hay universidades en Maracaibo?
          </h1>
          <p className="text-[11px] text-slate-500 lg:text-xs">
            Mapa de cobertura educativa · Maracaibo + San Francisco, Estado Zulia
          </p>
        </div>
      </div>
      <div className="hidden items-center gap-2 md:flex">
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
          Radio: {config.radiusKm.toFixed(1)} km
        </span>
        <span className="max-w-[320px] truncate rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
          {institutionLabel}
        </span>
        <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
          Zona cubierta: {formattedPct}%
        </span>
      </div>
    </header>
  );
}

function CompassIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="2.5" />
      <path d="M20.6 11.4a8.6 8.6 0 0 0-7-7 1 1 0 0 0-1.2 1.2 6.6 6.6 0 0 1-4.4 4.4 1 1 0 0 0-1.2 1.2 8.6 8.6 0 0 0 7 7 1 1 0 0 0 1.2-1.2 6.6 6.6 0 0 1 4.4-4.4 1 1 0 0 0 1.2-1.2Zm-8.6 4.6a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z" />
    </svg>
  );
}