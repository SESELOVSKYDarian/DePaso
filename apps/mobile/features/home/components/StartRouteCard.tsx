import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { Button } from "@/components/common/Button";
import { makeStyles, useColors } from "@/lib/theme";

interface StartRouteCardProps {
  /** Paradas del recorrido de hoy; vacío si todavía no se eligió. */
  routeNames: string[];
  label: string;
  hint: string;
  onPress: () => void;
}

/** Inicio sin lista armada: un solo botón para arrancar el recorrido (y el recorrido de hoy si ya existe). */
export function StartRouteCard({ routeNames, label, hint, onPress }: StartRouteCardProps) {
  const styles = useStyles();
  const colors = useColors();

  return (
    <View style={styles.card}>
      {routeNames.length > 0 ? (
        <View style={styles.route}>
          <Ionicons name="navigate-outline" size={18} color={colors.text.secondary} />
          <Text style={styles.routeText} numberOfLines={1}>
            {routeNames.join(" → ")}
          </Text>
        </View>
      ) : null}
      <Button label={label} onPress={onPress} />
      <Text style={styles.hint}>{hint}</Text>
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    card: {
      gap: spacing.md,
      padding: spacing.lg,
      borderRadius: radii.xl,
      backgroundColor: colors.surface.primary,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    route: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    routeText: { flex: 1, fontFamily: typography.body.fontFamily, fontSize: 14, color: colors.text.secondary },
    hint: { fontFamily: typography.body.fontFamily, fontSize: 13, color: colors.text.secondary, textAlign: "center" },
  }),
);
