import { Stack } from "expo-router";
import { colors } from "@depaso/design-tokens";

/** Setup posterior al registro (verificación de email → ubicación → lugares → intereses →
 * listo, depaso-verificar-email..depaso-listo en Figma). Sólo alcanzable justo después de un
 * `register()` — ver guard `!postSignupDone` en `app/_layout.tsx`. */
export default function SetupLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.surface.base },
      }}
    />
  );
}
