import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { makeStyles, useColors } from "@/lib/theme";

interface RouteChoiceCardProps {
  name: string;
  /** Paradas en orden: "Casa → Técnica 5". */
  stopNames: string[];
  emoji: string;
  selected: boolean;
  onSelect: () => void;
  /** Sin esto no se muestra la papelera (el recorrido de hoy sin guardar no se borra). */
  onDelete?: () => void;
}

/** Una ruta para elegir: ícono, nombre, paradas y un círculo que se llena en verde al elegirla. */
export function RouteChoiceCard({ name, stopNames, emoji, selected, onSelect, onDelete }: RouteChoiceCardProps) {
  const colors = useColors();
  const styles = useStyles();
  return (
    // la tarjeta es un contenedor: elegir y borrar son dos botones hermanos (no uno dentro del otro)
    <View style={[styles.card, selected ? styles.cardSelected : null]}>
      <AnimatedPressable
        accessibilityLabel={`${selected ? "Elegida: " : "Elegir "}${name}`}
        haptic={false}
        onPress={onSelect}
        style={styles.pick}
      >
        <View style={styles.tile}>
          <Text style={styles.emoji}>{emoji}</Text>
        </View>
        <View style={styles.text}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {stopNames.length} {stopNames.length === 1 ? "parada" : "paradas"} · {stopNames.join(" → ")}
          </Text>
        </View>
        <View style={[styles.radio, selected ? styles.radioOn : null]}>
          {selected ? <View style={styles.radioDot} /> : null}
        </View>
      </AnimatedPressable>
      {onDelete ? (
        <AnimatedPressable accessibilityLabel={`Borrar la ruta ${name}`} haptic={false} onPress={onDelete} style={styles.delete}>
          <Ionicons name="trash-outline" size={18} color={colors.text.tertiary} />
        </AnimatedPressable>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      minHeight: 72,
      paddingLeft: spacing.md,
      paddingRight: spacing.xs,
      borderRadius: radii.xl,
      backgroundColor: colors.surface.primary,
      borderWidth: 1.5,
      borderColor: colors.border.subtle,
    },
    cardSelected: { borderColor: colors.brand.accent, backgroundColor: colors.tint.green.bg },
    pick: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md },
    tile: {
      width: 44,
      height: 44,
      borderRadius: radii.md,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.tint.green.bg,
      borderWidth: 1,
      borderColor: colors.tint.green.border,
    },
    emoji: { fontSize: 22 },
    text: { flex: 1, gap: 2 },
    name: { fontFamily: typography.itemTitle.fontFamily, fontSize: 16, color: colors.text.primary },
    meta: { fontFamily: typography.body.fontFamily, fontSize: 12, color: colors.text.secondary },
    delete: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
    radio: {
      width: 24,
      height: 24,
      borderRadius: radii.full,
      borderWidth: 2,
      borderColor: colors.border.strong,
      alignItems: "center",
      justifyContent: "center",
    },
    radioOn: { borderColor: colors.brand.accent, backgroundColor: colors.brand.accent },
    radioDot: { width: 8, height: 8, borderRadius: radii.full, backgroundColor: colors.text.onLime },
  }),
);
