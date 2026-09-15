import { colors, radii } from "@depaso/design-tokens";
import { buildRouteMapHtml, type BuildRouteMapHtmlOptions } from "@/lib/map/buildRouteMapHtml";

/**
 * Mapa visual con ruta dibujada (Fase 17) — versión web: `react-native-webview` no tiene
 * build para web, así que acá se usa un `iframe` directo con el mismo HTML de Mapbox GL JS
 * (`buildRouteMapHtml`, compartido con `RouteMapView.tsx` nativo). Expo Router resuelve
 * este archivo automáticamente en vez de `RouteMapView.tsx` cuando corre en el navegador.
 */
export function RouteMapView(props: BuildRouteMapHtmlOptions) {
  return (
    <iframe
      title="Mapa del recorrido"
      srcDoc={buildRouteMapHtml(props)}
      style={{
        height: 260,
        width: "100%",
        border: `1px solid ${colors.border.subtle}`,
        borderRadius: radii.xl,
        backgroundColor: colors.surface.secondary,
      }}
    />
  );
}
