import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { colors, radii } from "@depaso/design-tokens";

interface SelectCheckboxProps {
  checked: boolean;
  size?: number;
}

/** Checkbox cuadrado de selección (lugares-habituales, intereses, donde-comprar en Figma):
 * tildado = cuadrado lleno en `brand.accent` con tilde blanca; destildado = cuadrado con
 * borde `border.subtle`, sin relleno. Distinto del `Checkbox` navy circular usado en los
 * checkboxes legales de registro (ese no viene de Figma). */
export function SelectCheckbox({ checked, size = 20 }: SelectCheckboxProps) {
  return (
    <View
      style={[
        styles.box,
        { width: size, height: size },
        checked ? styles.boxChecked : styles.boxUnchecked,
      ]}
    >
      {checked ? <Ionicons name="checkmark" size={size * 0.6} color={colors.text.onLime} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: radii.sm - 4,
    alignItems: "center",
    justifyContent: "center",
  },
  boxChecked: {
    backgroundColor: colors.brand.accent,
    borderWidth: 1,
    borderColor: colors.brand.accent,
  },
  boxUnchecked: {
    borderWidth: 2,
    borderColor: colors.border.subtle,
    backgroundColor: "transparent",
  },
});
