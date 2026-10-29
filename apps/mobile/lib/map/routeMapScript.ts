import { buildMapCommandsScript } from "./mapCommands";

/** Todo lo que el script del mapa necesita saber de afuera; ya viene listo para insertar. */
export interface RouteMapScriptInput {
  mapboxToken: string;
  /** Estilo de Mapbox ("mapbox://styles/..."). */
  mapStyle: string;
  waypointsJson: string;
  polylineJson: string;
  basePolylineJson: string;
  storesJson: string;
  routeColor: string;
  /** Color del punto azul de "dónde estoy" y del pin de búsqueda. */
  pinColor: string;
  isDark: boolean;
  fitPadding: { top: number; bottom: number };
}

/**
 * Código JavaScript que corre dentro del mapa: dibuja la ruta (con animación), las paradas y los
 * comercios, y avisa a la app cuando se toca uno.
 */
export function routeMapScript(input: RouteMapScriptInput): string {
  const { mapboxToken, mapStyle, waypointsJson, polylineJson, basePolylineJson, storesJson, routeColor, pinColor, isDark, fitPadding } = input;
  return `
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
${buildMapCommandsScript(pinColor)}

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
`;
}
