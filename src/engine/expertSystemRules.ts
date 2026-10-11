import type { AnalysisConfig, Institution, RuleResult, Sector, SectorClassification, SectorStatus } from '../types';
import { buildCoverageBuffer, getSelectedInstitutions, measureOverlap } from './spatialEngine';

export type RuleId = 'REGLA_A' | 'REGLA_B' | 'REGLA_C';

export interface ExpertRule {
  id: RuleId;
  name: string;
  description: string;
  formula: string;
}

export const EXPERT_RULES: readonly ExpertRule[] = [
  {
    id: 'REGLA_A',
    name: 'REGLA A · Buffer de cobertura',
    description:
      'Crear un área de amortiguamiento (buffer circular) con radio R (km) alrededor de la(s) institución(es) seleccionada(s).',
    formula: 'Buffer circular · unidades: kilómetros · resolución determinista.',
  },
  {
    id: 'REGLA_B',
    name: 'REGLA B · Solapamiento por sector',
    description: 'Para cada sector (polígono GeoJSON), calcular el porcentaje de solapamiento con el buffer de cobertura.',
    formula: '% solapamiento = (Área de intersección) / (Área del sector) × 100',
  },
  {
    id: 'REGLA_C',
    name: 'REGLA C · Clasificación determinista',
    description:
      'Clasificar el estado del sector según umbrales fijos, sin heurísticas probabilísticas.',
    formula: '0% == PUNTO_CIEGO · 0% < x < 80% == PARCIAL · >= 80% == CUBIERTO',
  },
] as const;

export const THRESHOLDS = {
  BLIND: 0,
  COVERED: 80,
} as const;

export function classifySector(overlapPercentage: number): SectorStatus {
  if (overlapPercentage <= 0) {
    return 'PUNTO_CIEGO';
  }
  if (overlapPercentage >= THRESHOLDS.COVERED) {
    return 'CUBIERTO';
  }
  return 'PARCIAL';
}

export function runExpertAnalysis(
  config: AnalysisConfig,
  institutions: Institution[],
  sectors: Sector[],
): RuleResult {
  const selectedInstitutions = getSelectedInstitutions(config, institutions);
  const buffer = buildCoverageBuffer(selectedInstitutions, config.radiusKm);

  // Pase único: clasificación (REGLA B y C) y % de cobertura global en la misma iteración
  const classifications: SectorClassification[] = [];
  let totalArea = 0;
  let coveredArea = 0;

  for (const sector of sectors) {
    const measurement = measureOverlap(sector, buffer);
    const status = classifySector(measurement.overlapPercentage);

    totalArea += measurement.sectorArea;
    coveredArea += measurement.coveredArea;

    classifications.push({
      sector: {
        ...sector,
        status,
      },
      status,
      overlapPercentage: measurement.overlapPercentage,
    });
  }

  const coveredSectors = classifications
    .filter((c) => c.status === 'CUBIERTO')
    .map((c) => c.sector);

  const partialSectors = classifications
    .filter((c) => c.status === 'PARCIAL')
    .map((c) => c.sector);

  const blindSpots = classifications
    .filter((c) => c.status === 'PUNTO_CIEGO')
    .map((c) => c.sector);

  let coveragePercentage = 0;
  if (totalArea > 0) {
    const pct = (coveredArea / totalArea) * 100;
    coveragePercentage = pct <= 0 ? 0 : pct >= 100 ? 100 : Math.round(pct * 100) / 100;
  }

  return {
    coveredSectors,
    blindSpots,
    partialSectors,
    coveragePercentage,
    classifications,
  };
}