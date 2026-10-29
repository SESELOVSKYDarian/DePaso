import type { ColorTokens } from "@depaso/design-tokens";
import { routeMapCss } from "./routeMapCss";
import { routeMapScript } from "./routeMapScript";

export interface RouteMapWaypoint {
  latitude: number;
  longitude: number;
  /** Nombre de la parada: el último (destino) se dibuja con su etiqueta. */
  name?: string;
}

export interface BuildRouteMapHtmlOptions {
  waypoints: RouteMapWaypoint[];
  /** Encoded polyline (precisión 5) del `RouteProvider` real — `null` dibuja una línea
   * recta entre paradas en vez de mentir con una curva inventada (mismo criterio honesto
   * que `MockRouteProvider`, sección 67). */
  polyline: string | null;
  mapboxToken: string;
  /** Paleta del tema activo: pines y ruta toman los colores de marca del esquema. */
  colors: ColorTokens;
  /** Estilo de mapa oscuro cuando la app está en modo oscuro. */
  isDark?: boolean;
  /** Comercios de paso: se dibujan con ícono y nombre, y avisan cuál se tocó. */
  stores?: RouteMapStore[];
  /** Recorrido original (sin compras): se dibuja punteado debajo de `polyline` para ver la variación. */
  basePolyline?: string | null;
  /** Vista de satélite en vez del mapa azulado. */
  satellite?: boolean;
  /** Espacio que tapan el buscador (arriba) y la hoja de comercios (abajo): la ruta se encuadra fuera de ellos. */
  fitPadding?: { top: number; bottom: number };
}

export interface RouteMapStore {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  /** Parada de compra del plan: se dibuja más grande y de color de marca. */
  buy?: boolean;
  /** Logo de la cadena (`data:image/png;base64,...`): si está, el pin es el logo. */
  logo?: string;
}

export const MAPBOX_GL_VERSION = "3.7.0";
// Hashes calculados contra los archivos reales publicados en esta versión exacta (no
// inventados) — si se sube `MAPBOX_GL_VERSION`, hay que recalcularlos contra los nuevos
// archivos o el navegador va a bloquear la carga por integridad.
export const MAPBOX_GL_JS_INTEGRITY = "sha384-TgDWG1CxH3UwM5IL34LqCZPI9N5Qnr+getwHh3tUdDD/e4ajSh35TmGG271bDtka";
export const MAPBOX_GL_CSS_INTEGRITY = "sha384-GTsgKcJXGSkBp0M68qpxkz9XovzVH0PwSrjYONvkn3tXtySOSq+a14bG2gVJHwQG";

/**
 * HTML autocontenido con Mapbox GL JS (Fase 17) — usado tanto por `RouteMapView` (WebView
 * nativa) como por `RouteMapView.web` (`iframe`, porque `react-native-webview` no tiene
 * build para web). Sin lógica de React/RN acá para poder compartirlo entre ambas.
 */
export function buildRouteMapHtml({ waypoints, polyline, mapboxToken, colors, isDark = false, stores = [], basePolyline = null, satellite = false, fitPadding = { top: 80, bottom: 80 } }: BuildRouteMapHtmlOptions): string {
  // noche azulada (como el diseño) en oscuro; día de navegación en claro; satélite a pedido
  const mapStyle = satellite
    ? "mapbox://styles/mapbox/satellite-streets-v12"
    : isDark
      ? "mapbox://styles/mapbox/navigation-night-v1"
      : "mapbox://styles/mapbox/navigation-day-v1";
  const routeColor = isDark || satellite ? "#5BB0FF" : colors.brand.route;
  const waypointsJson = JSON.stringify(waypoints.map((w) => ({ lat: w.latitude, lng: w.longitude, name: w.name ?? "" }))).replace(/</g, "\\u003c");
  const polylineJson = JSON.stringify(polyline);
  const basePolylineJson = JSON.stringify(basePolyline);
  // `<` escapado: un nombre de comercio no puede cerrar el <script> del HTML.
  const storesJson = JSON.stringify(stores.map((s) => ({ id: s.id, name: s.name, lat: s.latitude, lng: s.longitude, buy: Boolean(s.buy), logo: s.logo ?? null }))).replace(/</g, "\\u003c");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no" />
<link
  href="https://api.mapbox.com/mapbox-gl-js/v${MAPBOX_GL_VERSION}/mapbox-gl.css"
  rel="stylesheet"
  integrity="${MAPBOX_GL_CSS_INTEGRITY}"
  crossorigin="anonymous"
/>
<script
  src="https://api.mapbox.com/mapbox-gl-js/v${MAPBOX_GL_VERSION}/mapbox-gl.js"
  integrity="${MAPBOX_GL_JS_INTEGRITY}"
  crossorigin="anonymous"
></script>
<style>
${routeMapCss(routeColor)}
</style>
</head>
<body>
<div id="map"></div>
<script>
${routeMapScript({ mapboxToken, mapStyle, waypointsJson, polylineJson, basePolylineJson, storesJson, routeColor, pinColor: colors.brand.navy, isDark, fitPadding })}
</script>
</body>
</html>`;
}
