import { StyleSheet, View } from "react-native";
import WebView from "react-native-webview";
import { colors, radii } from "@depaso/design-tokens";
import { buildRouteMapHtml, type BuildRouteMapHtmlOptions } from "@/lib/map/buildRouteMapHtml";

/**
 * Mapa visual con ruta dibujada (Fase 17) — nativo (iOS/Android): `react-native-webview`
 * cargando Mapbox GL JS. La versión web vive en `RouteMapView.web.tsx` porque
 * `react-native-webview` no tiene build para web (Metro/Expo resuelve el archivo correcto
 * por plataforma automáticamente, no hace falta un `Platform.select` acá).
 */
export function RouteMapView(props: BuildRouteMapHtmlOptions) {
  return (
    <View style={styles.container}>
      <WebView originWhitelist={["*"]} source={{ html: buildRouteMapHtml(props) }} style={styles.webview} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 260,
    borderRadius: radii.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  webview: {
    flex: 1,
    backgroundColor: colors.surface.secondary,
  },
});
