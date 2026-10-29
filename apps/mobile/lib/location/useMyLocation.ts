import * as Location from "expo-location";
import { useState } from "react";
import { Platform } from "react-native";

export type MyPoint = { latitude: number; longitude: number };

/** Por qué no se pudo ubicar al usuario. */
export type LocationProblem = "denied" | "services-off" | "failed";

/**
 * Busca dónde está el usuario ahora mismo. Si no dio permiso, o tiene la ubicación del celular
 * apagada, devuelve el motivo en `problem` para que la pantalla le explique qué hacer.
 */
export function useMyLocation() {
  const [point, setPoint] = useState<MyPoint | null>(null);
  const [problem, setProblem] = useState<LocationProblem | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  /** Pide permiso (si hace falta), lee el GPS y devuelve el punto, o `null` si no se pudo. */
  const locate = async (): Promise<MyPoint | null> => {
    if (isLocating) return null;
    setIsLocating(true);
    setProblem(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setProblem("denied");
        return null;
      }
      // En Android se puede pedir que prenda la ubicación con un cartel del sistema.
      if (!(await Location.hasServicesEnabledAsync())) {
        if (Platform.OS !== "android") {
          setProblem("services-off");
          return null;
        }
        try {
          await Location.enableNetworkProviderAsync();
        } catch {
          setProblem("services-off");
          return null;
        }
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const found = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      setPoint(found);
      return found;
    } catch {
      setProblem("failed");
      return null;
    } finally {
      setIsLocating(false);
    }
  };

  return { point, problem, isLocating, locate, clearProblem: () => setProblem(null) };
}
