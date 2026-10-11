import { useMemo } from 'react';
import { SECTOR_STATUS_META } from '../../constants/statusMeta';
import { useAnalysis } from '../../context/AnalysisContext';
import type { SectorStatus } from '../../types';

export function FallbackMapView() {
  const { classificationById, selectedInstitutions, config, selectedSectorId, setSelectedSectorId, sectors } =
    useAnalysis();

  const viewport = useMemo(() => {
    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;

    for (const s of sectors) {
      const ring = s.geometry.coordinates[0];
      for (const [lng, lat] of ring) {
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }
    }

    if (!Number.isFinite(minLng)) {
      // Fallback: Maracaibo, Zulia, Venezuela
      minLng = -71.67;
      maxLng = -71.61;
      minLat = 10.66;
      maxLat = 10.71;
    }

    const padLng = (maxLng - minLng) * 0.08 || 0.01;
    const padLat = (maxLat - minLat) * 0.08 || 0.01;

    return {
      minLng: minLng - padLng,
      maxLng: maxLng + padLng,
      minLat: minLat - padLat,
      maxLat: maxLat + padLat,
    };
  }, [sectors]);

  const width = 1000;
  const height = 620;
  const pad = 36;

  const project = (lng: number, lat: number) => {
    const x = pad + ((lng - viewport.minLng) / (viewport.maxLng - viewport.minLng || 1)) * (width - 2 * pad);
    const y = pad + ((viewport.maxLat - lat) / (viewport.maxLat - viewport.minLat || 1)) * (height - 2 * pad);
    return { x, y };
  };

  const centerLat = (viewport.minLat + viewport.maxLat) / 2;
  const kmPerDegLng = 111.32 * Math.cos((centerLat * Math.PI) / 180);
  const kmPerDegLat = 110.574;
  const rx = (config.radiusKm / (kmPerDegLng || 1)) / (viewport.maxLng - viewport.minLng || 1) * (width - 2 * pad);
  const ry = (config.radiusKm / (kmPerDegLat || 1)) / (viewport.maxLat - viewport.minLat || 1) * (height - 2 * pad);

  const radiusKm = config.radiusKm;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      <div className="absolute left-4 top-4 z-10 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-sm backdrop-blur">
        <p className="font-semibold text-slate-900">Vista esquemática (sin clave de API de Google Maps)</p>
        <p className="mt-0.5 text-[11px] text-slate-500">Configure VITE_GOOGLE_MAPS_API_KEY en .env para habilitar Google Maps</p>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full bg-slate-100">
        <defs>
          <clipPath id="map-clip">
            <rect x={pad} y={pad} width={width - 2 * pad} height={height - 2 * pad} rx={12} />
          </clipPath>
        </defs>

        <g clipPath="url(#map-clip)">
          {sectors.map((sector) => {
            const cls = classificationById[sector.id];
            const status: SectorStatus = cls?.status ?? 'PUNTO_CIEGO';
            const meta = SECTOR_STATUS_META[status];
            const points = sector.geometry.coordinates[0]
              .map(([lng, lat]) => project(lng, lat))
              .map((p) => `${p.x},${p.y}`)
              .join(' ');
            const isSelected = selectedSectorId === sector.id;
            return (
              <g key={sector.id} onClick={() => setSelectedSectorId(isSelected ? null : sector.id)} className="cursor-pointer">
                <polygon
                  points={points}
                  fill={meta.mapFill}
                  fillOpacity={isSelected ? 0.6 : 0.32}
                  stroke={meta.mapStroke}
                  strokeWidth={isSelected ? 3 : 1.2}
                  className="transition-all"
                />
              </g>
            );
          })}

          {selectedInstitutions.map((inst) => {
            const { x, y } = project(inst.coordinates.lng, inst.coordinates.lat);
            return (
              <g key={inst.id}>
                <ellipse
                  cx={x}
                  cy={y}
                  rx={Math.max(8, rx)}
                  ry={Math.max(6, ry)}
                  fill="#6366f1"
                  fillOpacity={0.12}
                  stroke="#4338ca"
                  strokeWidth={2}
                />
                <circle cx={x} cy={y} r={7} fill="#4f46e5" stroke="#ffffff" strokeWidth={2} />
                <text x={x} y={y + 16} textAnchor="middle" fontSize={10} fill="#1e293b" fontWeight={600}>
                  {inst.name.length > 14 ? inst.name.substring(0, 12) + '…' : inst.name}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      <div className="absolute bottom-4 left-4 z-10 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-[11px] shadow-sm backdrop-blur">
        <div className="flex items-center gap-3">
          {Object.entries(SECTOR_STATUS_META).map(([key, meta]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: meta.mapFill }} />
              <span className="text-slate-600">{meta.label}</span>
            </div>
          ))}
        </div>
        <p className="mt-1 text-[10px] text-slate-500">
          Radio visualizado: {radiusKm.toFixed(1)} km · Sectores: {sectors.length}
        </p>
      </div>
    </div>
  );
}