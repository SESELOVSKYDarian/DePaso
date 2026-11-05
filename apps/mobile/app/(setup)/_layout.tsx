import { Stack } from "expo-router";
import { NarrowScreen } from "@/components/common/NarrowScreen";
import { useColors } from "@/lib/theme";

/** Setup posterior al registro (verificación de email → ubicación → lugares → intereses →
 * listo, depaso-verificar-email..depaso-listo en Figma). Sólo alcanzable justo después de un
 * `register()` — ver guard `!postSignupDone` en `app/_layout.tsx`. */
// Si el setup se abre sin una ruta puntual (por ejemplo, al confirmar el mail), arranca por la ubicación.
export const unstable_settings = { initialRouteName: "location" };

export default function SetupLayout() {
  const colors = useColors();
  return (
    <NarrowScreen>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.surface.base },
        }}
      />
    </NarrowScreen>
  );
}
