import { Redirect } from "expo-router";
import { useStageHome } from "@/features/navigation/useStageHome";

/**
 * Pantalla para toda dirección que no existe. Cuando la sesión cambia de etapa (confirmó el mail,
 * terminó la configuración…) la pantalla en la que estaba deja de existir y expo-router mostraba
 * "Unmatched Route". Acá no se muestra nada: se manda a la persona a la pantalla de su etapa.
 */
export default function NotFoundScreen() {
  return <Redirect href={useStageHome() as never} />;
}
