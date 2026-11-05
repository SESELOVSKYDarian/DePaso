import type { NearbyPrice } from "@depaso/validation";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Linking, StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { formatDistance } from "@/lib/purchase/progress";
import { makeStyles, useColors } from "@/lib/theme";
import { pesos, type PlanItem, type PlanStop } from "../helpers";
import { useNearbyAlternatives } from "../useNearbyAlternatives";

interface SoldOutSuggestionsProps {
  stop: PlanStop;
  item: PlanItem;
  /** Cuántas unidades faltan conseguir. */
  missing: number;
}

/** Abre el mapa del teléfono con el camino hasta el comercio. */
const openDirections = (option: NearbyPrice) =>
  void Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${option.latitude},${option.longitude}`);

/** Lo que se muestra cuando no había más de un producto: dónde conseguirlo, lo más barato y cercano. */
export function SoldOutSuggestions({ stop, item, missing }: SoldOutSuggestionsProps) {
  const styles = useStyles();
  const colors = useColors();
  const state = useNearbyAlternatives(stop, item, true);

  if (state.status === "idle") return null;
  if (state.status === "loading") {
    return (
      <View style={styles.box}>
        <ActivityIndicator color={colors.text.secondary} />
      </View>
    );
  }
  if (state.status === "failed" || state.options.length === 0) {
    return (
      <View style={styles.box}>
        <Text style={styles.empty}>No encontramos otro comercio cerca que lo tenga. Podés dejarlo para otra vuelta.</Text>
      </View>
    );
  }

  const [best, ...others] = state.options;
  const difference = best!.unitPrice - item.unitPrice;
  return (
    <View style={styles.box}>
      <Text style={styles.eyebrow}>LO MÁS CONVENIENTE PARA LAS {missing} QUE FALTAN</Text>
      <View style={styles.best}>
        <View style={styles.bestText}>
          <Text style={styles.store}>{best!.storeName}</Text>
          <Text style={styles.detail}>
            A {formatDistance(best!.distanceMeters)} · {best!.address}
          </Text>
          <Text style={styles.price}>
            {pesos(best!.unitPrice)} c/u · {pesos(best!.unitPrice * missing)} en total
          </Text>
          {difference !== 0 ? (
            <Text style={difference < 0 ? styles.better : styles.worse}>
              {difference < 0 ? `${pesos(-difference)} menos` : `${pesos(difference)} más`} que acá
            </Text>
          ) : null}
        </View>
        <AnimatedPressable accessibilityLabel={`Cómo llegar a ${best!.storeName}`} haptic={false} onPress={() => openDirections(best!)} style={styles.go}>
          <Ionicons name="navigate" size={18} color={colors.text.onNavy} />
          <Text style={styles.goText}>Ir</Text>
        </AnimatedPressable>
      </View>
      {others.map((option) => (
        <AnimatedPressable key={option.branchId} accessibilityLabel={`Cómo llegar a ${option.storeName}`} haptic={false} onPress={() => openDirections(option)} style={styles.other}>
          <Text style={styles.otherText} numberOfLines={1}>
            {option.storeName} · a {formatDistance(option.distanceMeters)}
          </Text>
          <Text style={styles.otherPrice}>{pesos(option.unitPrice)}</Text>
        </AnimatedPressable>
      ))}
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    box: { gap: spacing.xs, padding: spacing.sm, borderRadius: radii.lg, backgroundColor: colors.surface.input, borderWidth: 1, borderColor: colors.border.subtle },
    eyebrow: { fontFamily: typography.caption.fontFamily, fontSize: 11, letterSpacing: 0.6, color: colors.brand.accentDark },
    empty: { fontFamily: typography.body.fontFamily, fontSize: 13, color: colors.text.secondary },
    best: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    bestText: { flex: 1, gap: 1 },
    store: { fontFamily: typography.itemTitle.fontFamily, fontSize: 15, color: colors.text.primary },
    detail: { fontFamily: typography.caption.fontFamily, fontSize: 12, color: colors.text.secondary },
    price: { fontFamily: typography.itemTitle.fontFamily, fontSize: 13, color: colors.text.primary, marginTop: 2 },
    better: { fontFamily: typography.caption.fontFamily, fontSize: 12, color: colors.state.successStrong },
    worse: { fontFamily: typography.caption.fontFamily, fontSize: 12, color: colors.state.warning },
    go: { minWidth: 64, minHeight: 48, borderRadius: radii.full, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: colors.brand.navy, paddingHorizontal: spacing.md },
    goText: { fontFamily: typography.itemTitle.fontFamily, fontSize: 14, color: colors.text.onNavy },
    other: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm, minHeight: 40 },
    otherText: { flex: 1, fontFamily: typography.body.fontFamily, fontSize: 13, color: colors.text.secondary },
    otherPrice: { fontFamily: typography.itemTitle.fontFamily, fontSize: 13, color: colors.text.primary },
  }),
);