import { useEffect, useState } from "react";
import { mapConfigClient } from "@/lib/apiClient";

/** Token de Mapbox para dibujar el mapa. Es `null` mientras carga o si no está configurado. */
export function useMapToken(): string | null {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    mapConfigClient
      .getMapboxToken()
      .then((config) => {
        if (!cancelled) setToken(config.token);
      })
      .catch(() => {
        // Sin token no hay mapa visual: la pantalla avisa y el resto sigue andando.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return token;
}
