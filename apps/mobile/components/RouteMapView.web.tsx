import { useEffect, useMemo, useRef } from "react";
import { radii } from "@depaso/design-tokens";
import { useTheme } from "@/lib/theme";
import { buildRouteMapHtml, type BuildRouteMapHtmlOptions } from "@/lib/map/buildRouteMapHtml";

export type RouteMapViewProps = Omit<BuildRouteMapHtmlOptions, "colors" | "isDark"> & {
  selectedStoreId?: string | null;
  onSelectStore?: (id: string) => void;
  height?: number;
  fill?: boolean;
};

/**
 * Mapa visual con ruta dibujada (Fase 17) — versión web: `react-native-webview` no tiene
 * build para web, así que acá se usa un `iframe` directo con el mismo HTML de Mapbox GL JS
 * (`buildRouteMapHtml`, compartido con `RouteMapView.tsx` nativo). Expo Router resuelve
 * este archivo automáticamente en vez de `RouteMapView.tsx` cuando corre en el navegador.
 */
export function RouteMapView({ selectedStoreId, onSelectStore, height = 300, fill = false, ...options }: RouteMapViewProps) {
  const { colors, isDark } = useTheme();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const html = useMemo(
    () => buildRouteMapHtml({ ...options, colors, isDark }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options.waypoints, options.polyline, options.mapboxToken, options.stores, options.basePolyline, colors, isDark],
  );

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow || typeof event.data !== "string") return;
      try {
        const message = JSON.parse(event.data) as { type?: string; id?: string };
        if (message.type === "store" && typeof message.id === "string") onSelectStore?.(message.id);
      } catch {
        // No es un mensaje del mapa.
      }
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [onSelectStore]);

  useEffect(() => {
    if (!selectedStoreId) return;
    const frameWindow = frameRef.current?.contentWindow as (Window & { selectStore?: (id: string, tap: boolean) => void }) | null | undefined;
    frameWindow?.selectStore?.(selectedStoreId, false);
  }, [selectedStoreId]);

  return (
    <iframe
      ref={frameRef}
      title="Mapa del recorrido"
      srcDoc={html}
      style={{
        height: fill ? "100%" : height,
        flex: fill ? 1 : undefined,
        width: "100%",
        border: `1px solid ${colors.border.subtle}`,
        borderRadius: radii.xl,
        backgroundColor: colors.surface.secondary,
      }}
    />
  );
}
