import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { institutions as baseInstitutions } from '../data/institutions';
import { sectors, sectorsFeatureCollection } from '../data/sectorsGeoJSON';
import type { AnalysisConfig, Institution, InstitutionSelection, RuleResult, SectorClassification } from '../types';
import { runExpertAnalysis } from '../engine/expertSystemRules';

export interface AnalysisContextValue {
  institutions: Institution[];
  sectors: typeof sectors;
  sectorsFeatureCollection: typeof sectorsFeatureCollection;
  config: AnalysisConfig;
  setSelectedInstitutionId: (id: InstitutionSelection) => void;
  setRadiusKm: (km: number) => void;
  result: RuleResult;
  classificationById: Record<string, SectorClassification>;
  selectedSectorId: string | null;
  setSelectedSectorId: (id: string | null) => void;
  selectedInstitutions: Institution[];
}

const DEFAULT_CONFIG: AnalysisConfig = {
  selectedInstitutionId: 'ALL',
  radiusKm: 3,
};

const AnalysisContext = createContext<AnalysisContextValue | null>(null);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AnalysisConfig>(DEFAULT_CONFIG);
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null);

  const result = useMemo(
    () => runExpertAnalysis(config, baseInstitutions, sectors),
    [config],
  );

  const classificationById = useMemo(() => {
    const map: Record<string, SectorClassification> = {};
    for (const c of result.classifications) {
      map[c.sector.id] = c;
    }
    return map;
  }, [result.classifications]);

  const selectedInstitutions = useMemo(() => {
    if (config.selectedInstitutionId === 'ALL') {
      return baseInstitutions;
    }
    const found = baseInstitutions.find((i) => i.id === config.selectedInstitutionId);
    return found ? [found] : [];
  }, [config.selectedInstitutionId]);

  const setSelectedInstitutionId = (id: InstitutionSelection) => {
    setConfig((prev) => ({ ...prev, selectedInstitutionId: id }));
    setSelectedSectorId(null);
  };

  const setRadiusKm = (km: number) => {
    const clamped = Math.min(10, Math.max(1, Number.isFinite(km) ? km : DEFAULT_CONFIG.radiusKm));
    setConfig((prev) => ({ ...prev, radiusKm: Math.round(clamped * 10) / 10 }));
    setSelectedSectorId(null);
  };

  const value: AnalysisContextValue = {
    institutions: baseInstitutions,
    sectors,
    sectorsFeatureCollection,
    config,
    setSelectedInstitutionId,
    setRadiusKm,
    result,
    classificationById,
    selectedSectorId,
    setSelectedSectorId,
    selectedInstitutions,
  };

  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>;
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) {
    throw new Error('useAnalysis debe usarse dentro de AnalysisProvider');
  }
  return ctx;
}
