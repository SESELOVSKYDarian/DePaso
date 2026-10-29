import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { radii } from "@depaso/design-tokens";
import { makeStyles, useColors } from "@/lib/theme";

/** Indicador de selección: círculo vacío o relleno con tilde (no depende sólo del color). */
export function SelectionMark({ selected }: { selected: boolean }) {
  const colors = useColors();
  const styles = useStyles();
  return (
    <View style={[styles.mark, selected ? styles.markOn : null]}>
      {selected ? <Ionicons name="checkmark" size={16} color={colors.text.onNavy} /> : null}
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    mark: {
      width: 24,
      height: 24,
      borderRadius: radii.full,
      borderWidth: 1.5,
      borderColor: colors.border.strong,
      alignItems: "center",
      justifyContent: "center",
    },
    markOn: {
      backgroundColor: colors.brand.navy,
      borderColor: colors.brand.navy,
    },
  }),
);
