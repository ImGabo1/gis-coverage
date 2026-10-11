import { useAnalysis } from '../../context/AnalysisContext';
import { SECTOR_STATUS_META, STATUS_ORDER } from '../../constants/statusMeta';
import type { SectorStatus } from '../../types';

const STATUS_KEYS: SectorStatus[] = ['CUBIERTO', 'PARCIAL', 'PUNTO_CIEGO'];

function formatPct(value: number): string {
  if (value <= 0) {
    return '0.0';
  }
  if (value >= 100) {
    return '100.0';
  }
  return value.toFixed(1);
}

export function CoverageReport() {
  const { result, classificationById, selectedSectorId, setSelectedSectorId, config } = useAnalysis();

  const counts = {
    CUBIERTO: result.coveredSectors.length,
    PARCIAL: result.partialSectors.length,
    PUNTO_CIEGO: result.blindSpots.length,
  };

  const total = result.classifications.length;

  const orderedClassifications = [...result.classifications].sort((a, b) => {
    const aOrder = STATUS_ORDER.indexOf(a.status);
    const bOrder = STATUS_ORDER.indexOf(b.status);
    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }
    if (a.overlapPercentage !== b.overlapPercentage) {
      return a.overlapPercentage - b.overlapPercentage;
    }
    return a.sector.name.localeCompare(b.sector.name, 'es');
  });

  const pct = result.coveragePercentage;

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-base font-bold text-slate-900">¿Dónde NO hay universidades?</h2>
        <p className="text-xs text-slate-500">Resumen del análisis · radio de {config.radiusKm.toFixed(1)} km</p>
      </header>

      {/* Mensaje principal en palabras simples */}
      <div className="rounded-xl border-2 border-red-200 bg-red-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Sectores en ROJO</p>
        <p className="mt-1 text-3xl font-extrabold leading-none text-red-600">{counts.PUNTO_CIEGO}</p>
        <p className="mt-1.5 text-sm font-medium leading-snug text-red-800">
          sectores <strong>sin ninguna universidad ni instituto</strong> cerca.
        </p>
        <p className="mt-1 text-xs text-red-700/80">
          De un total de <strong>{total}</strong> sectores analizados en esta zona.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {STATUS_KEYS.map((key) => {
          const meta = SECTOR_STATUS_META[key];
          const count = counts[key];
          return (
            <article key={key} className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${meta.dotClass}`} />
                <span className="text-[11px] font-medium leading-tight text-slate-600">{meta.label}</span>
              </div>
              <p className="mt-1 text-xl font-bold text-slate-900">{count}</p>
              <p className="text-[10px] text-slate-500">sectores</p>
            </article>
          );
        })}
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700">Zona cubierta en general</span>
          <span className="font-bold text-slate-900">{formatPct(pct)}%</span>
        </div>
        <div className="mt-2 h-3 rounded-full bg-slate-200">
          <div
            className="h-3 rounded-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${Math.max(4, pct)}%` }}
          />
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          Porcentaje del territorio que está dentro del radio de cobertura de las instituciones seleccionadas.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-200 px-3 py-2">
          <h3 className="text-sm font-bold text-slate-900">Lista de sectores</h3>
          <p className="text-[11px] text-slate-500">
            Los sectores <strong className="text-red-600">sin universidad</strong> aparecen primero. Toque uno para
            verlo en el mapa.
          </p>
        </header>
        <ul className="scrollbar-thin max-h-[340px] space-y-1 overflow-y-auto px-2 py-2">
          {orderedClassifications.map((cls) => {
            const id = cls.sector.id;
            const meta = SECTOR_STATUS_META[cls.status];
            const isSelected = selectedSectorId === id;
            const className = classificationById[id];
            const overlap = className?.overlapPercentage ?? cls.overlapPercentage;

            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => setSelectedSectorId(isSelected ? null : id)}
                  className={`group flex w-full items-start justify-between gap-2 rounded-lg border px-2.5 py-2 text-left transition ${
                    isSelected
                      ? 'border-indigo-300 bg-indigo-50 ring-2 ring-indigo-200'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex min-w-0 flex-1 items-start gap-2">
                    <span className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${meta.dotClass}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{cls.sector.name}</p>
                      <p className="text-[11px] text-slate-400">Celda {id.replace('SEC-', '').replace('-', ' de ')}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${meta.badgeClass}`}>
                      {meta.label}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">{formatPct(overlap)}% cubierto</span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
