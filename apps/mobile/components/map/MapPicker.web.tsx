import { useEffect, useMemo, useRef } from "react";
import { useTheme } from "@/lib/theme";
import { buildPickerMapHtml } from "@/lib/map/buildPickerMapHtml";
import type { MapPickerProps } from "./MapPicker";

/** Versión web del selector de punto: `iframe` con el mismo HTML de Mapbox. */
export function MapPicker({ mapboxToken, center, onPick }: MapPickerProps) {
  const { colors, isDark } = useTheme();
  const frameRef = useRef<HTMLIFrameElement>(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const html = useMemo(() => buildPickerMapHtml({ mapboxToken, center, isDark, pinColor: colors.brand.navy }), [mapboxToken, isDark]);

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow || typeof event.data !== "string") return;
      try {
        const message = JSON.parse(event.data) as { type?: string; latitude?: number; longitude?: number };
        if (message.type === "pick" && typeof message.latitude === "number" && typeof message.longitude === "number") {
          onPick({ latitude: message.latitude, longitude: message.longitude });
        }
      } catch {
        // No es un mensaje del mapa.
      }
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [onPick]);

  return (
    <iframe
      ref={frameRef}
      title="Elegir un punto en el mapa"
      srcDoc={html}
      style={{ flex: 1, width: "100%", height: "100%", border: 0, backgroundColor: colors.surface.secondary }}
    />
  );
}
