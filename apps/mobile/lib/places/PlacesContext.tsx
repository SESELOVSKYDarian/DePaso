import type { UserPlaceInput, UserPlaceResponse, UserPlaceUpdate } from "@depaso/validation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { placesClient } from "../apiClient";
import { useAuth } from "../auth/AuthContext";

interface PlacesContextValue {
  places: UserPlaceResponse[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createPlace: (input: UserPlaceInput) => Promise<UserPlaceResponse>;
  updatePlace: (id: string, input: UserPlaceUpdate) => Promise<UserPlaceResponse>;
  removePlace: (id: string) => Promise<void>;
}

const PlacesContext = createContext<PlacesContextValue | null>(null);

/**
 * Estado compartido de lugares guardados (Fase 6). Centralizado en un contexto (mismo
 * patrón que `AuthContext`) en vez de refetch-on-focus: la lista de `app/places/index.tsx`
 * y el form de `app/places/form.tsx` leen/escriben el mismo estado, así que crear/editar/
 * borrar se refleja al instante sin depender de hooks de foco no confirmados en esta
 * versión de expo-router.
 */
export function PlacesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [places, setPlaces] = useState<UserPlaceResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { places: fetched } = await placesClient.list();
      setPlaces(fetched);
    } catch {
      setError("No pudimos cargar tus lugares. Revisá tu conexión.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void refresh();
    } else {
      setPlaces([]);
    }
  }, [isAuthenticated, refresh]);

  const createPlace = useCallback(async (input: UserPlaceInput) => {
    const created = await placesClient.create(input);
    setPlaces((prev) => [...prev, created]);
    return created;
  }, []);

  const updatePlace = useCallback(async (id: string, input: UserPlaceUpdate) => {
    const updated = await placesClient.update(id, input);
    setPlaces((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  }, []);

  const removePlace = useCallback(async (id: string) => {
    await placesClient.remove(id);
    setPlaces((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const value = useMemo<PlacesContextValue>(
    () => ({ places, isLoading, error, refresh, createPlace, updatePlace, removePlace }),
    [places, isLoading, error, refresh, createPlace, updatePlace, removePlace]
  );

  return <PlacesContext.Provider value={value}>{children}</PlacesContext.Provider>;
}

export function usePlaces(): PlacesContextValue {
  const ctx = useContext(PlacesContext);
  if (!ctx) throw new Error("usePlaces debe usarse dentro de <PlacesProvider>");
  return ctx;
}
