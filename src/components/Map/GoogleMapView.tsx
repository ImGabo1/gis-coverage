import { useEffect, useRef, useState } from 'react';
import { useGoogleMapsApi } from '../../hooks/useGoogleMapsApi';
import { useAnalysis } from '../../context/AnalysisContext';
import { CircleOverlay } from './CircleOverlay';
import { GeoJsonLayer } from './GeoJsonLayer';
import { FallbackMapView } from './FallbackMapView';
import { SECTOR_STATUS_META } from '../../constants/statusMeta';
import { MARACAIBO_BBOX } from '../../data/sectorsGeoJSON';

const MAP_STYLES: google.maps.MapTypeStyle[] = [
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
];

export function GoogleMapView() {
  const { isLoaded, isError, isLoading } = useGoogleMapsApi();
  const {
    institutions,
    selectedInstitutions,
    config,
    classificationById,
    selectedSectorId,
    setSelectedSectorId,
    sectorsFeatureCollection,
  } = useAnalysis();
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [initFailed, setInitFailed] = useState(false);
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    if (!isLoaded || !containerRef.current) {
      return;
    }

    // Guarda defensiva: si el constructor no está listo, usar fallback en vez de romper React
    if (!window.google?.maps || typeof window.google.maps.Map !== 'function') {
      setInitFailed(true);
      return;
    }

    const center = institutions.length
      ? {
          lat: institutions.reduce((sum, i) => sum + i.coordinates.lat, 0) / institutions.length,
          lng: institutions.reduce((sum, i) => sum + i.coordinates.lng, 0) / institutions.length,
        }
      : { lat: 10.66, lng: -71.63 };

    try {
      const m = new google.maps.Map(containerRef.current, {
        center,
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        clickableIcons: false,
        styles: MAP_STYLES,
        mapTypeId: 'roadmap',
      });
      setMap(m);
      setInitFailed(false);
    } catch {
      setInitFailed(true);
    }
  }, [isLoaded, institutions]);

  useEffect(() => {
    if (!map) {
      return;
    }

    // Encuadre inicial: toda el área analizada (Municipio Maracaibo + San Francisco)
    const bounds = new google.maps.LatLngBounds(
      { lat: MARACAIBO_BBOX.south, lng: MARACAIBO_BBOX.west },
      { lat: MARACAIBO_BBOX.north, lng: MARACAIBO_BBOX.east },
    );
    try {
      map.fitBounds(bounds, 40);
    } catch {
      // Ignorar
    }
  }, [map]);

  // Marcadores con el ícono y el título por defecto de Google Maps
  // (pin rojo + nombre al pasar el cursor). Sin íconos ni etiquetas personalizados.
  useEffect(() => {
    if (!map) {
      return;
    }

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    const markers = selectedInstitutions.map((inst) =>
      new google.maps.Marker({
        position: { lat: inst.coordinates.lat, lng: inst.coordinates.lng },
        map,
        title: inst.name,
        // Siempre por encima de la cuadrícula de sectores
        zIndex: 100000,
      }),
    );

    markersRef.current = markers;

    return () => {
      markers.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
    };
  }, [map, selectedInstitutions]);

  if (isError || initFailed) {
    return <FallbackMapView />;
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-100">
      <div ref={containerRef} className="h-full w-full" />
      {map && (
        <>
          <CircleOverlay map={map} institutions={selectedInstitutions} radiusKm={config.radiusKm} />
          <GeoJsonLayer
            map={map}
            featureCollection={sectorsFeatureCollection}
            classifications={classificationById}
            selectedSectorId={selectedSectorId}
            onSelect={setSelectedSectorId}
          />
        </>
      )}
      {!map && !isError && !initFailed && (
        <div className="absolute inset-0 grid place-items-center bg-slate-100/80 backdrop-blur-sm">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
            {isLoading || !isLoaded ? 'Cargando Google Maps...' : 'Inicializando mapa...'}
          </div>
        </div>
      )}
      <div className="absolute bottom-4 left-4 z-10 hidden rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-[11px] shadow-sm backdrop-blur sm:block">
        <div className="flex items-center gap-3">
          {Object.entries(SECTOR_STATUS_META).map(([key, meta]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: meta.mapFill }} />
              <span className="text-slate-600">{meta.label}</span>
            </div>
          ))}
        </div>
        <p className="mt-1 text-[10px] leading-snug text-slate-500">
          <span className="font-semibold text-red-600">Rojo</span> = sin universidad ·{' '}
          <span className="font-semibold text-amber-600">Amarillo</span> = poca cobertura ·{' '}
          <span className="font-semibold text-emerald-600">Verde</span> = con universidad
          <br />
          El lago y otras zonas de agua no se marcan.
        </p>
      </div>
    </div>
  );
}