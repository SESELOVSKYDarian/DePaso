import { Ionicons } from "@expo/vector-icons";
import type { HomeListSummary } from "@depaso/validation";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { Button } from "@/components/common/Button";
import { makeStyles, useColors } from "@/lib/theme";
import { money } from "../helpers";

interface ListSummaryCardProps {
  list: HomeListSummary;
  /** Paradas del recorrido de hoy, en orden. */
  routeNames: string[];
  actionLabel: string;
  actionHint: string;
  onAction: () => void;
}

/** Tablero de Inicio: la lista activa (qué lleva y cuánto saldría), el recorrido y el botón de siempre. */
export function ListSummaryCard({ list, routeNames, actionLabel, actionHint, onAction }: ListSummaryCardProps) {
  const styles = useStyles();
  const colors = useColors();
  const hiddenCount = list.itemCount - list.previewItems.length;
  const totalIsPartial = list.pricedItems < list.itemCount;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>TU LISTA</Text>
          <Text style={styles.name} numberOfLines={1}>
            {list.name}
          </Text>
        </View>
        <AnimatedPressable accessibilityLabel="Ver mi lista" haptic={false} onPress={() => router.push({ pathname: "/lists/[id]", params: { id: list.id } })} style={styles.linkButton}>
          <Text style={styles.link}>Ver</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} />
        </AnimatedPressable>
      </View>

      <View style={styles.items}>
        {list.previewItems.map((item, index) => (
          <Text key={`${item.name}-${index}`} style={styles.item} numberOfLines={1}>
            {item.quantity} × {item.name}
          </Text>
        ))}
        {hiddenCount > 0 ? <Text style={styles.more}>y {hiddenCount} más</Text> : null}
        {list.previewItems.length === 0 ? (
          <Text style={styles.more}>
            {list.itemCount} {list.itemCount === 1 ? "producto" : "productos"}
          </Text>
        ) : null}
      </View>

      {list.cheapestTotal !== null ? (
        <View style={styles.total}>
          <Text style={styles.totalLabel}>Comprando lo más barato de cada uno</Text>
          <Text style={styles.totalValue}>
            {totalIsPartial ? "desde " : ""}
            {money(list.cheapestTotal)}
          </Text>
          {totalIsPartial ? (
            <Text style={styles.totalNote}>
              Con precio: {list.pricedItems} de {list.itemCount} productos.
            </Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.route}>
        <Ionicons name="navigate-outline" size={18} color={colors.text.secondary} />
        <Text style={styles.routeText} numberOfLines={1}>
          {routeNames.join(" → ")}
        </Text>
      </View>

      <Button label={actionLabel} onPress={onAction} />
      <Text style={styles.hint}>{actionHint}</Text>
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
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
    headerText: { flex: 1, gap: 2 },
    eyebrow: { fontFamily: typography.caption.fontFamily, fontSize: 11, letterSpacing: 1, color: colors.text.secondary },
    name: { fontFamily: typography.screenTitle.fontFamily, fontSize: 22, color: colors.text.primary },
    linkButton: { flexDirection: "row", alignItems: "center", gap: 2 },
    link: { fontFamily: typography.itemTitle.fontFamily, fontSize: 14, color: colors.text.secondary },
    items: { gap: spacing.xs },
    item: { fontFamily: typography.body.fontFamily, fontSize: 15, color: colors.text.primary },
    more: { fontFamily: typography.body.fontFamily, fontSize: 13, color: colors.text.secondary },
    total: {
      gap: 2,
      padding: spacing.md,
      borderRadius: radii.lg,
      backgroundColor: colors.surface.base,
    },
    totalLabel: { fontFamily: typography.body.fontFamily, fontSize: 12, color: colors.text.secondary },
    totalValue: { fontFamily: typography.screenTitle.fontFamily, fontSize: 26, color: colors.text.primary },
    totalNote: { fontFamily: typography.body.fontFamily, fontSize: 12, color: colors.text.secondary },
    route: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    routeText: { flex: 1, fontFamily: typography.body.fontFamily, fontSize: 14, color: colors.text.secondary },
    hint: { fontFamily: typography.body.fontFamily, fontSize: 13, color: colors.text.secondary, textAlign: "center" },
  }),
);
