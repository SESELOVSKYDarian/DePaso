import { MAPBOX_GL_CSS_INTEGRITY, MAPBOX_GL_JS_INTEGRITY, MAPBOX_GL_VERSION } from "./buildRouteMapHtml";
import { buildMapCommandsScript } from "./mapCommands";

export interface BuildPickerMapHtmlOptions {
  mapboxToken: string;
  center: { latitude: number; longitude: number };
  isDark: boolean;
  /** Color del pin elegido. */
  pinColor: string;
}

/**
 * Mapa para elegir un punto tocando, como en Google Maps: se toca (o se arrastra el pin) y la
 * app recibe `{ type: "pick", latitude, longitude }`. Mismo Mapbox GL JS que el mapa de rutas.
 */
export function buildPickerMapHtml({ mapboxToken, center, isDark, pinColor }: BuildPickerMapHtmlOptions): string {
  const mapStyle = isDark ? "mapbox://styles/mapbox/navigation-night-v1" : "mapbox://styles/mapbox/navigation-day-v1";
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no" />
<link href="https://api.mapbox.com/mapbox-gl-js/v${MAPBOX_GL_VERSION}/mapbox-gl.css" rel="stylesheet" integrity="${MAPBOX_GL_CSS_INTEGRITY}" crossorigin="anonymous" />
<script src="https://api.mapbox.com/mapbox-gl-js/v${MAPBOX_GL_VERSION}/mapbox-gl.js" integrity="${MAPBOX_GL_JS_INTEGRITY}" crossorigin="anonymous"></script>
<style>
  html, body { margin: 0; padding: 0; height: 100%; }
  #map { position: absolute; top: 0; bottom: 0; width: 100%; }
  .hint {
    position: absolute; top: 12px; left: 50%; transform: translateX(-50%); z-index: 2;
    padding: 8px 14px; border-radius: 999px; font: 600 13px sans-serif;
    background: ${isDark ? "rgba(28,28,30,0.92)" : "rgba(255,255,255,0.95)"}; color: ${isDark ? "#F5F5F7" : "#111"};
    box-shadow: 0 1px 4px rgba(0,0,0,0.25); pointer-events: none;
  }
</style>
</head>
<body>
<div id="map"></div>
<div class="hint">Tocá el mapa donde vas a estar</div>
<script>
  mapboxgl.accessToken = ${JSON.stringify(mapboxToken)};
  const map = new mapboxgl.Map({
    container: "map",
    style: ${JSON.stringify(mapStyle)},
    center: [${center.longitude}, ${center.latitude}],
    zoom: 14,
  });
  map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");
${buildMapCommandsScript(pinColor)}
  let marker = null;
  function notify(lngLat) {
    const text = JSON.stringify({ type: "pick", latitude: lngLat.lat, longitude: lngLat.lng });
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(text);
    else if (window.parent !== window) window.parent.postMessage(text, "*");
  }
  // Pone (o mueve) el pin. Si avisar es true, la app se entera del nuevo punto.
  function place(lngLat, avisar) {
    if (!marker) {
      marker = new mapboxgl.Marker({ color: ${JSON.stringify(pinColor)}, draggable: true }).setLngLat(lngLat).addTo(map);
      marker.on("dragend", () => notify(marker.getLngLat()));
    } else {
      marker.setLngLat(lngLat);
    }
    map.easeTo({ center: lngLat, duration: 300 });
    if (avisar) notify(marker.getLngLat());
  }
  // La app puede poner el pin sola (por ejemplo, al elegir un resultado del buscador).
  window.placePin = function (lat, lng) {
    place({ lng: lng, lat: lat }, false);
    map.easeTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 16), duration: 400 });
  };
  map.on("click", (event) => place(event.lngLat, true));
</script>
</body>
</html>`;
}
