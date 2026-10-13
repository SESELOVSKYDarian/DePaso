import type { ColorTokens } from "@depaso/design-tokens";
import { useMemo } from "react";
import { useColors } from "./ThemeContext";

/**
 * `StyleSheet.create` que depende del esquema de color. Devuelve un hook:
 *
 *   const useStyles = makeStyles((colors) => StyleSheet.create({ box: { backgroundColor: colors.surface.primary } }));
 *   function Screen() { const styles = useStyles(); ... }
 *
 * Los estilos se recalculan sólo cuando cambia la paleta (claro ↔ oscuro).
 */
export function makeStyles<T>(factory: (colors: ColorTokens) => T): () => T {
  return function useStyles(): T {
    const colors = useColors();
    return useMemo(() => factory(colors), [colors]);
  };
}
