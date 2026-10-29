import type { ColorTokens } from "@depaso/design-tokens";
import { buildMapCommandsScript } from "./mapCommands";

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
  html, body { margin: 0; padding: 0; height: 100%; }
  #map { position: absolute; top: 0; bottom: 0; width: 100%; }
  /* origen: punto azul con aro blanco; paradas del medio: puntos chicos; destino: punto con etiqueta */
  .depaso-pin {
    width: 18px; height: 18px; border-radius: 999px; background: ${routeColor}; border: 3px solid #fff;
    box-shadow: 0 0 0 6px rgba(91,176,255,0.28), 0 1px 4px rgba(0,0,0,0.4);
  }
  .depaso-pin.mid { width: 10px; height: 10px; border-width: 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.4); }
  .depaso-end { display: flex; flex-direction: column; align-items: center; gap: 3px; }
  .depaso-end .tag {
    max-width: 130px; padding: 4px 10px; border-radius: 10px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;
    font-family: sans-serif; font-size: 12px; font-weight: 700; background: #fff; color: #111; box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  }
  .depaso-end .dot { width: 14px; height: 14px; border-radius: 999px; background: #fff; border: 4px solid ${routeColor}; }
  /* comercios: el logo de la cadena en un cuadrado blanco redondeado */
  .depaso-store { display: flex; flex-direction: column; align-items: center; cursor: pointer; }
  .depaso-store .bubble {
    width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; overflow: hidden;
    background: #FFFFFF; color: #111111; border: 2px solid #FFFFFF; box-shadow: 0 2px 8px rgba(0,0,0,0.45);
    transition: transform 160ms ease-out;
  }
  .depaso-store .bubble img { width: 100%; height: 100%; object-fit: contain; }
  .depaso-store .label {
    margin-top: 3px; max-width: 100px; padding: 1px 7px; border-radius: 999px; overflow: hidden; display: none;
    white-space: nowrap; text-overflow: ellipsis; font-family: sans-serif; font-size: 11px; font-weight: 700;
    background: rgba(255,255,255,0.95); color: #111111; box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  }
  .depaso-store.selected .label, .depaso-store.buy .label { display: block; }
  .depaso-store.selected .bubble { transform: scale(1.25); border-color: ${routeColor}; }
  .depaso-store.selected { z-index: 5; }
  .depaso-store.buy .bubble { width: 42px; height: 42px; border-color: ${routeColor}; }
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
  const basePolyline = ${basePolylineJson};

  const map = new mapboxgl.Map({
    container: "map",
    style: ${JSON.stringify(mapStyle)},
    center: [waypoints[0].lng, waypoints[0].lat],
    zoom: 13,
  });
${buildMapCommandsScript(colors.brand.navy)}

  map.on("load", () => {
    const bounds = new mapboxgl.LngLatBounds();
    waypoints.forEach((w, i) => {
      const el = document.createElement("div");
      const isLast = i === waypoints.length - 1 && waypoints.length > 1;
      if (isLast) {
        el.className = "depaso-end";
        if (w.name) {
          const tag = document.createElement("div");
          tag.className = "tag";
          tag.textContent = w.name;
          el.appendChild(tag);
        }
        const dot = document.createElement("div");
        dot.className = "dot";
        el.appendChild(dot);
      } else {
        el.className = "depaso-pin" + (i === 0 ? "" : " mid");
      }
      new mapboxgl.Marker({ element: el }).setLngLat([w.lng, w.lat]).addTo(map);
      bounds.extend([w.lng, w.lat]);
    });

    // Comercios de paso: ícono de local + nombre. Al tocar uno se avisa a la app (WebView o iframe).
    const stores = ${storesJson};
    const storeEls = {};
    const storeIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M5 12v8h14v-8"/></svg>';
    function notifyApp(message) {
      const text = JSON.stringify(message);
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(text);
      else if (window.parent !== window) window.parent.postMessage(text, "*");
    }
    stores.forEach((store) => {
      const el = document.createElement("div");
      el.className = "depaso-store" + (store.buy ? " buy" : "");
      const bubble = document.createElement("div");
      bubble.className = "bubble";
      if (store.logo) {
        const img = document.createElement("img");
        img.src = store.logo;
        img.alt = "";
        bubble.appendChild(img);
      } else {
        bubble.innerHTML = storeIcon;
      }
      const label = document.createElement("div");
      label.className = "label";
      label.textContent = store.name;
      el.appendChild(bubble);
      el.appendChild(label);
      el.addEventListener("click", (event) => { event.stopPropagation(); window.selectStore(store.id, true); });
      new mapboxgl.Marker({ element: el, anchor: "top" }).setLngLat([store.lng, store.lat]).addTo(map);
      storeEls[store.id] = { el, store };
      bounds.extend([store.lng, store.lat]);
    });
    window.selectStore = function (id, fromTap) {
      Object.keys(storeEls).forEach((key) => storeEls[key].el.classList.toggle("selected", key === id));
      const target = storeEls[id];
      if (target) map.easeTo({ center: [target.store.lng, target.store.lat], duration: 350 });
      if (fromTap) notifyApp({ type: "store", id });
    };

    const coordinates = polyline ? decodePolyline(polyline) : waypoints.map((w) => [w.lng, w.lat]);
    // Recorrido original, punteado: se ve cuánto cambia con la parada de compra.
    if (basePolyline) {
      map.addSource("base-route", {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: decodePolyline(basePolyline) } },
      });
      map.addLayer({
        id: "base-route",
        type: "line",
        source: "base-route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": ${JSON.stringify(isDark ? "#8E8E93" : "#6B6B70")}, "line-width": 3, "line-dasharray": [1.5, 2], "line-opacity": 0.8 },
      });
    }
    map.addSource("route", {
      type: "geojson",
      data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [coordinates[0]] } },
    });
    // brillo suave debajo de la línea, como en el diseño
    map.addLayer({
      id: "route-glow",
      type: "line",
      source: "route",
      layout: { "line-join": "round", "line-cap": "round" },
      paint: { "line-color": ${JSON.stringify(routeColor)}, "line-width": 14, "line-opacity": 0.22, "line-blur": 6 },
    });
    map.addLayer({
      id: "route",
      type: "line",
      source: "route",
      layout: { "line-join": "round", "line-cap": "round" },
      paint: { "line-color": ${JSON.stringify(routeColor)}, "line-width": 6, "line-opacity": 0.95 },
    });

    map.fitBounds(bounds, { padding: { top: ${fitPadding.top}, bottom: ${fitPadding.bottom}, left: 48, right: 48 }, maxZoom: 15 });

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
