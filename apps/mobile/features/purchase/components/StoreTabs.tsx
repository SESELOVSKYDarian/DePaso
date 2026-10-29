import { ScrollView, StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { StoreBadge } from "@/components/stores/StoreBadge";
import { makeStyles } from "@/lib/theme";
import { pesos, stopSubtotal, type PlanStop } from "../helpers";

interface StoreTabsProps {
  stops: PlanStop[];
  selectedIndex: number;
  /** Cuántos productos de cada comercio ya están tildados. */
  doneCounts: number[];
  onSelect: (index: number) => void;
}

/** Una pestaña por comercio de la compra: logo, cuánto falta y el subtotal. */
export function StoreTabs({ stops, selectedIndex, doneCounts, onSelect }: StoreTabsProps) {
  const styles = useStyles();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {stops.map((stop, index) => {
        const selected = index === selectedIndex;
        const finished = doneCounts[index] === stop.items.length;
        return (
          <AnimatedPressable
            key={stop.storeBranchId}
            accessibilityLabel={`Ver los productos de ${stop.storeName}`}
            haptic={false}
            onPress={() => onSelect(index)}
            style={[styles.tab, selected ? styles.tabSelected : null]}
          >
            <StoreBadge storeName={stop.storeName} size={34} />
            <View>
              <Text style={styles.name} numberOfLines={1}>
                {stop.storeName}
              </Text>
              <Text style={[styles.meta, finished ? styles.metaDone : null]} numberOfLines={1}>
                {finished ? "Listo ✓" : `${stop.items.length} productos · ${pesos(stopSubtotal(stop))}`}
              </Text>
            </View>
          </AnimatedPressable>
        );
      })}
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    row: { gap: spacing.sm, paddingVertical: spacing.xs },
    tab: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      minWidth: 150,
      padding: spacing.sm,
      borderRadius: radii.lg,
      backgroundColor: colors.surface.primary,
      borderWidth: 1.5,
      borderColor: colors.border.subtle,
    },
    tabSelected: { borderColor: colors.brand.route, backgroundColor: colors.tint.blue.bg },
    name: { fontFamily: typography.itemTitle.fontFamily, fontSize: 14, color: colors.text.primary, maxWidth: 110 },
    meta: { fontFamily: typography.caption.fontFamily, fontSize: 11, color: colors.text.secondary },
    metaDone: { color: colors.state.successStrong },
  }),
);
