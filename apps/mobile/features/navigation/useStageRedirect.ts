import { router, useRootNavigationState, useSegments } from "expo-router";
import { useEffect, useRef } from "react";
import { belongsToStage, LOST_SEGMENTS } from "@/lib/navigation/stageRoutes";

/**
 * Lleva a la persona a donde corresponde en dos casos en que la navegación sola la dejaba perdida:
 *
 * 1. Cuando cambia la etapa de la sesión (confirmó el mail, terminó la configuración, cerró sesión…).
 *    La pantalla en la que estaba deja de existir y la dirección vacía no coincide con ninguna
 *    pantalla: aparecía "Unmatched Route". Se la manda a la pantalla de la etapa nueva.
 * 2. El manual y los textos legales se pueden abrir con o sin sesión, y por eso expo-router los
 *    elige como pantalla de arranque cuando todavía no hay otra a la vista: quedaba ahí sin salida.
 *    Si una de esas pantallas aparece sin ninguna anterior en la pila, se la manda a su etapa.
 */
export function useStageRedirect(home: string, isBootstrapping: boolean): void {
  const segments = useSegments() as string[];
  const navigationState = useRootNavigationState();
  const previousHome = useRef<string | null>(null);
  // dónde está la persona justo ahora (se lee con una pausa, cuando ya terminaron otras navegaciones)
  const currentSegment = useRef<string | undefined>(undefined);
  currentSegment.current = segments[0];

  const isLost = LOST_SEGMENTS.includes(segments[0] ?? "");
  const isInfoScreen = segments[0] === "how-to" || segments[0] === "legal";

  // la etapa cambió mientras la app estaba abierta
  useEffect(() => {
    if (isBootstrapping) return;
    const changed = previousHome.current !== null && previousHome.current !== home;
    previousHome.current = home;
    if (!changed) return;
    // se espera un instante: si alguna pantalla ya navegó sola a un lugar de la etapa nueva
    // (por ejemplo "Comenzar" hacia Registrarse), no se la pisa
    const timer = setTimeout(() => {
      if (!belongsToStage(home, currentSegment.current)) router.replace(home as never);
    }, 120);
    return () => clearTimeout(timer);
  }, [home, isBootstrapping]);

  // pantalla perdida: siempre se corrige
  useEffect(() => {
    if (!isBootstrapping && isLost) router.replace(home as never);
  }, [isBootstrapping, isLost, home]);

  // manual o textos legales sueltos (sin ninguna pantalla anterior a la que volver). Se revisa con
  // una pausa y preguntándole al router en ese momento: si se abren a propósito (ej. "Términos"
  // desde el registro) la pantalla anterior ya está en la pila y no se toca.
  useEffect(() => {
    if (isBootstrapping || !isInfoScreen) return;
    const timer = setTimeout(() => {
      if (!router.canGoBack()) router.replace(home as never);
    }, 150);
    return () => clearTimeout(timer);
  }, [isBootstrapping, isInfoScreen, home]);
}