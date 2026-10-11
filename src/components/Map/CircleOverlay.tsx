import { useEffect } from 'react';
import type { Institution } from '../../types';

interface CircleOverlayProps {
  map: google.maps.Map;
  institutions: Institution[];
  radiusKm: number;
}

export function CircleOverlay({ map, institutions, radiusKm }: CircleOverlayProps) {
  useEffect(() => {
    if (!map || institutions.length === 0 || radiusKm <= 0) {
      return;
    }

    const circles = institutions.map((inst) => {
      return new google.maps.Circle({
        map,
        center: { lat: inst.coordinates.lat, lng: inst.coordinates.lng },
        radius: radiusKm * 1000,
        strokeColor: '#4338ca',
        strokeOpacity: 0.9,
        strokeWeight: 2,
        fillColor: '#6366f1',
        fillOpacity: 0.12,
        clickable: false,
        zIndex: 1,
      });
    });

    return () => {
      circles.forEach((circle) => circle.setMap(null));
    };
  }, [map, institutions, radiusKm]);

  return null;
}