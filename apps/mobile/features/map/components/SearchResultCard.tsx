import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { makeStyles, useColors } from "@/lib/theme";
import type { PickedPlace } from "../useMapSearch";

interface SearchResultCardProps {
  place: PickedPlace;
  /** Texto del botón principal ("Sumar como parada" o "Usar en mi recorrido"). */
  actionLabel: string;
  onAdd: () => void;
  onClose: () => void;
}

/** Tarjeta del lugar elegido: nombre, dirección y el botón para sumarlo al recorrido. */
export function SearchResultCard({ place, actionLabel, onAdd, onClose }: SearchResultCardProps) {
  const styles = useStyles();
  const colors = useColors();

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Ionicons name={place.kind === "poi" ? "storefront-outline" : "location-outline"} size={22} color={colors.text.primary} />
        <View style={styles.text}>
          <Text style={styles.name} numberOfLines={2}>
            {place.name}
          </Text>
          <Text style={styles.address} numberOfLines={2}>
            {place.address}
          </Text>
        </View>
        <AnimatedPressable accessibilityLabel="Cerrar este lugar" haptic={false} onPress={onClose}>
          <Ionicons name="close" size={20} color={colors.text.secondary} />
        </AnimatedPressable>
      </View>
      <AnimatedPressable accessibilityLabel={actionLabel} onPress={onAdd} style={styles.action}>
        <Ionicons name="add" size={18} color={colors.text.onNavy} />
        <Text style={styles.actionLabel}>{actionLabel}</Text>
      </AnimatedPressable>
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
    head: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
    text: { flex: 1, gap: 2 },
    name: { fontFamily: typography.itemTitle.fontFamily, fontSize: 16, color: colors.text.primary },
    address: { fontFamily: typography.body.fontFamily, fontSize: 13, color: colors.text.secondary },
    action: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      minHeight: 44,
      borderRadius: radii.full,
      backgroundColor: colors.brand.navy,
    },
    actionLabel: { fontFamily: typography.buttonLabel.fontFamily, fontSize: 15, color: colors.text.onNavy },
  }),
);
