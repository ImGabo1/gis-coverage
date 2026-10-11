# Cuadro de Mando GIS · Cobertura Educativa Universitaria

Cuadro de mando geográfico (GIS) que analiza la **cobertura universitaria** en el área urbana de **Maracaibo + San Francisco** (Estado Zulia, Venezuela). Evalúa el radio de cobertura de universidades e institutos de educación superior verificados y detecta **puntos ciegos** (sectores sin universidad cerca), **sin inteligencia artificial probabilística**: el motor es un **sistema experto de reglas deterministas** con lógica geométrica (Turf.js).

>> Para que el resultado sea confiable:
>> - La cuadrícula de sectores es **fija** (no cambia con el zoom ni al mover el mapa).
>> - El **Lago de Maracaibo**, las lagunas/canales y los **municipios vecinos** quedan fuera del análisis: no se pintan en rojo porque no son "sectores sin universidad".
>> - Cada sector llevael nombre del **barrio real más cercano** (OpenStreetMap), no nombres de brújula.
>> - Las institucionestienen **coordenadas verificadas** en OpenStreetMap/Nominatim.

## Stack tecnológico

- [Vite](https://vitejs.dev/) + [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- [Tailwind CSS](https://tailwindcss.com/) para estilos
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript) con marcadores por defecto (o fallback SVG esquemático sin clave)
- [Turf.js](https://turfjs.org/) (@turf/turf v6.5) para análisis espacial determinista
- Datos geográficos reales de OpenStreetMap (© OpenStreetMap contributors, ODbL 1.0)

## Estructura del proyecto

```text
src/
├── assets/
├── components/
│   ├── Sidebar/
│   │   ├── InstitutionSelector.tsx
│   │   ├── RadiusSlider.tsx
│   │   ├── CoverageReport.tsx
│   │   ├── RuleEnginePanel.tsx
│   │   └── Sidebar.tsx
│   ├── Map/
│   │   ├── GoogleMapView.tsx
│   │   ├── CircleOverlay.tsx
│   │   ├── GeoJsonLayer.tsx
│   │   └── FallbackMapView.tsx
│   └── UI/
│       └── Header.tsx
├── context/
│   └── AnalysisContext.tsx
├── data/
│   ├── institutions.ts        # 10 instituciones verificadas (OSM/Nominatim)
│   ├── studyAreaGeoJSON.ts    # Municipio Maracaibo + Municipio San Francisco (OSM)
│   ├── waterGeoJSON.ts        # Máscara de agua (Lago de Maracaibo, bahías, lagunas)
│   ├── sectorsGeoJSON.ts      # Cuadrícula fija de ~1.2 km sobre el área de estudio
│   └── maracaiboPlaces*.ts    # ~200 barrios reales para nombrar sectores
├── engine/
│   ├── expertSystemRules.ts
│   └── spatialEngine.ts
├── hooks/
│   └── useGoogleMapsApi.ts
├── types/
├── App.tsx
├── main.tsx
└── index.css
```

## Sistema Experto (motor de reglas determinista)

Reglas fijas, sin heurísticas probabilísticas — mismo dato siempre produce el mismo resultado:

- **REGLA A**: Buffer circular con radio `R` (km) alrededor de la(s) institución(es) seleccionada(s). Unión determinista de buffers con "Todas las instituciones".
- **REGLA B**: Porcentaje de solapamiento entre cada sector y el buffer: `% = (área intersección) / (área sector) × 100`.
- **REGLA C**: Clasificación por umbrales:
  - `PUNTO_CIEGO` — intersección 0 % (sin cobertura) · rojo
  - `PARCIAL` — 0 % < intersección < 80 % · ámbar
  - `CUBIERTO` — intersección ≥ 80 % · verde

## Datos incluidos

- **10 instituciones verificadas** en OSM/Nominatim (8 en Maracaibo, 2 en San Francisco).
- **368 sectores fijos** (~1.2 km × 1.2 km) que siguen el límite oficial de los municipios, **excluyendo agua** (mayoría de 9 muestras dentro del polígono del municipio y fuera de agua).
- **~200 barrios reales** de OSM para nombrar cada celda por cercanía.
- Límites de municipios y malla de agua generados con scripts reproducibles (`scripts/generate-*.cjs`).

## Instalación y ejecución

```bash
# Instalar dependencias
npm install

# Variables de entorno (opcional pero recomendado)
cp .env.example .env
# Editar .env y agregar VITE_GOOGLE_MAPS_API_KEY

# Ejecutar en desarrollo
npm run dev

# Compilar y verificar tipos
npm run build

# Vista previa de build
npm run preview
```

> **Nota:** con Node.js se ejecutan antes los scripts `scripts/` (descarga datos de OSM) si se desea regenerar los datos desde cero; el repositorio ya incluye los datos generados.

## Configuración de Google Maps

1. Obtener clave API en [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Habilitar **Maps JavaScript API**
3. Copiar a `.env`: `VITE_GOOGLE_MAPS_API_KEY=TU_CLAVE`
4. Reiniciar `npm run dev`

Sin clave, la aplicación muestra una **vista esquemática SVG** funcional (fallback) para que el proyecto sea ejecutable de inmediato.

## Despliegue

El proyecto es una SPA (estática) compatible con Vercel/Netlify:

```bash
# En Vercel: build `npm run build`, output `dist`, env var VITE_GOOGLE_MAPS_API_KEY
vercel --prod
```