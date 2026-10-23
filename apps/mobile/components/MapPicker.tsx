import { useMemo } from "react";
import { StyleSheet } from "react-native";
import WebView, { type WebViewMessageEvent } from "react-native-webview";
import { useTheme } from "@/lib/theme";
import { buildPickerMapHtml } from "@/lib/map/buildPickerMapHtml";

export interface MapPickerProps {
  mapboxToken: string;
  center: { latitude: number; longitude: number };
  onPick: (point: { latitude: number; longitude: number }) => void;
}

/** Mapa para elegir un punto tocando (nativo: WebView). La versión web está en `MapPicker.web.tsx`. */
export function MapPicker({ mapboxToken, center, onPick }: MapPickerProps) {
  const { colors, isDark } = useTheme();
  // El centro sólo se usa al abrir: mover el mapa no debe recargarlo.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const html = useMemo(() => buildPickerMapHtml({ mapboxToken, center, isDark, pinColor: colors.brand.navy }), [mapboxToken, isDark]);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data) as { type?: string; latitude?: number; longitude?: number };
      if (message.type === "pick" && typeof message.latitude === "number" && typeof message.longitude === "number") {
        onPick({ latitude: message.latitude, longitude: message.longitude });
      }
    } catch {
      // No es un mensaje del mapa.
    }
  };

  return (
    <WebView
      originWhitelist={["*"]}
      source={{ html }}
      onMessage={handleMessage}
      style={[styles.map, { backgroundColor: colors.surface.secondary }]}
    />
  );
}

const styles = StyleSheet.create({ map: { flex: 1 } });
