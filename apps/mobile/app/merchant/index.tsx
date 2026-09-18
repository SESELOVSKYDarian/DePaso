import type { MerchantBranchResponse, MerchantPriceResponse } from "@depaso/validation";
import { colors, radii, spacing, typography } from "@depaso/design-tokens";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/components/Toast";
import { merchantClient } from "@/lib/apiClient";

function formatPrice(value: number): string {
  return `$${value.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Panel del comercio: su sucursal y los productos/precios que publica. */
export default function MerchantHomeScreen() {
  const { show: showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [branch, setBranch] = useState<MerchantBranchResponse | null>(null);
  const [prices, setPrices] = useState<MerchantPriceResponse[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([merchantClient.branch(), merchantClient.prices.list()])
        .then(([b, p]) => {
          if (!active) return;
          setBranch(b.branch);
          setPrices(p.prices);
        })
        .catch(() => showToast("No pudimos cargar tu comercio.", "error"))
        .finally(() => active && setIsLoading(false));
      return () => {
        active = false;
      };
    }, [showToast])
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand.navy} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {branch ? (
        <View style={styles.branchCard}>
          <Text style={styles.branchName}>{branch.storeName}</Text>
          <Text style={styles.branchAddress}>{branch.address}</Text>
        </View>
      ) : null}

      <Button label="+ Agregar producto" onPress={() => router.push("/merchant/price-form")} />

      <FlatList
        data={prices}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            emoji="🛒"
            title="Todavía no cargaste productos"
            description="Agregá lo que vendés con su precio para que aparezca en las comparaciones de DePaso."
          />
        }
        renderItem={({ item }) => (
          <AnimatedPressable
            accessibilityLabel={`Editar ${item.productName}`}
            haptic={false}
            onPress={() =>
              router.push({
                pathname: "/merchant/price-form",
                params: { priceId: item.id, name: item.productVariantName, price: String(item.price) },
              })
            }
            style={styles.row}
          >
            <View style={styles.rowText}>
              <Text style={styles.rowName}>{item.productVariantName}</Text>
              <Text style={styles.rowMeta}>
                {item.category} · {item.unitSize}
                {item.unit}
              </Text>
            </View>
            <Text style={styles.rowPrice}>{formatPrice(item.price)}</Text>
          </AnimatedPressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.base, padding: spacing.lg, gap: spacing.md },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface.base },
  branchCard: {
    backgroundColor: colors.brand.navy,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: 2,
  },
  branchName: { fontFamily: typography.heroTitle.fontFamily, fontSize: 20, color: colors.text.onNavy },
  branchAddress: { fontFamily: typography.body.fontFamily, fontSize: 13, color: colors.text.onNavy },
  list: { gap: spacing.sm, paddingBottom: spacing.xxl },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface.primary,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.sm,
    minHeight: 48,
    gap: spacing.sm,
  },
  rowText: { flex: 1 },
  rowName: { fontFamily: typography.body.fontFamily, fontWeight: "600", fontSize: 15, color: colors.text.primary },
  rowMeta: { fontFamily: typography.caption.fontFamily, fontSize: 12, color: colors.text.muted, marginTop: 1 },
  rowPrice: { fontFamily: typography.itemTitle.fontFamily, fontSize: 15, color: colors.text.primary },
});
