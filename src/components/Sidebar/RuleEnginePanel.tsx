import { EXPERT_RULES, THRESHOLDS } from '../../engine/expertSystemRules';

export function RuleEnginePanel() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <details>
        <summary className="cursor-pointer text-sm font-semibold text-slate-900">
          ¿Cómo se calcula? (detalles técnicos)
        </summary>
        <div className="mt-3 space-y-2 text-xs text-slate-600">
          {EXPERT_RULES.map((rule) => (
            <article key={rule.id} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
              <header className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">{rule.name}</span>
                <span className="text-[11px] uppercase tracking-wide text-slate-500">{rule.id}</span>
              </header>
              <p className="mt-1 leading-relaxed">{rule.description}</p>
              <p className="mt-1 text-[11px] italic text-slate-500">{rule.formula}</p>
            </article>
          ))}
          <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-2 text-[11px] text-indigo-700">
            <p className="font-semibold">Umbrales fijos (sin IA probabilística)</p>
            <ul className="mt-1 space-y-0.5">
              <li>• Intersección == 0% → PUNTO_CIEGO</li>
              <li>• 0% &lt; Intersección &lt; {THRESHOLDS.COVERED}% → PARCIAL</li>
              <li>• Intersección ≥ {THRESHOLDS.COVERED}% → CUBIERTO</li>
            </ul>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500">
            El análisis cubre el área urbana de <strong>Maracaibo + San Francisco</strong>. Quedan
            fuera el Lago de Maracaibo, las lagunas/canales y los municipios vecinos: esas zonas
            no se pintan en rojo porque no son «sectores sin universidad».
          </p>
        </div>
      </details>
    </section>
  );
}