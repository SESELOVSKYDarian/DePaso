import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";

/**
 * En Android la app se dibuja de borde a borde y el teclado se pone ENCIMA de la pantalla sin
 * achicarla: los campos de abajo quedaban tapados y no se veía lo que se escribía. Acá se achica
 * toda la app lo que ocupa el teclado, así lo que se está escribiendo queda siempre a la vista.
 * En iPhone cada pantalla ya lo resuelve sola; en la web no hay teclado en pantalla.
 */
export function KeyboardAvoidingRoot({ children }: { children: ReactNode }) {
  if (Platform.OS !== "android") return <>{children}</>;
  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      {children}
    </KeyboardAvoidingView>
  );
}