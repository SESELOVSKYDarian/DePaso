import { useAuth } from "@/lib/auth/AuthContext";
import { homeForStage } from "@/lib/navigation/stageRoutes";

/** Dirección de la pantalla que le toca a la persona según el estado de su sesión. */
export function useStageHome(): string {
  const { onboardingSeen, isAuthenticated, postSignupDone, user } = useAuth();
  // cuenta nueva con el mail sin confirmar: primero el código
  const needsEmail = isAuthenticated && Boolean(user?.emailVerificationRequired);
  return homeForStage({ onboardingSeen, isAuthenticated, needsEmail, postSignupDone });
}
