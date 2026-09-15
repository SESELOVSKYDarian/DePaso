import { colors } from "@depaso/design-tokens";

export interface RouteMapWaypoint {
  latitude: number;
  longitude: number;
}

export interface BuildRouteMapHtmlOptions {
  waypoints: RouteMapWaypoint[];
  /** Encoded polyline (precisión 5) del `RouteProvider` real — `null` dibuja una línea
   * recta entre paradas en vez de mentir con una curva inventada (mismo criterio honesto
   * que `MockRouteProvider`, sección 67). */
  polyline: string | null;
  mapboxToken: string;
}

const MAPBOX_GL_VERSION = "3.7.0";
// Hashes calculados contra los archivos reales publicados en esta versión exacta (no
// inventados) — si se sube `MAPBOX_GL_VERSION`, hay que recalcularlos contra los nuevos
// archivos o el navegador va a bloquear la carga por integridad.
const MAPBOX_GL_JS_INTEGRITY = "sha384-TgDWG1CxH3UwM5IL34LqCZPI9N5Qnr+getwHh3tUdDD/e4ajSh35TmGG271bDtka";
const MAPBOX_GL_CSS_INTEGRITY = "sha384-GTsgKcJXGSkBp0M68qpxkz9XovzVH0PwSrjYONvkn3tXtySOSq+a14bG2gVJHwQG";

/**
 * HTML autocontenido con Mapbox GL JS (Fase 17) — usado tanto por `RouteMapView` (WebView
 * nativa) como por `RouteMapView.web` (`iframe`, porque `react-native-webview` no tiene
 * build para web). Sin lógica de React/RN acá para poder compartirlo entre ambas.
 */
export function buildRouteMapHtml({ waypoints, polyline, mapboxToken }: BuildRouteMapHtmlOptions): string {
  const waypointsJson = JSON.stringify(waypoints.map((w) => ({ lat: w.latitude, lng: w.longitude })));
  const polylineJson = JSON.stringify(polyline);

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
  html, body { margin: 0; padding: 0; height: 100%; }
  #map { position: absolute; top: 0; bottom: 0; width: 100%; }
  .depaso-pin {
    background: ${colors.brand.navy}; color: ${colors.text.onNavy}; border-radius: 999px;
    width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
    font-family: sans-serif; font-size: 13px; font-weight: 600; border: 2px solid #fff;
    box-shadow: 0 1px 4px rgba(0,0,0,0.3);
  }
</style>
</head>
<body>
<div id="map"></div>
<script>
  // Decoder estándar de polyline (precisión 5) — mismo algoritmo que usa Google/Mapbox.
  function decodePolyline(str) {
    let index = 0, lat = 0, lng = 0, coordinates = [];
    while (index < str.length) {
      let b, shift = 0, result = 0;
      do { b = str.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
      lat += (result & 1) ? ~(result >> 1) : (result >> 1);
      shift = 0; result = 0;
      do { b = str.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
      lng += (result & 1) ? ~(result >> 1) : (result >> 1);
      coordinates.push([lng / 1e5, lat / 1e5]);
    }
    return coordinates;
  }

  mapboxgl.accessToken = ${JSON.stringify(mapboxToken)};
  const waypoints = ${waypointsJson};
  const polyline = ${polylineJson};

  const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/streets-v12",
    center: [waypoints[0].lng, waypoints[0].lat],
    zoom: 13,
  });
  map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

  map.on("load", () => {
    const bounds = new mapboxgl.LngLatBounds();
    waypoints.forEach((w, i) => {
      const el = document.createElement("div");
      el.className = "depaso-pin";
      el.textContent = String(i + 1);
      new mapboxgl.Marker({ element: el }).setLngLat([w.lng, w.lat]).addTo(map);
      bounds.extend([w.lng, w.lat]);
    });

    const coordinates = polyline ? decodePolyline(polyline) : waypoints.map((w) => [w.lng, w.lat]);
    map.addSource("route", {
      type: "geojson",
      data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [coordinates[0]] } },
    });
    map.addLayer({
      id: "route",
      type: "line",
      source: "route",
      layout: { "line-join": "round", "line-cap": "round" },
      paint: { "line-color": "${colors.brand.route}", "line-width": 4, "line-opacity": 0.9 },
    });

    map.fitBounds(bounds, { padding: 56, maxZoom: 15 });

    // Dibujo progresivo de la ruta (MOTION-SYSTEM.md) — revela el trazo real en vez de
    // aparecer de golpe; respeta prefers-reduced-motion del sistema.
    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || coordinates.length < 2) {
      map.getSource("route").setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates } });
    } else {
      const segmentLengths = [];
      let totalLength = 0;
      for (let i = 0; i < coordinates.length - 1; i++) {
        const [x1, y1] = coordinates[i];
        const [x2, y2] = coordinates[i + 1];
        const len = Math.hypot(x2 - x1, y2 - y1);
        segmentLengths.push(len);
        totalLength += len;
      }

      function pointAtDistance(targetDistance) {
        let covered = 0;
        for (let i = 0; i < segmentLengths.length; i++) {
          if (covered + segmentLengths[i] >= targetDistance) {
            const remaining = targetDistance - covered;
            const t = segmentLengths[i] > 0 ? remaining / segmentLengths[i] : 0;
            const [x1, y1] = coordinates[i];
            const [x2, y2] = coordinates[i + 1];
            return { point: [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t], upToIndex: i };
          }
          covered += segmentLengths[i];
        }
        return { point: coordinates[coordinates.length - 1], upToIndex: coordinates.length - 1 };
      }

      const DURATION_MS = 900;
      const start = performance.now();
      function frame(now) {
        const progress = Math.min((now - start) / DURATION_MS, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const { point, upToIndex } = pointAtDistance(totalLength * eased);
        const revealed = coordinates.slice(0, upToIndex + 1).concat([point]);
        map.getSource("route").setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: revealed } });
        if (progress < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
  });
</script>
</body>
</html>`;
}
