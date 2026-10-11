// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as turf from '@turf/turf';
import type { Feature, MultiPolygon, Polygon } from 'geojson';
import type { AnalysisConfig, Institution, LatLng, Sector } from '../types';

export type CoverageBufferFeature = Feature<Polygon | MultiPolygon>;

export function getSelectedInstitutions(config: AnalysisConfig, institutions: Institution[]): Institution[] {
  if (config.selectedInstitutionId === 'ALL') {
    return institutions;
  }
  const found = institutions.find((i) => i.id === config.selectedInstitutionId);
  return found ? [found] : [];
}

export function toPolygonFeature(sector: Sector): Feature<Polygon> {
  return turf.polygon(sector.geometry.coordinates, {
    id: sector.id,
    name: sector.name,
  });
}

export function mergeBuffers(buffers: CoverageBufferFeature[]): CoverageBufferFeature | null {
  if (buffers.length === 0) {
    return null;
  }
  if (buffers.length === 1) {
    return buffers[0];
  }

  let merged = buffers[0];
  for (let i = 1; i < buffers.length; i++) {
    const next = buffers[i];
    try {
      // turf.union fusiona los polígonos de cobertura (existe en turf 6.5)
      const unionRes = (turf as any).union?.(merged, next);
      if (unionRes && unionRes.type === 'Feature') {
        merged = unionRes as CoverageBufferFeature;
        continue;
      }
    } catch (error) {
      // Silenciar error
    }
    try {
      const intersectRes = (turf as any).intersect?.(merged, next);
      if (intersectRes && intersectRes.type === 'Feature') {
        merged = intersectRes as CoverageBufferFeature;
        continue;
      }
    } catch {
      // Ignorar
    }
  }

  return merged;
}

export function buildCoverageBuffer(institutions: Institution[], radiusKm: number): CoverageBufferFeature | null {
  if (institutions.length === 0 || radiusKm <= 0) {
    return null;
  }

  const buffers = institutions
    .map((inst) =>
      turf.circle([inst.coordinates.lng, inst.coordinates.lat], radiusKm, {
        units: 'kilometers',
        steps: 96,
      }),
    )
    .filter((b) => b && b.type === 'Feature') as CoverageBufferFeature[];

  return mergeBuffers(buffers);
}

export interface OverlapMeasurement {
  /** % de solapamiento sector ∩ buffer, redondeado a 2 decimales (0–100) */
  overlapPercentage: number;
  /** Área del sector en m² (0 si no hay buffer o geometría inválida) */
  sectorArea: number;
  /** Área cubierta en m² (≤ sectorArea) */
  coveredArea: number;
}

/**
 * Mide solapamiento y acumula áreas en una sola pasada por sector.
 * Optimización: una única llamada a turf.intersect por sector, en lugar de
 * recorrer los sectores dos veces (clasificación + % de cobertura global).
 */
export function measureOverlap(sector: Sector, buffer: CoverageBufferFeature | null): OverlapMeasurement {
  if (!buffer) {
    return { overlapPercentage: 0, sectorArea: 0, coveredArea: 0 };
  }

  const sectorFeature = toPolygonFeature(sector);
  const sectorArea = turf.area(sectorFeature);
  if (sectorArea <= 0) {
    return { overlapPercentage: 0, sectorArea: 0, coveredArea: 0 };
  }

  try {
    const inter = turf.intersect(sectorFeature as any, buffer as any);
    if (!inter || inter.type !== 'Feature') {
      return { overlapPercentage: 0, sectorArea, coveredArea: 0 };
    }
    const coveredArea = turf.area(inter);
    if (coveredArea <= 0) {
      return { overlapPercentage: 0, sectorArea, coveredArea: 0 };
    }

    const pct = (coveredArea / sectorArea) * 100;
    const overlapPercentage =
      pct >= 100 ? 100 : pct <= 0 ? 0 : Math.round(pct * 100) / 100;

    return {
      overlapPercentage,
      sectorArea,
      coveredArea: Math.min(coveredArea, sectorArea),
    };
  } catch {
    return { overlapPercentage: 0, sectorArea, coveredArea: 0 };
  }
}

export function intersectionAreaPercentage(sector: Sector, buffer: CoverageBufferFeature | null): number {
  return measureOverlap(sector, buffer).overlapPercentage;
}

export function computeCoverageAreaPercentage(sectors: Sector[], buffer: CoverageBufferFeature | null): number {
  if (!buffer || sectors.length === 0) {
    return 0;
  }

  let totalArea = 0;
  let coveredArea = 0;

  for (const sector of sectors) {
    const sectorFeature = toPolygonFeature(sector);
    const area = turf.area(sectorFeature);
    if (area <= 0) {
      continue;
    }
    totalArea += area;
    try {
      const inter = (turf as any).intersect?.(sectorFeature, buffer);
      if (!inter) continue;
      if (inter && inter.type === 'Feature') {
        coveredArea += turf.area(inter);
      }
    } catch {
      // Ignorar sectores con geometrías problemáticas
    }
  }

  if (totalArea <= 0) {
    return 0;
  }

  const pct = (coveredArea / totalArea) * 100;
  if (pct <= 0) {
    return 0;
  }
  if (pct >= 100) {
    return 100;
  }
  return Math.round(pct * 100) / 100;
}

export function polygonCentroidLatLng(sector: Sector): LatLng {
  const feature = toPolygonFeature(sector);
  const centroid = turf.centroid(feature);
  const coords = centroid.geometry.coordinates;
  if (coords.length >= 2) {
    return {
      lat: coords[1],
      lng: coords[0],
    };
  }
  // Fallback al primer vértice
  const first = sector.geometry.coordinates[0]?.[0];
  return first ? { lat: first[1], lng: first[0] } : { lat: 0, lng: 0 };
}