import type { PlaceSuggestionResponse } from "@depaso/validation";
import { useEffect, useRef, useState } from "react";
import { geocodeClient } from "@/lib/apiClient";

/** Pausa al escribir antes de buscar: evita una consulta por cada letra. */
const TYPING_PAUSE_MS = 350;
/** Con menos letras que esto no se busca. */
const MIN_LETTERS = 2;

/**
 * Busca lugares mientras se escribe (comercios, escuelas, calles, barrios), como las
 * sugerencias de Google Maps. `near` hace que salgan primero los más cercanos.
 */
export function usePlaceSearch(query: string, near?: { latitude: number; longitude: number } | null) {
  const [results, setResults] = useState<PlaceSuggestionResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [failed, setFailed] = useState(false);
  const lastRequest = useRef(0);

  const text = query.trim();
  const latitude = near?.latitude;
  const longitude = near?.longitude;

  useEffect(() => {
    if (text.length < MIN_LETTERS) {
      setResults([]);
      setIsSearching(false);
      setFailed(false);
      return;
    }
    const id = ++lastRequest.current;
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const { results: found } = await geocodeClient.search({ q: text, latitude, longitude });
        if (id !== lastRequest.current) return; // llegó tarde: ya hay una búsqueda más nueva
        setResults(found);
        setFailed(false);
      } catch {
        if (id !== lastRequest.current) return;
        setResults([]);
        setFailed(true);
      } finally {
        if (id === lastRequest.current) setIsSearching(false);
      }
    }, TYPING_PAUSE_MS);
    return () => clearTimeout(timer);
  }, [text, latitude, longitude]);

  return { results, isSearching, failed, hasQuery: text.length >= MIN_LETTERS };
}
