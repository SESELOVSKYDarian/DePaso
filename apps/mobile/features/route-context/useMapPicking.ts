import { useRef, useState } from "react";
import { mapConfigClient } from "@/lib/apiClient";

type Point = { latitude: number; longitude: number };

/**
 * Elegir un lugar tocando el mapa: abre el modal, trae el token de Mapbox la primera vez
 * y busca la dirección del punto tocado (descarta respuestas viejas si se toca rápido).
 */
export function useMapPicking(describePoint: (point: Point) => Promise<string | null>) {
  const [isOpen, setIsOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [picked, setPicked] = useState<Point | null>(null);
  const [pickedAddress, setPickedAddress] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const lastRequest = useRef(0);

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

  const pick = async (point: Point) => {
    const id = ++lastRequest.current;
    setPicked(point);
    setPickedAddress(null);
    setIsResolving(true);
    const address = await describePoint(point);
    if (id !== lastRequest.current) return;
    setPickedAddress(address);
    setIsResolving(false);
  };

  return { isOpen, token, picked, pickedAddress, isResolving, open, close, pick };
}
