import { useEffect, useMemo, useRef, type ComponentRef } from "react";
import { StyleSheet } from "react-native";
import WebView, { type WebViewMessageEvent } from "react-native-webview";
import { useTheme } from "@/lib/theme";
import { buildPickerMapHtml } from "@/lib/map/buildPickerMapHtml";
import { scripts, type MapFocus, type MapPoint } from "@/lib/map/mapCommands";

export interface MapPickerProps {
  mapboxToken: string;
  center: MapPoint;
  onPick: (point: MapPoint) => void;
  /** Mover la cámara (por ejemplo, al tocar el botón "dónde estoy"). */
  focus?: MapFocus | null;
  /** Dónde está el usuario: se muestra como un punto azul. */
  userLocation?: MapPoint | null;
  /** Poner el pin en un lugar (por ejemplo, al elegir un resultado del buscador). */
  placePin?: MapFocus | null;
}

/** Mapa para elegir un punto tocando (nativo: WebView). La versión web está en `MapPicker.web.tsx`. */
export function MapPicker({ mapboxToken, center, onPick, focus, userLocation, placePin }: MapPickerProps) {
  const { colors, isDark } = useTheme();
  const webViewRef = useRef<ComponentRef<typeof WebView>>(null);
  const loaded = useRef(false);
  // El centro sólo se usa al abrir: mover el mapa no debe recargarlo.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const html = useMemo(() => buildPickerMapHtml({ mapboxToken, center, isDark, pinColor: colors.brand.navy }), [mapboxToken, isDark]);

  // manda un comando al mapa (si la página ya cargó)
  const send = (script: string) => {
    if (loaded.current) webViewRef.current?.injectJavaScript(script);
  };

  useEffect(() => {
    if (focus) send(scripts.flyTo(focus.point, focus.zoom));
  }, [focus?.nonce]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (placePin) send(scripts.placePin(placePin.point));
  }, [placePin?.nonce]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    send(scripts.userLocation(userLocation ?? null));
  }, [userLocation?.latitude, userLocation?.longitude]); // eslint-disable-line react-hooks/exhaustive-deps

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
      ref={webViewRef}
      originWhitelist={["*"]}
      source={{ html }}
      onMessage={handleMessage}
      onLoadEnd={() => {
        loaded.current = true;
        if (userLocation) send(scripts.userLocation(userLocation));
      }}
      style={[styles.map, { backgroundColor: colors.surface.secondary }]}
    />
  );
}

const styles = StyleSheet.create({ map: { flex: 1 } });
