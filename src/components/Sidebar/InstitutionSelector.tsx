import { useAnalysis } from '../../context/AnalysisContext';
import { institutions } from '../../data/institutions';

export function InstitutionSelector() {
  const { config, setSelectedInstitutionId } = useAnalysis();

  const universities = institutions.filter((i) => i.type === 'Universidad');
  const institutes = institutions.filter((i) => i.type === 'Instituto');

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (value === 'ALL') {
      setSelectedInstitutionId('ALL');
      return;
    }
    setSelectedInstitutionId(value);
  };

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900">Universidad o instituto</h2>
        <span className="text-[11px] text-slate-500">{institutions.length} disponibles</span>
      </div>
      <label className="block text-sm text-slate-700" htmlFor="institution-select">
        ¿Cuál quiere revisar?
      </label>
      <select
        id="institution-select"
        value={config.selectedInstitutionId}
        onChange={handleChange}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      >
        <option value="ALL">Todas las instituciones ({institutions.length})</option>
        <optgroup label="Universidades ({universities.length})">
          {universities.map((inst) => (
            <option key={inst.id} value={inst.id}>
              {inst.name}
            </option>
          ))}
        </optgroup>
        <optgroup label="Institutos ({institutes.length})">
          {institutes.map((inst) => (
            <option key={inst.id} value={inst.id}>
              {inst.name}
            </option>
          ))}
        </optgroup>
      </select>
      <p className="text-xs leading-relaxed text-slate-500">
        Deje <strong>"Todas las instituciones"</strong> para ver la cobertura completa de la ciudad. Si elige una
        sola, verá solo su área de influencia.
      </p>
    </section>
  );
}