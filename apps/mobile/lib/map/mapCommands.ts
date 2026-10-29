/**
 * Comandos que la app le manda a un mapa que ya está cargado (mover la cámara, mostrar dónde
 * está el usuario, marcar un lugar buscado). Los mapas son páginas de Mapbox GL JS dentro de un
 * WebView (celular) o un iframe (web), así que se hablan con funciones globales de la página.
 */

export type MapPoint = { latitude: number; longitude: number };

/** Mover la cámara a un punto. `nonce` cambia en cada pedido, para poder repetir el mismo lugar. */
export interface MapFocus {
  point: MapPoint;
  zoom?: number;
  nonce: number;
}

/** Los comandos que entiende la página del mapa (los define `buildMapCommandsScript`). */
export interface MapWindow {
  flyTo?: (lat: number, lng: number, zoom?: number) => void;
  setUserLocation?: (lat: number | null, lng?: number) => void;
  setSearchPin?: (lat: number | null, lng?: number) => void;
  placePin?: (lat: number, lng: number) => void;
}

/**
 * Código que se mete dentro de la página del mapa. Necesita que exista la variable `map`.
 * El punto azul es "vos estás acá" (como en Google Maps); el pin de color es el lugar buscado.
 */
export function buildMapCommandsScript(pinColor: string): string {
  return `
  let userMarker = null;
  let searchMarker = null;
  const calmMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  window.flyTo = function (lat, lng, zoom) {
    map.flyTo({ center: [lng, lat], zoom: zoom || 15, duration: calmMotion ? 0 : 700 });
  };

  window.setUserLocation = function (lat, lng) {
    if (userMarker) { userMarker.remove(); userMarker = null; }
    if (lat === null || lat === undefined) return;
    const dot = document.createElement("div");
    dot.style.cssText = "width:18px;height:18px;border-radius:50%;background:#2F80ED;border:3px solid #fff;box-shadow:0 0 0 6px rgba(47,128,237,0.25)";
    userMarker = new mapboxgl.Marker({ element: dot }).setLngLat([lng, lat]).addTo(map);
  };

  window.setSearchPin = function (lat, lng) {
    if (searchMarker) { searchMarker.remove(); searchMarker = null; }
    if (lat === null || lat === undefined) return;
    searchMarker = new mapboxgl.Marker({ color: ${JSON.stringify(pinColor)} }).setLngLat([lng, lat]).addTo(map);
  };
`;
}

const call = (name: string, lat: number | null, lng?: number, zoom?: number) =>
  lat === null ? `window.${name} && window.${name}(null);` : `window.${name} && window.${name}(${lat}, ${lng}${zoom ? `, ${zoom}` : ""});`;

/** Texto para `injectJavaScript` del WebView (celular). */
export const scripts = {
  flyTo: (point: MapPoint, zoom?: number) => `${call("flyTo", point.latitude, point.longitude, zoom)} true;`,
  userLocation: (point: MapPoint | null) => `${call("setUserLocation", point?.latitude ?? null, point?.longitude)} true;`,
  searchPin: (point: MapPoint | null) => `${call("setSearchPin", point?.latitude ?? null, point?.longitude)} true;`,
  placePin: (point: MapPoint) => `${call("placePin", point.latitude, point.longitude)} true;`,
};

/** Lo mismo, pero llamando directo a la ventana del iframe (web). */
export const run = {
  flyTo: (win: MapWindow | null | undefined, point: MapPoint, zoom?: number) => win?.flyTo?.(point.latitude, point.longitude, zoom),
  userLocation: (win: MapWindow | null | undefined, point: MapPoint | null) =>
    point ? win?.setUserLocation?.(point.latitude, point.longitude) : win?.setUserLocation?.(null),
  searchPin: (win: MapWindow | null | undefined, point: MapPoint | null) =>
    point ? win?.setSearchPin?.(point.latitude, point.longitude) : win?.setSearchPin?.(null),
  placePin: (win: MapWindow | null | undefined, point: MapPoint) => win?.placePin?.(point.latitude, point.longitude),
};
