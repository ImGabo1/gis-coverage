// Genera src/data/maracaiboPlacesOSM.ts
// Barrios/sectores reales del área de estudio (Maracaibo + San Francisco)
// desde OpenStreetMap (ODbL) vía Overpass: relaciones admin_level 8-10 y nodos place.
const fs = require('fs');

const OUT = 'C:/Users/LENOVO YOGA/gis-coverage-dashboard/src/data/maracaiboPlacesOSM.ts';
const BBOX = '10.509,-71.782,10.769,-71.562'; // sur, oeste, norte, este
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

const Q = `[out:json][timeout:90];
(
  relation["admin_level"~"^(8|9|10)$"]["name"](${BBOX});
  way["admin_level"~"^(8|9|10)$"]["name"](${BBOX});
  node["place"~"^(suburb|quarter|neighbourhood|village|hamlet|town|city)$"](${BBOX});
  way["place"~"^(suburb|quarter|neighbourhood|village|hamlet)$"](${BBOX});
  relation["place"~"^(suburb|quarter|neighbourhood)$"](${BBOX});
);
out center tags;
`;

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function overpass() {
  let lastErr = '';
  for (let attempt = 1; attempt <= 12; attempt++) {
    for (const url of ENDPOINTS) {
      try {
        const r = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'gis-coverage-dashboard/1.0 (educational project)',
            Accept: 'application/json',
          },
          body: 'data=' + encodeURIComponent(Q),
        });
        const text = await r.text();
        if (!r.ok || !text.trim().startsWith('{')) {
          lastErr = `${url} -> HTTP ${r.status}`;
          continue;
        }
        return JSON.parse(text);
      } catch (e) {
        lastErr = `${url} -> ${e.message}`;
      }
    }
    console.log(`intento ${attempt} falló (${lastErr}); reintentando en 8s…`);
    await sleep(8000);
  }
  throw new Error('Overpass no respondió: ' + lastErr);
}

function cleanName(raw) {
  return String(raw)
    .replace(/^(Barrio|B\.|Sector|Urbanización|Urb\.|Parcelamiento|Villa|Conjunto|Comunidad|Asentamiento)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

( async () => {
  const j = await overpass();
  const seen = new Map(); // name -> {name, lat, lng, rank}
  let kept = 0;

  const rank = (e) => {
    const place = e.tags?.place;
    if (place === 'suburb') return 1;
    if (place === 'quarter' || place === 'neighbourhood') return 2;
    const lvl = e.tags?.['admin_level'];
    if (lvl === '10') return 2;
    if (lvl === '9') return 3;
    if (lvl === '8') return 5;
    return 4;
  };

  for (const e of j.elements) {
    if (!e.tags?.name) continue;
    const raw = e.tags.name;
    const name = cleanName(raw);
    if (!name) continue;
    const lat = e.lat ?? e.center?.lat;
    const lon = e.lon ?? e.center?.lon;
    if (typeof lat !== 'number' || typeof lon !== 'number') continue;
    if (lon < -71.81 || lon > -71.55 || lat < 10.49 || lat > 10.79) continue;

    const key = name.toLowerCase();
    const r = rank(e);
    const cur = seen.get(key);
    if (!cur || r < cur.rank) {
      seen.set(key, { name, lat, lng: lon, rank: r });
      kept++;
    }
  }

  const places = [...seen.values()]
    .filter((p) => p.rank <= 4 && p.lng > -71.785 && p.lng < -71.56 && p.lat > 10.505 && p.lat < 10.775)
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));

  const lines = places.map((p) => `  { name: '${p.name.replace(/'/g, "\\'")}', lat: ${p.lat}, lng: ${p.lng} },`);
  const src = `/**
 * Barrios y sectores REALES del área de estudio (Maracaibo + San Francisco).
 * Generado desde OpenStreetMap (© OpenStreetMap contributors, ODbL 1.0) con
 * scripts/generate-places.cjs. Todas las coordenadas son centros de barrio
 * (o de su polígono administrativo) — utilícelas solo para nombrar celdas
 * por cercanía, no como puntos exactos.
 */
export interface OsmPlace {
  name: string;
  lat: number;
  lng: number;
}

export const OSM_PLACES: OsmPlace[] = [
${lines.join('\n')}
];

export default OSM_PLACES;
`;
  fs.writeFileSync(OUT, src, 'utf8');
  console.log('elementos:', j.elements.length, '| lugares únicos:', places.length, '| bytes:', src.length);
})();