import { Ionicons } from "@expo/vector-icons";
import type { NearbyStore } from "@depaso/validation";
import { router } from "expo-router";
import { Text, View } from "react-native";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { useColors } from "@/lib/theme";
import { RIGHT_ON_ROUTE_METERS, formatDetour } from "../helpers";
import { useStyles } from "../styles";

/** Tarjeta del comercio elegido en el mapa, con el botón para comprar ahí de paso. */
export function SelectedStoreCard({ store }: { store: NearbyStore }) {
  const s = useStyles();
  const colors = useColors();

  return (
    <View style={s.selectedCard}>
      <View style={s.storeIcon}>
        <Ionicons name="storefront-outline" size={20} color={colors.text.onNavy} />
      </View>
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

/** "Lo que tenés de paso": hasta 12 comercios ordenados por cuánto sacan del camino. */
export function NearbyStoresList({ stores, selectedId, isLoading, hasMap, onSelect }: NearbyStoresListProps) {
  const s = useStyles();
  const colors = useColors();

  if (stores.length === 0) {
    return !isLoading && hasMap ? (
      <Text style={s.sectionHint}>No hay comercios sobre tu camino. Probá sumando una parada a tu recorrido.</Text>
    ) : null;
  }

  return (
    <>
      <Text style={s.section}>Lo que tenés de paso</Text>
      <Text style={s.sectionHint}>Ordenados por cuánto te sacan del camino.</Text>
      {stores.slice(0, 12).map((store) => (
        <AnimatedPressable
          key={store.branchId}
          accessibilityLabel={`${store.storeName}, ${formatDetour(store)}`}
          haptic={false}
          onPress={() => onSelect(store.branchId)}
          style={[s.storeRow, store.branchId === selectedId ? s.storeRowSelected : null]}
        >
          <View style={s.storeIconSmall}>
            <Ionicons name="storefront-outline" size={17} color={colors.text.primary} />
          </View>
          <View style={s.storeText}>
            <Text style={s.storeName} numberOfLines={1}>
              {store.storeName}
            </Text>
            <Text style={s.address} numberOfLines={1}>
              {store.address}
            </Text>
          </View>
          <View style={[s.chip, store.detourMeters < RIGHT_ON_ROUTE_METERS ? s.chipGood : null]}>
            <Text style={s.chipText}>{formatDetour(store)}</Text>
          </View>
        </AnimatedPressable>
      ))}
    </>
  );
}
