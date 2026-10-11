import { useEffect, useRef } from 'react';
import { SECTOR_STATUS_META } from '../../constants/statusMeta';
import type { FeatureCollectionLike } from '../../data/sectorsGeoJSON';
import type { SectorClassification, SectorStatus } from '../../types';

interface GeoJsonLayerProps {
  map: google.maps.Map;
  featureCollection: FeatureCollectionLike;
  classifications: Record<string, SectorClassification>;
  selectedSectorId: string | null;
  onSelect: (id: string | null) => void;
}

type AddGeoJsonParam = Parameters<google.maps.Data['addGeoJson']>[0];

export function GeoJsonLayer({ map, featureCollection, classifications, selectedSectorId, onSelect }: GeoJsonLayerProps) {
  const dataRef = useRef<google.maps.Data | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const selectedIdRef = useRef(selectedSectorId);
  selectedIdRef.current = selectedSectorId;
  const classRef = useRef(classifications);
  classRef.current = classifications;

  // Capa de datos: se reconstruye cuando cambia la cuadrícula (pan/zoom del mapa)
  useEffect(() => {
    const layer = new google.maps.Data({ map });
    dataRef.current = layer;
    const infoWindow = new google.maps.InfoWindow();
    infoWindowRef.current = infoWindow;

    try {
      layer.addGeoJson(featureCollection as unknown as AddGeoJsonParam);
    } catch (error) {
      console.warn('No se pudo agregar GeoJSON a Google Maps Data Layer:', error);
    }

    const clickListener = layer.addListener('click', (event: google.maps.Data.MouseEvent) => {
      const feature = event.feature;
      if (!feature) {
        return;
      }
      const id = feature.getProperty('id');
      if (typeof id !== 'string') {
        return;
      }

      // Cartel emergente con lenguaje sencillo (pensado para público general)
      const cls = classRef.current[id];
      const status = (cls?.status ?? 'PUNTO_CIEGO') as SectorStatus;
      const meta = SECTOR_STATUS_META[status];
      const name = String(feature.getProperty('name') ?? id);
      const overlap = cls?.overlapPercentage ?? 0;

      const plainStatus =
        status === 'PUNTO_CIEGO'
          ? 'NO hay ninguna universidad ni instituto cerca.'
          : status === 'PARCIAL'
            ? 'Hay cobertura PARCIAL (no llega a toda el área).'
            : 'SÍ hay universidad o instituto cubriendo casi todo este sector.';

      const iw = infoWindowRef.current;
      if (iw && event.latLng) {
        iw.setContent(
          `<div style="max-width:240px;padding:4px 2px;">` +
            `<p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#0f172a;">${name}</p>` +
            `<p style="margin:0 0 4px;font-size:14px;font-weight:700;color:${meta.hex};">${meta.label}</p>` +
            `<p style="margin:0 0 6px;font-size:13px;color:#334155;line-height:1.4;">${plainStatus}</p>` +
            `<p style="margin:0;font-size:12px;color:#64748b;">Cobertura: ${overlap.toFixed(1)}%</p>` +
            `</div>`,
        );
        iw.setPosition(event.latLng);
        iw.open(map);
      }

      // Alterna la selección: clic sobre sector seleccionado lo deselecciona
      onSelectRef.current(selectedIdRef.current === id ? null : id);
    });

    const mouseOverListener = layer.addListener('mouseover', (event: google.maps.Data.MouseEvent) => {
      map.setOptions({ draggableCursor: 'pointer' });
      const feature = event.feature;
      if (feature) {
        const id = String(feature.getProperty('id') ?? '');
        const cls = classifications[id];
        const status: SectorStatus = cls?.status ?? 'PUNTO_CIEGO';
        const meta = SECTOR_STATUS_META[status];
        layer.overrideStyle(feature, {
          fillOpacity: 0.55,
          strokeColor: meta.mapStroke,
          strokeWeight: 2.5,
        });
      }
    });

    const mouseOutListener = layer.addListener('mouseout', (event: google.maps.Data.MouseEvent) => {
      map.setOptions({ draggableCursor: '' });
      if (event.feature) {
        layer.revertStyle(event.feature);
      }
    });

    return () => {
      clickListener.remove();
      mouseOverListener.remove();
      mouseOutListener.remove();
      infoWindow.close();
      infoWindowRef.current = null;
      layer.setMap(null);
      dataRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, featureCollection]);

  useEffect(() => {
    const layer = dataRef.current;
    if (!layer) {
      return;
    }

    layer.setStyle((feature: google.maps.Data.Feature) => {
      const id = String(feature.getProperty('id') ?? '');
      const cls = classifications[id];
      const status: SectorStatus = cls?.status ?? 'PUNTO_CIEGO';
      const meta = SECTOR_STATUS_META[status];
      const isSelected = id === selectedSectorId;
      return {
        fillColor: meta.mapFill,
        fillOpacity: isSelected ? 0.65 : 0.35,
        strokeColor: meta.mapStroke,
        strokeWeight: isSelected ? 3 : 1.2,
        clickable: true,
      } as google.maps.Data.StyleOptions;
    });
  }, [classifications, selectedSectorId, featureCollection]);

  useEffect(() => {
    if (!selectedSectorId) {
      return;
    }
    const layer = dataRef.current;
    if (!layer) {
      return;
    }

    let targetFeature: google.maps.Data.Feature | null = null;
    layer.forEach((feature: google.maps.Data.Feature) => {
      const id = String(feature.getProperty('id') ?? '');
      if (id === selectedSectorId) {
        targetFeature = feature;
      }
    });

    if (!targetFeature) {
      return;
    }

    const geom: any = (targetFeature as any).getGeometry?.();
    if (!geom) {
      return;
    }

    try {
      const bounds = new google.maps.LatLngBounds();
      const gtype = geom.getType ? geom.getType() : geom.type;
      if (gtype === 'Polygon') {
        const paths = geom.getPaths ? geom.getPaths() : geom.coordinates;
        if (paths?.forEach) {
          paths.forEach((path: any) => path.forEach((pt: any) => bounds.extend(new google.maps.LatLng(pt.lat(), pt.lng()))));
        } else if (paths) {
          paths[0]?.forEach((pt: any) => {
            bounds.extend({ lat: pt[1], lng: pt[0] });
          });
        }
      } else if (gtype === 'MultiPolygon') {
        const polygons = geom.getArray ? geom.getArray() : geom.coordinates;
        if (polygons?.forEach) {
          polygons.forEach((pg: any) => {
            const ppaths = pg.getPaths ? pg.getPaths() : pg.coordinates;
            ppaths?.forEach((path: any) => path.forEach((pt: any) => bounds.extend(pt)));
          });
        }
      }
      if (!bounds.isEmpty()) {
        map.panTo(bounds.getCenter());
        const currentZoom = map.getZoom() ?? 12;
        if (currentZoom < 13) {
          map.setZoom(13);
        }
      }
    } catch {
      // Ignorar
    }
  }, [selectedSectorId, map]);

  return null;
}
