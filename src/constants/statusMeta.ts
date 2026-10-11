import type { SectorStatus } from '../types';

export interface StatusMeta {
  label: string;
  description: string;
  hex: string;
  mapFill: string;
  mapStroke: string;
  badgeClass: string;
  textClass: string;
  dotClass: string;
}

export const SECTOR_STATUS_META: Record<SectorStatus, StatusMeta> = {
  CUBIERTO: {
    label: 'Con universidad',
    description: '80% o más de este sector tiene universidad o instituto cerca.',
    hex: '#22c55e',
    mapFill: '#22c55e',
    mapStroke: '#15803d',
    badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    textClass: 'text-emerald-700',
    dotClass: 'bg-emerald-500',
  },
  PARCIAL: {
    label: 'Poca cobertura',
    description: 'Solo una parte de este sector tiene cobertura (menos del 80%).',
    hex: '#f59e0b',
    mapFill: '#f59e0b',
    mapStroke: '#b45309',
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
    textClass: 'text-amber-700',
    dotClass: 'bg-amber-500',
  },
  PUNTO_CIEGO: {
    label: 'Sin universidad',
    description: 'No hay ninguna universidad ni instituto cerca de este sector.',
    hex: '#ef4444',
    mapFill: '#ef4444',
    mapStroke: '#b91c1c',
    badgeClass: 'border-red-200 bg-red-50 text-red-700',
    textClass: 'text-red-700',
    dotClass: 'bg-red-500',
  },
};

export const STATUS_ORDER: SectorStatus[] = ['PUNTO_CIEGO', 'PARCIAL', 'CUBIERTO'];