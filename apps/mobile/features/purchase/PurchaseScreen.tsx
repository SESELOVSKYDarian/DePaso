import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { Button } from "@/components/common/Button";
import { PriceDisclosureBanner } from "@/components/lists/PriceDisclosureBanner";
import { usePurchase } from "@/lib/purchase/PurchaseContext";
import { makeStyles, useColors } from "@/lib/theme";
import { PurchaseFooter } from "./components/PurchaseFooter";
import { PurchaseItemRow } from "./components/PurchaseItemRow";
import { StoreTabs } from "./components/StoreTabs";
import { itemKey } from "./helpers";

/**
 * Modo compra: una pestaña por comercio de la opción elegida, con la lista de productos para ir
 * tildando mientras se compra. Lo tildado dura lo que dura la compra actual.
 */
export default function PurchaseScreen() {
  const colors = useColors();
  const styles = useStyles();
  const { plan, checked, toggle, finish } = usePurchase();
  const [storeIndex, setStoreIndex] = useState(0);

  // sin compra activa, se invita a calcular una
  if (!plan) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.empty}>
          <Text style={styles.title}>No hay una compra activa</Text>
          <Button label="Ver mi Top 3" onPress={() => router.replace("/optimization")} />
        </View>
      </SafeAreaView>
    );
  }

  const stops = plan.stops;
  const stop = stops[Math.min(storeIndex, stops.length - 1)]!;
  const allItems = stops.flatMap((entry) => entry.items.map((item) => ({ entry, item })));
  const completed = allItems.filter(({ entry, item }) => checked[itemKey(entry, item)]).length;
  const doneAmount = allItems.reduce((sum, { entry, item }) => sum + (checked[itemKey(entry, item)] ? item.unitPrice * item.quantity : 0), 0);
  const doneCounts = stops.map((entry) => entry.items.filter((item) => checked[itemKey(entry, item)]).length);
  const isLastStore = storeIndex >= stops.length - 1;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <AnimatedPressable accessibilityLabel="Volver" haptic={false} onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
        </AnimatedPressable>
        <View>
          <Text style={styles.eyebrow}>MODO COMPRA</Text>
          <Text style={styles.title}>
            {completed} de {allItems.length} productos
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <StoreTabs stops={stops} selectedIndex={storeIndex} doneCounts={doneCounts} onSelect={setStoreIndex} />
        <PriceDisclosureBanner />

        <View style={styles.storeCard}>
          <Text style={styles.storeName}>
            {stop.storeName} <Text style={styles.branch}>({stop.address ?? stop.branchName})</Text>
          </Text>
          {stop.items.map((item) => (
            <PurchaseItemRow key={itemKey(stop, item)} stop={stop} item={item} checked={!!checked[itemKey(stop, item)]} onToggle={() => toggle(itemKey(stop, item))} />
          ))}
        </View>
      </ScrollView>

      <PurchaseFooter
        completed={completed}
        total={allItems.length}
        doneAmount={doneAmount}
        allDone={completed === allItems.length}
        isLastStore={isLastStore}
        onNextStore={() => setStoreIndex((index) => index + 1)}
        onFinish={() => {
          finish();
          router.replace("/(tabs)");
        }}
      />
    </SafeAreaView>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface.base },
    header: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
    back: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radii.full,
      backgroundColor: colors.surface.primary,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    eyebrow: { fontFamily: typography.caption.fontFamily, fontSize: 12, letterSpacing: 1, color: colors.brand.accentDark },
    title: { fontFamily: typography.heroTitle.fontFamily, fontSize: 24, color: colors.text.primary },
    content: { padding: spacing.lg, gap: spacing.md },
    storeCard: {
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radii.xl,
      backgroundColor: colors.surface.primary,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    storeName: { fontFamily: typography.screenTitle.fontFamily, fontSize: 18, color: colors.text.primary },
    branch: { fontFamily: typography.caption.fontFamily, fontSize: 12, color: colors.text.secondary },
    empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg, gap: spacing.md },
  }),
);
