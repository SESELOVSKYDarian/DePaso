import type { BrandLogo } from "@depaso/validation";
import { useEffect, useState } from "react";
import { storesClient } from "@/lib/apiClient";

/** Los logos se piden una sola vez y se comparten entre todas las pantallas. */
let cached: BrandLogo[] | null = null;
let pending: Promise<BrandLogo[]> | null = null;

function loadOnce(): Promise<BrandLogo[]> {
  if (cached) return Promise.resolve(cached);
  pending ??= storesClient
    .listLogos()
    .then((response) => (cached = response.logos))
    .finally(() => {
      pending = null;
    });
  return pending;
}

/** Logos de las cadenas (vacío mientras cargan o si no se pudieron pedir: se usa el ícono genérico). */
export function useBrandLogos(): BrandLogo[] {
  const [logos, setLogos] = useState<BrandLogo[]>(cached ?? []);
  useEffect(() => {
    let active = true;
    loadOnce()
      .then((loaded) => {
        if (active) setLogos(loaded);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);
  return logos;
}
