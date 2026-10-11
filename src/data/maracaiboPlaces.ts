/**
 * Barrios, sectores y puntos de referencia reales del área metropolitana de Maracaibo.
 * Se usan para dar a cada celda de la cuadrícula un nombre reconocible por la gente
 * (en lugar de "Norte/Occidente"), asignando el lugar más cercano al centro de la celda.
 *
 * Las coordenadas son aproximadas (WGS84). Si necesitas ajustar o añadir sectores,
 * basta con agregar una línea aquí: el motor es determinista y las usa tal cual.
 */
import { OSM_PLACES } from './maracaiboPlacesOSM';

export interface NamedPlace {
  name: string;
  lat: number;
  lng: number;
}

export const MARACAIBO_PLACES: NamedPlace[] = [
  // ── Zona centro / histórico ──
  { name: 'Centro Histórico', lat: 10.665, lng: -71.615 },
  { name: 'Chiquinquirá', lat: 10.672, lng: -71.624 },
  { name: 'González', lat: 10.675, lng: -71.631 },
  { name: 'Santa Lucía', lat: 10.66, lng: -71.631 },
  { name: 'Pueblo Nuevo', lat: 10.68, lng: -71.611 },
  { name: 'Barrio Obrero', lat: 10.685, lng: -71.641 },
  { name: 'María Auxiliadora', lat: 10.694, lng: -71.645 },
  { name: 'Catatumbo', lat: 10.712, lng: -71.641 },

  // ── Zona oeste (cerro, cañada, barrios tradicionales) ──
  { name: 'La Cañada', lat: 10.664, lng: -71.64 },
  { name: 'Dolores', lat: 10.67, lng: -71.646 },
  { name: 'Pedro Emilio Coll', lat: 10.672, lng: -71.651 },
  { name: 'Rafael María Baralt', lat: 10.678, lng: -71.65 },
  { name: 'Sixto Zambrano', lat: 10.671, lng: -71.671 },
  { name: 'Juana de Ávila', lat: 10.677, lng: -71.671 },
  { name: 'Cacique Mara', lat: 10.681, lng: -71.66 },
  { name: 'Juan Eloy Pérez', lat: 10.687, lng: -71.651 },
  { name: 'Manuel Nicolás Ibáñez', lat: 10.691, lng: -71.66 },
  { name: 'Olegario Villalobos', lat: 10.695, lng: -71.675 },
  { name: 'José Antonio Páez', lat: 10.698, lng: -71.666 },
  { name: 'Lamas', lat: 10.7, lng: -71.681 },
  { name: 'Venancio Pulgar', lat: 10.71, lng: -71.671 },
  { name: 'José Táchira', lat: 10.714, lng: -71.691 },
  { name: 'José María Vargas', lat: 10.708, lng: -71.695 },
  { name: 'Gonzalo Picón Febres', lat: 10.72, lng: -71.666 },
  { name: 'Antonio Borjas Romero', lat: 10.73, lng: -71.68 },
  { name: 'Tulio Febres Cordero', lat: 10.735, lng: -71.655 },
  { name: 'Alfredo Chacín', lat: 10.742, lng: -71.662 },

  // ── Zona sur ──
  { name: 'San Francisco', lat: 10.653, lng: -71.636 },
  { name: 'Francisco de Miranda', lat: 10.65, lng: -71.641 },
  { name: 'Ana María Campos', lat: 10.656, lng: -71.648 },
  { name: 'Luisa Cáceres de Arismendi', lat: 10.668, lng: -71.656 },
  { name: 'Andrés Eloy Blanco', lat: 10.661, lng: -71.657 },
  { name: 'San Vicente', lat: 10.65, lng: -71.655 },
  { name: 'Santa Rita', lat: 10.645, lng: -71.661 },
  { name: 'Francisco Eugenio Bustamante', lat: 10.705, lng: -71.656 },

  // ── Zona este / avenida La Guajira, orillas del lago ──
  { name: 'Sabaneta de Paraguaipoa', lat: 10.66, lng: -71.553 },
  { name: 'Islas del Lago', lat: 10.652, lng: -71.575 },
  { name: 'Zona Industrial', lat: 10.69, lng: -71.62 },
  { name: 'Avenida La Guajira', lat: 10.678, lng: -71.6 },

  // ── Puntos de referencia conocidos ──
  { name: 'Ciudad Universitaria (LUZ)', lat: 10.665, lng: -71.655 },
  { name: 'Plaza Bolívar', lat: 10.6647, lng: -71.6103 },
  { name: 'Lago de Maracaibo (orilla)', lat: 10.67, lng: -71.59 },
  { name: 'Polideportivo de Maracaibo', lat: 10.666, lng: -71.617 },
  { name: 'Hospital Universitario de Maracaibo', lat: 10.657, lng: -71.637 },
];

/**
 * Devuelve el nombre del lugar más cercano a un punto dado.
 * Combina los puntos de referencia curados con los ~200 barrios reales de OSM.
 * Determinista: misma entrada → misma salida.
 */
export function nearestPlaceName(lng: number, lat: number): string | null {
  let best: NamedPlace | null = null;
  let bestDistSq = Infinity;

  // Los lugares curados tienen prioridad en caso de empate
  for (const place of [...MARACAIBO_PLACES, ...OSM_PLACES]) {
    const dLng = place.lng - lng;
    const dLat = place.lat - lat;
    const distSq = dLng * dLng + dLat * dLat;
    if (distSq < bestDistSq) {
      bestDistSq = distSq;
      best = place;
    }
  }

  // Si el punto queda demasiado lejos de cualquier lugar catalogado (~7 km),
  // no forzamos un nombre engañoso.
  if (best && bestDistSq > 0.07 * 0.07) {
    return null;
  }

  return best ? best.name : null;
}
