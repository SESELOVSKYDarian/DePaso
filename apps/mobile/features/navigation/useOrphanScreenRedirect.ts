import { router, useRootNavigationState, useSegments } from "expo-router";
import { useEffect } from "react";

/** El estado de la sesión que decide en qué parte de la app se está. */
interface SessionStage {
  onboardingSeen: boolean;
  isAuthenticated: boolean;
  /** Cuenta nueva con el mail sin confirmar. */
  needsEmail: boolean;
  postSignupDone: boolean;
}

/** A dónde corresponde estar según el estado de la sesión. */
export function homeForStage({ onboardingSeen, isAuthenticated, needsEmail, postSignupDone }: SessionStage): string {
  if (!onboardingSeen) return "/onboarding";
  if (!isAuthenticated) return "/(auth)";
  if (needsEmail) return "/verify-email";
  if (!postSignupDone) return "/(setup)/location";
  return "/(tabs)";
}

/**
 * El manual y los textos legales se pueden abrir con o sin sesión, y por eso expo-router los
 * elige como pantalla de arranque cuando todavía no hay otra a la vista (la bienvenida, el código
 * del mail…): la persona quedaba ahí, sin salida. Si una de esas pantallas aparece sin ninguna
 * anterior en la pila, se la manda a donde corresponde.
 */
export function useOrphanScreenRedirect(home: string, isBootstrapping: boolean): void {
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const isInfoScreen = segments[0] === "how-to" || segments[0] === "legal";
  // "sin ninguna anterior" = es la única pantalla de la pila
  const isAlone = (navigationState?.routes.length ?? 0) === 1;
  useEffect(() => {
    if (isBootstrapping) return;
    if (isInfoScreen && isAlone) router.replace(home as never);
  }, [isBootstrapping, isInfoScreen, isAlone, home]);
}