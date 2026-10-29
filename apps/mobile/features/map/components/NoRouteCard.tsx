import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { makeStyles, useColors } from "@/lib/theme";

/** Aviso de que todavía no hay recorrido: invita a elegirlo (o a buscar lugares arriba). */
export function NoRouteCard({ stopCount }: { stopCount: number }) {
  const styles = useStyles();
  const colors = useColors();

  return (
    <View style={styles.card}>
      <Ionicons name="navigate-outline" size={28} color={colors.brand.route} />
      <Text style={styles.title}>Todavía no tenés una ruta activa</Text>
      <Text style={styles.description}>
        {stopCount === 1
          ? "Ya tenés una parada. Sumá otra buscando un lugar arriba, o armá el recorrido completo."
          : "Buscá un lugar arriba y sumalo, o elegí de dónde salís y a dónde vas. Te mostramos qué tenés de paso."}
      </Text>
      <AnimatedPressable accessibilityLabel="Elegir recorrido" onPress={() => router.push("/route-context")} style={styles.action}>
        <Text style={styles.actionLabel}>Elegir mi recorrido</Text>
      </AnimatedPressable>
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    card: {
      alignItems: "center",
      gap: spacing.sm,
      padding: spacing.xl,
      borderRadius: radii.xl,
      backgroundColor: colors.surface.primary,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    title: { fontFamily: typography.itemTitle.fontFamily, fontSize: 17, color: colors.text.primary, textAlign: "center" },
    description: { fontFamily: typography.body.fontFamily, fontSize: 13, color: colors.text.secondary, textAlign: "center" },
    action: {
      marginTop: spacing.sm,
      minHeight: 44,
      paddingHorizontal: spacing.xl,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radii.full,
      backgroundColor: colors.brand.navy,
    },
    actionLabel: { fontFamily: typography.buttonLabel.fontFamily, fontSize: 15, color: colors.text.onNavy },
  }),
);
