import { Platform } from "react-native";

/**
 * Hoja que sube desde abajo. En iOS es la hoja nativa (con manija y alturas); en Android se usa
 * el modal común, porque `formSheet` de react-native-screens todavía da problemas ahí
 * (la pantalla se cuelga al abrirla).
 */
export const sheet = (detents: number[]) =>
  Platform.OS === "ios"
    ? {
        presentation: "formSheet" as const,
        sheetAllowedDetents: detents,
        sheetGrabberVisible: true,
        sheetCornerRadius: 24,
      }
    : { presentation: "modal" as const };
