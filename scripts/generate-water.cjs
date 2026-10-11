// Genera src/data/waterGeoJSON.ts a partir de OpenStreetMap (ODbL)
const fs = require('fs');
const turf = require('C:/Users/LENOVO YOGA/gis-coverage-dashboard/node_modules/@turf/turf');

const LAKE_FILE = 'C:/Users/LENOVO YOGA/.local/share/opencode/tool-output/tool_118112fd4001B8peNxTjAAI9fB';
const OUT = 'C:/Users/LENOVO YOGA/gis-coverage-dashboard/src/data/waterGeoJSON.ts';

const BBOX = [-71.9, 10.42, -71.3, 10.95];
const TOLERANCE = 0.0015;

async function fetchOtherWater() {
  const q = `[out:json][timeout:40];(
way["natural"="water"](${BBOX[1]},${BBOX[0]},${BBOX[3]},${BBOX[2]});
relation["natural"="water"](${BBOX[1]},${BBOX[0]},${BBOX[3]},${BBOX[2]});
);out geom tags;`;
  const r = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'gis-coverage-dashboard/1.0 (educational project)',
      Accept: 'application/json',
    },
    body: 'data=' + encodeURIComponent(q),
  });
  if (!r.ok) throw new Error('Overpass ' + r.status);
  return r.json();
}

// Simplifica un anillo (línea cerrada) manteniendo el primer punto fijo
function simplifyRing(ring) {
  let r = ring;
  const a = r[0];
  const b = r[r.length - 1];
  if (a[0] !== b[0] || a[1] !== b[1]) r = [...r, a];
  if (r.length < 5) return r;
  try {
    const s = turf.simplify(turf.lineString(r), { tolerance: TOLERANCE, highQuality: true });
    let coords = s.geometry.coordinates;
    const f = coords[0];
    const l = coords[coords.length - 1];
    if (f[0] !== l[0] || f[1] !== l[1]) coords = [...coords, f];
    if (coords.length < 4) return null;
    return coords;
  } catch {
    return null;
  }
}

function simplifyPolygon(rings) {
  const out = [];
  for (let i = 0; i < rings.length; i++) {
    const s = simplifyRing(rings[i]);
    if (!s) {
      if (i === 0) return null; // sin anillo exterior no hay polígono
      continue; // hueco descartable
    }
    out.push(s);
  }
  return out.length ? out : null;
}

function intersectsBbox(rings) {
  for (const ring of rings) {
    for (const [x, y] of ring) {
      if (x >= BBOX[0] && x <= BBOX[2] && y >= BBOX[1] && y <= BBOX[3]) return true;
    }
  }
  return false;
}

(async () => {
  const polys = [];

  // 1) Lago de Maracaibo completo desde Nominatim (sin recortar: el recorte distorsiona)
  const lake = JSON.parse(fs.readFileSync(LAKE_FILE, 'utf8'))[0];
  if (!lake || !lake.geojson) throw new Error('No lake geojson');
  const lakeGeo = lake.geojson.type === 'Polygon' ? [lake.geojson.coordinates] : lake.geojson.coordinates;
  for (const rings of lakeGeo) {
    const s = simplifyPolygon(rings);
    if (s) polys.push(s);
  }

  // 2) Otros cuerpos de agua del área (lagunas, estanques, embalses)
  let extra = 0;
  try {
    const j = await fetchOtherWater();
    for (const el of j.elements) {
      if (!el.geometry || !el.tags || el.geometry.length < 6) continue;
      const ring = el.geometry.map((p) => [p.lon, p.lat]);
      // área aproximada mínima (~1 km²*0.01)
      let area = 0;
      for (let i = 0, k = ring.length - 1; i < ring.length; k = i++) {
        area += (ring[k][0] + ring[i][0]) * (ring[k][1] - ring[i][1]);
      }
      if (Math.abs(area / 2) < 5e-6) continue;
      if (!intersectsBbox([ring])) continue;
      const s = simplifyPolygon([ring]);
      if (s) {
        polys.push(s);
        extra++;
      }
    }
  } catch (e) {
    console.warn('Overpass falló, solo lago:', e.message);
  }

  const json = JSON.stringify(polys);
  const src = `import type { Position } from 'geojson';

/**
 * Cuerpos de agua del área metropolitana de Maracaibo.
 * Fuente: OpenStreetMap (© OpenStreetMap contributors, ODbL 1.0).
 * Generado con scripts/generate-water.cjs (Lago de Maracaibo, bahías, lagunas y embalses).
 *
 * Las celdas de la cuadrícula caídas sobre agua NO se analizan:
 * no tiene sentido marcar "sin universidad" en medio del lago.
 */
export const WATER_POLYGONS: Position[][][] = ${json};
`;
  fs.writeFileSync(OUT, src, 'utf8');
  console.log('polígonos:', polys.length, '(otros:', extra + ')', 'bytes:', src.length);
})();
