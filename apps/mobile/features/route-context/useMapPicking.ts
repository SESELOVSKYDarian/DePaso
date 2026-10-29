import type { PlaceSuggestionResponse } from "@depaso/validation";
import { useRef, useState } from "react";
import { mapConfigClient } from "@/lib/apiClient";
import type { MapFocus, MapPoint } from "@/lib/map/mapCommands";

/** Acerca la cámara a este nivel cuando se elige un resultado o se encuentra al usuario. */
const PLACE_ZOOM = 16;

/**
 * Elegir un lugar para el recorrido: tocando el mapa, buscándolo por nombre o dirección, o
 * usando la ubicación actual. Abre el modal, trae el token de Mapbox la primera vez y busca la
 * dirección del punto tocado (descarta respuestas viejas si se toca rápido).
 */
export function useMapPicking(describePoint: (point: MapPoint) => Promise<string | null>) {
  const [isOpen, setIsOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [picked, setPicked] = useState<MapPoint | null>(null);
  const [pickedAddress, setPickedAddress] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  // órdenes para el mapa: mover la cámara, poner el pin, mostrar al usuario
  const [focus, setFocus] = useState<MapFocus | null>(null);
  const [placePin, setPlacePin] = useState<MapFocus | null>(null);
  const [userLocation, setUserLocation] = useState<MapPoint | null>(null);
  const lastRequest = useRef(0);
  const nonce = useRef(0);

  /** Abre el mapa. Si no se puede cargar el token, llama a `onFail`. */
  const open = async (onFail: () => void) => {
    setPicked(null);
    setPickedAddress(null);
    setIsOpen(true);
    if (token) return;
    try {
      const config = await mapConfigClient.getMapboxToken();
      setToken(config.token);
    } catch {
      setIsOpen(false);
      onFail();
    }
  };

  const close = () => setIsOpen(false);

  /** Tocó el mapa (o arrastró el pin): se busca la dirección de ese punto. */
  const pick = async (point: MapPoint) => {
    const id = ++lastRequest.current;
    setPicked(point);
    setPickedAddress(null);
    setIsResolving(true);
    const address = await describePoint(point);
    if (id !== lastRequest.current) return;
    setPickedAddress(address);
    setIsResolving(false);
  };

  /** Eligió un resultado del buscador: ya trae su dirección, no hace falta buscarla. */
  const pickFromSearch = (place: PlaceSuggestionResponse) => {
    lastRequest.current++; // descarta una búsqueda de dirección que estuviera en curso
    const point = { latitude: place.latitude, longitude: place.longitude };
    setPicked(point);
    setPickedAddress([place.name, place.address].filter(Boolean).join(", "));
    setIsResolving(false);
    setPlacePin({ point, zoom: PLACE_ZOOM, nonce: ++nonce.current });
  };

  /** Se encontró al usuario: punto azul y la cámara va hacia él (sin elegirlo como lugar). */
  const showUser = (point: MapPoint) => {
    setUserLocation(point);
    setFocus({ point, zoom: PLACE_ZOOM, nonce: ++nonce.current });
  };

  return { isOpen, token, picked, pickedAddress, isResolving, focus, placePin, userLocation, open, close, pick, pickFromSearch, showUser };
}

export type MapPicking = ReturnType<typeof useMapPicking>;
