import { StoreBadge } from "@/components/stores/StoreBadge";
import { Ionicons } from "@expo/vector-icons";
import type { NearbyStore } from "@depaso/validation";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { makeStyles, useColors } from "@/lib/theme";
import { RIGHT_ON_ROUTE_METERS, formatDetour } from "../helpers";
import { useStyles as useScreenStyles } from "../styles";

/** Tarjeta del comercio elegido en el mapa, con el botón para comprar ahí de paso. */
export function SelectedStoreCard({ store }: { store: NearbyStore }) {
  const s = useScreenStyles();

  return (
    <View style={s.selectedCard}>
      <StoreBadge storeName={store.storeName} size={44} />
      <View style={s.storeText}>
        <Text style={s.storeName}>{store.storeName}</Text>
        <Text style={s.address}>{store.address}</Text>
        <Text style={s.detourStrong}>
          {store.detourMeters < RIGHT_ON_ROUTE_METERS
            ? "Lo tenés de paso: te queda sobre el camino."
            : `Te desviás ${formatDetour(store).replace("+", "")} y seguís.`}
        </Text>
      </View>
      <AnimatedPressable
        accessibilityLabel={`Comprar de paso en ${store.storeName}`}
        onPress={() => router.push("/optimization")}
        style={s.selectedAction}
      >
        <Text style={s.selectedActionText}>Comprar de paso</Text>
      </AnimatedPressable>
    </View>
  );
}

interface NearbyStoresListProps {
  stores: NearbyStore[];
  selectedId: string | null;
  isLoading: boolean;
  hasMap: boolean;
  onSelect: (branchId: string) => void;
}

/** Cuadras de distancia al camino: "A 2 cuadras" (una cuadra ronda los 100 m). */
function blocksAway(store: NearbyStore): string {
  const blocks = Math.max(1, Math.round(store.distanceFromRouteMeters / 100));
  return `A ${blocks} ${blocks === 1 ? "cuadra" : "cuadras"}`;
}

/** Comercios de paso, ordenados por cuánto sacan del camino: logo, dirección y desvío en verde/rojo. */
export function NearbyStoresList({ stores, selectedId, isLoading, hasMap, onSelect }: NearbyStoresListProps) {
  const s = useScreenStyles();
  const styles = useStyles();
  const colors = useColors();

  if (stores.length === 0) {
    return !isLoading && hasMap ? (
      <Text style={s.sectionHint}>No hay comercios sobre tu camino. Probá sumando una parada a tu recorrido.</Text>
    ) : null;
  }

  return (
    <View style={styles.list}>
      {stores.slice(0, 12).map((store) => {
        const onRoute = store.detourMeters < RIGHT_ON_ROUTE_METERS;
        const minutes = Math.max(1, Math.round(store.detourSeconds / 60));
        return (
          <AnimatedPressable
            key={store.branchId}
            accessibilityLabel={`${store.storeName}, ${blocksAway(store)}, ${onRoute ? "en tu camino" : `más ${minutes} minutos`}`}
            haptic={false}
            onPress={() => onSelect(store.branchId)}
            style={[styles.row, store.branchId === selectedId ? styles.rowSelected : null]}
          >
            <StoreBadge storeName={store.storeName} size={52} />
            <View style={styles.text}>
              <Text style={styles.name} numberOfLines={1}>
                {store.storeName} <Text style={styles.address}>· {store.address}</Text>
              </Text>
              <View style={styles.metaRow}>
                <Ionicons name="walk-outline" size={14} color={colors.text.secondary} />
                <Text style={styles.meta}>{blocksAway(store)}</Text>
                <Text style={styles.meta}>·</Text>
                <Text style={onRoute ? styles.good : styles.extra}>{onRoute ? "En tu camino" : `+${minutes} min`}</Text>
              </View>
            </View>
          </AnimatedPressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    list: { gap: spacing.sm },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      padding: spacing.sm,
      borderRadius: radii.xl,
      backgroundColor: colors.surface.primary,
      borderWidth: 1.5,
      borderColor: colors.border.subtle,
    },
    rowSelected: { borderColor: colors.brand.route },
    text: { flex: 1, gap: 4 },
    name: { fontFamily: typography.itemTitle.fontFamily, fontSize: 15, color: colors.text.primary },
    address: { fontFamily: typography.body.fontFamily, fontSize: 13, color: colors.text.secondary },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
    meta: { fontFamily: typography.body.fontFamily, fontSize: 13, color: colors.text.secondary },
    good: { fontFamily: typography.itemTitle.fontFamily, fontSize: 13, color: colors.brand.route },
    extra: { fontFamily: typography.itemTitle.fontFamily, fontSize: 13, color: colors.state.errorStrong },
  }),
);
