import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TextInput, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { makeStyles, useColors } from "@/lib/theme";

interface SearchFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
}

/** Buscador redondeado con lupa: el mismo en Listas, Actividad y donde haga falta filtrar. */
export function SearchField({ value, onChangeText, placeholder }: SearchFieldProps) {
  const colors = useColors();
  const styles = useStyles();
  return (
    <View style={styles.box}>
      <Ionicons name="search-outline" size={18} color={colors.text.tertiary} />
      <TextInput
        accessibilityLabel={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.tertiary}
        style={styles.input}
        autoCorrect={false}
      />
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    box: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      minHeight: 48,
      paddingHorizontal: spacing.md,
      borderRadius: radii.lg,
      backgroundColor: colors.surface.primary,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    input: {
      flex: 1,
      fontFamily: typography.body.fontFamily,
      fontSize: 15,
      color: colors.text.primary,
      // en web evita el contorno del navegador alrededor del campo
      outlineStyle: "none",
    } as object,
  }),
);
