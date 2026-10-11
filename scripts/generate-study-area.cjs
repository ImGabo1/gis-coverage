// Genera src/data/studyAreaGeoJSON.ts
// Límites administrativos oficiales del área de estudio
// (Municipio Maracaibo + Municipio San Francisco, Estado Zulia, Venezuela)
// desde OpenStreetMap vía Nominatim (ODbL).
const fs = require('fs');

const OUT = 'C:/Users/LENOVO YOGA/gis-coverage-dashboard/src/data/studyAreaGeoJSON.ts';
const TARGETS = [
  { id: 'R3447446', label: 'Municipio Maracaibo' },
  { id: 'R3447449', label: 'Municipio San Francisco' },
];
const TOL = 0.0005; // ~55 m: conserva la forma y mantiene el archivo pequeño

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchArea(target) {
  const url =
    `https://nominatim.openstreetmap.org/lookup?osm_ids=${target.id}` +
    `&format=jsonv2&polygon_geojson=1`;
  for (let attempt = 1; attempt <= 4; attempt++) {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'gis-coverage-dashboard/1.0 (educational project)' },
    });
    if (r.status === 429) {
      await sleep(2500);
      continue;
    }
    if (!r.ok) throw new Error(`HTTP ${r.status} para ${target.id}`);
    const j = await r.json();
    if (!j.length) throw new Error(`Sin resultado para ${target.id}`);
    return j[0];
  }
  throw new Error(`Rate limit para ${target.id}`);
}

// Douglas-Peucker (iterativo) para anillos cerrados
function dp(points, tol) {
  if (points.length <= 2) return points;
  const keep = new Array(points.length).fill(false);
  keep[0] = true;
  keep[points.length - 1] = true;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop();
    if (e <= s + 1) continue;
    const [x1, y1] = points[s];
    const [x2, y2] = points[e];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1e-12;
    let maxD = -1;
    let idx = -1;
    for (let i = s + 1; i < e; i++) {
      const d = Math.abs((points[i][0] - x1) * dy - (points[i][1] - y1) * dx) / len;
      if (d > maxD) {
        maxD = d;
        idx = i;
      }
    }
    if (maxD > tol && idx > 0) {
      keep[idx] = true;
      stack.push([s, idx], [idx, e]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

/**
 * Simplifica un anillo cerrado. Douglas-Peucker no sirve directamente sobre un
 * anillo cerrado (el primer y último punto coinciden → nunca se divide), así que
 * lo partimos en dos arcos por el punto más alejado del origen y simplificamos cada arco.
 */
function simplifyRing(ring, tol) {
  let r = ring.slice();
  const a = r[0];
  const b = r[r.length - 1];
  if (a[0] !== b[0] || a[1] !== b[1]) r = [...r, a.slice()];
  if (r.length < 10) return r.length >= 4 ? r : null;

  let far = 1;
  let farD = -1;
  for (let i = 1; i < r.length - 1; i++) {
    const d = Math.hypot(r[i][0] - r[0][0], r[i][1] - r[0][1]);
    if (d > farD) {
      farD = d;
      far = i;
    }
  }

  const part1 = dp(r.slice(0, far + 1), tol);
  const part2 = dp(r.slice(far), tol);
  const merged = [...part1, ...part2.slice(1)];

  return merged.length >= 4 ? merged : r;
}

(async () => {
  const polygons = [];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (const t of TARGETS) {
    const res = await fetchArea(t);
    const g = res.geojson;
    if (!g) throw new Error(`Sin geojson para ${t.id}`);
    const parts = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;

    let count = 0;
    for (const rings of parts) {
      const simplified = rings
        .map((ring) => simplifyRing(ring, TOL))
        .filter(Boolean);
      if (simplified.length && simplified[0].length >= 4) {
        polygons.push(simplified);
        count++;
        for (const [x, y] of simplified[0]) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      } else {
        console.warn(`  ⚠ anillo descartado (${simplified.length} anillos tras simplificar)`);
      }
    }
    const bb = (res.boundingbox ?? []).map(Number);
    console.log(
      `${t.label}: ${g.type}, ${parts.length} parte(s), ${count} polígono(s) guardado(s), ` +
        `bbox Nominatim = [${bb[1]}, ${bb[0]}, ${bb[3]}, ${bb[2]}]`,
    );
    await sleep(1200);
  }

  const json = JSON.stringify(polygons);
  const src = `import type { Position } from 'geojson';

/**
 * Área de estudio: Municipio Maracaibo + Municipio San Francisco (Estado Zulia).
 * Fuente: OpenStreetMap (© OpenStreetMap contributors, ODbL 1.0) vía Nominatim.
 * Generado con scripts/generate-study-area.cjs.
 *
 * La cuadrícula solo genera celdas dentro de esta zona: así el Lago de Maracaibo,
 * la orilla oriental (Municipio Miranda) y las zonas rurales de otros municipios
 * no aparecen pintados en rojo como "sin universidad".
 */
export const STUDY_AREA: Position[][][] = ${json};

/** Envolvente (bbox) de toda el área de estudio. */
export const STUDY_AREA_BBOX = {
  west: ${minX},
  south: ${minY},
  east: ${maxX},
  north: ${maxY},
} as const;
`;
  fs.writeFileSync(OUT, src, 'utf8');
  console.log('bbox unión:', [minX, minY, maxX, maxY].map((v) => +v.toFixed(5)).join(', '));
  console.log('polígonos:', polygons.length, '| bytes:', src.length);
})();
