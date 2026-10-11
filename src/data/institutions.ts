import type { Institution } from '../types';

/**
 * Instituciones de educación superior del área metropolitana de Maracaibo.
 *
 * Coordenadas verificadas con OpenStreetMap (© OpenStreetMap contributors, ODbL 1.0)
 * consultando Nominatim/Overpass. Unidades que no se pudieron verificar se omitieron
 * a propósito: es mejor no marcar un punto equivocado.
 *
 * Para agregar una más, agrega una entrada con id, nombre, tipo y sus coordenadas:
 * el mapa, el análisis y los sectores la toman automáticamente.
 */
export const institutions: Institution[] = [
  // ── Universidades ──
  {
    id: 'uni-01',
    name: 'Universidad del Zulia (LUZ) · Ciudad Universitaria',
    type: 'Universidad',
    coordinates: { lat: 10.682698, lng: -71.6398583 },
  },
  {
    id: 'uni-02',
    name: 'Universidad Rafael Urdaneta (URU)',
    type: 'Universidad',
    coordinates: { lat: 10.6493962, lng: -71.5966314 },
  },
  {
    id: 'uni-03',
    name: 'Universidad Católica Cecilio Acosta (UNICA)',
    type: 'Universidad',
    coordinates: { lat: 10.6369647, lng: -71.6581048 },
  },
  {
    id: 'uni-04',
    name: 'Universidad Rafael Belloso Chacín (URBE)',
    type: 'Universidad',
    coordinates: { lat: 10.6941339, lng: -71.6340052 },
  },
  {
    id: 'uni-05',
    name: 'Universidad Santiago Mariño',
    type: 'Universidad',
    coordinates: { lat: 10.6754113, lng: -71.655851 },
  },
  {
    id: 'uni-06',
    name: 'Universidad José Gregorio Hernández (UJGH)',
    type: 'Universidad',
    coordinates: { lat: 10.6505931, lng: -71.6202827 },
  },

  // ── Institutos / colegios universitarios ──
  {
    id: 'inst-01',
    name: 'Instituto Universitario Tecnológico Juan Pablo Pérez Alfonso',
    type: 'Instituto',
    coordinates: { lat: 10.5567496, lng: -71.6364504 },
  },
  {
    id: 'inst-02',
    name: 'Instituto Universitario San Francisco',
    type: 'Instituto',
    coordinates: { lat: 10.5528312, lng: -71.643113 },
  },
  {
    id: 'inst-03',
    name: 'Instituto Tecnológico de Maracaibo (ITM)',
    type: 'Instituto',
    coordinates: { lat: 10.6800073, lng: -71.6765548 },
  },
  {
    id: 'inst-04',
    name: 'Colegio Universitario Monseñor de Talavera',
    type: 'Instituto',
    coordinates: { lat: 10.6583694, lng: -71.6058918 },
  },
];

export const universities = institutions.filter((i) => i.type === 'Universidad');
export const institutes = institutions.filter((i) => i.type === 'Instituto');
