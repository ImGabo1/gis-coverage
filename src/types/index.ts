export type InstitutionType = 'Universidad' | 'Instituto';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Institution {
  id: string;
  name: string;
  type: InstitutionType;
  coordinates: LatLng;
}

export type SectorStatus = 'CUBIERTO' | 'PARCIAL' | 'PUNTO_CIEGO';

export interface SectorPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface Sector {
  id: string;
  name: string;
  geometry: SectorPolygon;
  status: SectorStatus;
}

export type InstitutionSelection = string | 'ALL';

export interface AnalysisConfig {
  selectedInstitutionId: InstitutionSelection;
  radiusKm: number;
}

export interface SectorClassification {
  sector: Sector;
  status: SectorStatus;
  overlapPercentage: number;
}

export interface RuleResult {
  coveredSectors: Sector[];
  blindSpots: Sector[];
  partialSectors: Sector[];
  coveragePercentage: number;
  classifications: SectorClassification[];
}