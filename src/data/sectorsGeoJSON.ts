import type { Sector, SectorPolygon } from '../types';
import { nearestPlaceName } from './maracaiboPlaces';
import { WATER_POLYGONS } from './waterGeoJSON';
import { STUDY_AREA, STUDY_AREA_BBOX } from './studyAreaGeoJSON';

export interface BBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

/**
 * Área de estudio: Municipio Maracaibo + Municipio San Francisco (Zulia).
 * La cuadrícula NO se regenera con el zoom: es estable para que el análisis
 * sea siempre comparable (mismos sectores = mismos resultados).
 */
export const MARACAIBO_BBOX: BBox = STUDY_AREA_BBOX;

/** Tamaño objetivo de celda en grados (~0.8 km; se ajusta para caber en MAX_CELLS) */
const TARGET_CELL_DEG = 0.007;
const MIN_COLS = 2;
const MIN_ROWS = 2;
const MAX_CELLS = 480;

const ROW_ZONES = ['Norte', 'Central', 'Sur'];
const COL_ZONES = ['Occidente', 'Central', 'Oriente'];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function zoneOf(index: number, total: number, zones: string[]): string {
  const ratio = (index + 0.5) / Math.max(total, 1);
  if (ratio < 1 / 3) return zones[0];
  if (ratio < 2 / 3) return zones[1];
  return zones[2];
}

// ── Punto en polígono (ray casting) determinista, con huecos ──

function pointInRing(x: number, y: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) {
      inside = !inside;
    }
  }
  return inside;
}

function pointInPolygons(polygons: number[][][][], lng: number, lat: number): boolean {
  for (const rings of polygons) {
    if (!rings.length) continue;
    if (pointInRing(lng, lat, rings[0])) {
      let inHole = false;
      for (let h = 1; h < rings.length; h++) {
        if (pointInRing(lng, lat, rings[h])) {
          inHole = true;
          break;
        }
      }
      if (!inHole) return true;
    }
  }
  return false;
}

/**
 * Una celda se considera "dominada" por los polígonos dados si la mayoría de sus
 * 9 puntos de muestra caen dentro. Se usa para dos cosas:
 *  1. área de estudio (Municipio Maracaibo + San Francisco),
 *  2. agua (lago, bahía, laguna) → ahí nunca se marca "sin universidad".
 */
function cellDominatedBy(
  polygons: number[][][][],
  west: number,
  east: number,
  south: number,
  north: number,
): boolean {
  let hits = 0;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const lng = west + ((c + 1) / 4) * (east - west);
      const lat = south + ((r + 1) / 4) * (north - south);
      if (pointInPolygons(polygons, lng, lat)) hits += 1;
    }
  }
  return hits >= 5;
}

/** Dimensiones de la malla: celdas casi cuadradas que caben en MAX_CELLS. */
function gridDims(spanLng: number, spanLat: number): { cols: number; rows: number } {
  let cols = clamp(Math.round(spanLng / TARGET_CELL_DEG), MIN_COLS, 40);
  let rows = clamp(Math.round(spanLat / TARGET_CELL_DEG), MIN_ROWS, 40);

  if (cols * rows > MAX_CELLS) {
    const k = Math.sqrt(MAX_CELLS / (cols * rows));
    cols = Math.max(MIN_COLS, Math.round(cols * k));
    rows = Math.max(MIN_ROWS, Math.round(rows * k));
  }
  while (cols * rows > MAX_CELLS && cols > MIN_COLS) {
    cols -= 1;
  }
  while (cols * rows > MAX_CELLS && rows > MIN_ROWS) {
    rows -= 1;
  }
  return { cols, rows };
}

/**
 * Malla rectangular determinista sobre el área de estudio (Maracaibo + San Francisco).
 * Las celdas fuera del área o sobre agua se omiten (no se analizan), por eso ni el
 * lago ni la otra orilla aparecen en rojo.
 */
export function buildGridSectors(bbox: BBox): Sector[] {
  const spanLng = Math.max(bbox.east - bbox.west, 1e-6);
  const spanLat = Math.max(bbox.north - bbox.south, 1e-6);
  const { cols, rows } = gridDims(spanLng, spanLat);

  const cellW = spanLng / cols;
  const cellH = spanLat / rows;
  const sectors: Sector[] = [];

  for (let r = 0; r < rows; r++) {
    const north = bbox.north - r * cellH;
    const south = north - cellH;
    const rowZone = zoneOf(r, rows, ROW_ZONES);

    for (let c = 0; c < cols; c++) {
      const west = bbox.west + c * cellW;
      const east = west + cellW;

      // Solo dentro del área de estudio y fuera del agua
      if (!cellDominatedBy(STUDY_AREA, west, east, south, north)) {
        continue;
      }
      if (cellDominatedBy(WATER_POLYGONS, west, east, south, north)) {
        continue;
      }

      const colZone = zoneOf(c, cols, COL_ZONES);

      const geometry: SectorPolygon = {
        type: 'Polygon',
        coordinates: [
          [
            [west, north],
            [east, north],
            [east, south],
            [west, south],
            [west, north],
          ],
        ],
      };

      // Nombre reconocible: barrio/sector real más cercano al centro de la celda.
      const centerLng = (west + east) / 2;
      const centerLat = (north + south) / 2;
      const placeName = nearestPlaceName(centerLng, centerLat);

      sectors.push({
        id: `SEC-${r + 1}-${c + 1}`,
        name: placeName ?? `${rowZone} · ${colZone} (F${r + 1}·C${c + 1})`,
        status: 'PUNTO_CIEGO',
        geometry,
      });
    }
  }

  return sectors;
}

export interface FeatureCollectionLike {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: { id: string; name: string };
    geometry: SectorPolygon;
  }>;
}

export function toFeatureCollection(list: Sector[]): FeatureCollectionLike {
  return {
    type: 'FeatureCollection',
    features: list.map((s) => ({
      type: 'Feature',
      properties: {
        id: s.id,
        name: s.name,
      },
      geometry: s.geometry,
    })),
  };
}

/** Cuadrícula fija del área de estudio (semilla inicial y análisis estable) */
export const sectors: Sector[] = buildGridSectors(MARACAIBO_BBOX);

export const sectorsFeatureCollection: FeatureCollectionLike = toFeatureCollection(sectors);