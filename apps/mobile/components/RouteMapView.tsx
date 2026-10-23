import { useEffect, useMemo, useRef, type ComponentRef } from "react";
import { StyleSheet, View } from "react-native";
import WebView, { type WebViewMessageEvent } from "react-native-webview";
import { radii } from "@depaso/design-tokens";
import { makeStyles, useTheme } from "@/lib/theme";
import { buildRouteMapHtml, type BuildRouteMapHtmlOptions } from "@/lib/map/buildRouteMapHtml";

export type RouteMapViewProps = Omit<BuildRouteMapHtmlOptions, "colors" | "isDark"> & {
  /** Comercio resaltado (el mapa se centra en él). */
  selectedStoreId?: string | null;
  /** Se llama cuando la persona toca un comercio en el mapa. */
  onSelectStore?: (id: string) => void;
  height?: number;
};

/**
 * Mapa visual con ruta dibujada (Fase 17) — nativo (iOS/Android): `react-native-webview`
 * cargando Mapbox GL JS. La versión web vive en `RouteMapView.web.tsx` porque
 * `react-native-webview` no tiene build para web (Metro/Expo resuelve el archivo correcto
 * por plataforma automáticamente, no hace falta un `Platform.select` acá).
 *
 * El HTML sólo se rearma si cambian la ruta, los comercios o el tema: elegir un comercio no
 * recarga el mapa, se le avisa por `injectJavaScript`.
 */
export function RouteMapView({ selectedStoreId, onSelectStore, height = 300, ...options }: RouteMapViewProps) {
  const styles = useStyles();
  const { colors, isDark } = useTheme();
  const webViewRef = useRef<ComponentRef<typeof WebView>>(null);
  const loaded = useRef(false);

  const html = useMemo(
    () => buildRouteMapHtml({ ...options, colors, isDark }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options.waypoints, options.polyline, options.mapboxToken, options.stores, options.basePolyline, colors, isDark],
  );

  const select = (id: string | null) => {
    if (!loaded.current || !id) return;
    webViewRef.current?.injectJavaScript(`window.selectStore && window.selectStore(${JSON.stringify(id)}, false); true;`);
  };

  useEffect(() => {
    select(selectedStoreId ?? null);
  }, [selectedStoreId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data) as { type?: string; id?: string };
      if (message.type === "store" && typeof message.id === "string") onSelectStore?.(message.id);
    } catch {
      // Mensajes que no son nuestros: se ignoran.
    }
  };

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ html }}
        style={styles.webview}
        onMessage={handleMessage}
        onLoadEnd={() => {
          loaded.current = true;
          select(selectedStoreId ?? null);
        }}
      />
    </View>
  );
}

const useStyles = makeStyles((colors) => StyleSheet.create({
  container: {
    borderRadius: radii.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  webview: {
    flex: 1,
    backgroundColor: colors.surface.secondary,
  },
}));
