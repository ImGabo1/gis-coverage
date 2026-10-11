import { useAnalysis } from '../../context/AnalysisContext';

export function RadiusSlider() {
  const { config, setRadiusKm, selectedInstitutions } = useAnalysis();
  const radius = config.radiusKm;

  const activeCircles = selectedInstitutions.length;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900">¿A cuántos kilómetros?</h2>
        <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-sm font-bold text-indigo-700">
          {radius.toFixed(1)} km
        </span>
      </div>
      <div>
        <label className="sr-only" htmlFor="radius-slider">
          Ajustar radio en kilómetros (1 a 10)
        </label>
        <input
          id="radius-slider"
          type="range"
          min={1}
          max={10}
          step={0.5}
          value={radius}
          onChange={(e) => setRadiusKm(Number(e.target.value))}
          className="w-full accent-indigo-600"
        />
        <div className="mt-1 flex justify-between text-xs text-slate-500">
          <span>1 km (muy cerca)</span>
          <span>10 km (muy lejos)</span>
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
        <p>
          Instituciones marcadas: <span className="font-semibold text-slate-900">{activeCircles}</span>
        </p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Mueva la regla para ampliar o reducir la distancia. Todo lo que esté dentro de los círculos se considera
          "con cobertura"; lo que queda fuera se marca en <strong className="text-red-600">rojo</strong>.
        </p>
      </div>
    </section>
  );
}