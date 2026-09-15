import type { ProductPreferenceResponse, StorePreferenceResponse } from "@depaso/validation";
import { colors, radii, spacing, typography } from "@depaso/design-tokens";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/components/Toast";
import { preferencesClient } from "@/lib/apiClient";

const PRODUCT_TYPE_LABEL: Record<ProductPreferenceResponse["type"], string> = {
  EXACT: "Marca exacta",
  PREFERRED: "Marca preferida",
  ANY: "Cualquier marca",
};

const STORE_TYPE_LABEL: Record<StorePreferenceResponse["type"], string> = {
  REQUIRED: "Obligatorio",
  PREFERRED: "Preferido",
};

/**
 * Preferencias de producto/comercio (Fase 10, sección 87). Consumidas hoy por
 * `@depaso/optimization` — sin esta pantalla el usuario no tenía forma de configurarlas.
 */
export default function PreferencesScreen() {
  const { show: showToast } = useToast();
  const [productPrefs, setProductPrefs] = useState<ProductPreferenceResponse[]>([]);
  const [storePrefs, setStorePrefs] = useState<StorePreferenceResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [{ preferences: products }, { preferences: stores }] = await Promise.all([
        preferencesClient.products.list(),
        preferencesClient.stores.list(),
      ]);
      setProductPrefs(products);
      setStorePrefs(stores);
    } catch {
      showToast("No pudimos cargar tus preferencias.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // `useFocusEffect` (no `useEffect`) — bug real encontrado probando el flujo completo:
  // agregar una preferencia desde `product-form`/`store-form` y volver acá con
  // `router.back()` no disparaba un refetch (el screen sólo cargaba al montar), así que
  // la preferencia recién creada no aparecía hasta recargar la app entera. Confirmado que
  // `useFocusEffect` SÍ está exportado por `expo-router` en esta versión (6.0.24) — la
  // cautela anterior de evitarlo (ver `PlacesContext`) ya no aplica acá.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const handleRemoveProduct = async (productId: string) => {
    try {
      await preferencesClient.products.remove(productId);
      setProductPrefs((prev) => prev.filter((p) => p.productId !== productId));
    } catch {
      showToast("No pudimos quitar esa preferencia.", "error");
    }
  };

  const handleRemoveStore = async (id: string) => {
    try {
      await preferencesClient.stores.remove(id);
      setStorePrefs((prev) => prev.filter((p) => p.id !== id));
    } catch {
      showToast("No pudimos quitar esa preferencia.", "error");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Marcas de producto</Text>
      <Text style={styles.sectionHint}>
        El motor de optimización respeta esto antes de rankear (sección 87): "marca exacta" nunca se
        reemplaza, "preferida" suma puntos, "cualquiera" no restringe.
      </Text>
      {!isLoading && productPrefs.length === 0 ? (
        <EmptyState emoji="🏷️" title="Sin preferencias de marca" description="Elegí un producto y decile a DePaso si querés siempre la misma marca." />
      ) : (
        <View style={styles.list}>
          {productPrefs.map((pref) => (
            <View key={pref.id} style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{pref.productName}</Text>
                <Text style={styles.rowMeta}>{PRODUCT_TYPE_LABEL[pref.type]}</Text>
              </View>
              <AnimatedPressable
                accessibilityLabel={`Quitar preferencia de ${pref.productName}`}
                haptic={false}
                onPress={() => void handleRemoveProduct(pref.productId)}
                style={styles.removeButton}
              >
                <Text style={styles.removeLabel}>✕</Text>
              </AnimatedPressable>
            </View>
          ))}
        </View>
      )}
      <AnimatedPressable
        accessibilityLabel="Agregar preferencia de marca"
        onPress={() => router.push("/preferences/product-form")}
        style={styles.addButton}
      >
        <Text style={styles.addLabel}>+ Agregar preferencia de marca</Text>
      </AnimatedPressable>

      <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Comercios por categoría</Text>
      <Text style={styles.sectionHint}>
        "Obligatorio" fija el comercio antes del ranking; "preferido" suma puntos sin descartar otras
        opciones (BUSINESS-RULES.md).
      </Text>
      {!isLoading && storePrefs.length === 0 ? (
        <EmptyState emoji="🏬" title="Sin preferencias de comercio" description="Ej.: siempre la carnicería de siempre, aunque haya otra más barata." />
      ) : (
        <View style={styles.list}>
          {storePrefs.map((pref) => (
            <View key={pref.id} style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{pref.category}</Text>
                <Text style={styles.rowMeta}>
                  {STORE_TYPE_LABEL[pref.type]} · {pref.storeName} — {pref.storeBranchName}
                </Text>
              </View>
              <AnimatedPressable
                accessibilityLabel={`Quitar preferencia de ${pref.category}`}
                haptic={false}
                onPress={() => void handleRemoveStore(pref.id)}
                style={styles.removeButton}
              >
                <Text style={styles.removeLabel}>✕</Text>
              </AnimatedPressable>
            </View>
          ))}
        </View>
      )}
      <AnimatedPressable
        accessibilityLabel="Agregar preferencia de comercio"
        onPress={() => router.push("/preferences/store-form")}
        style={styles.addButton}
      >
        <Text style={styles.addLabel}>+ Agregar preferencia de comercio</Text>
      </AnimatedPressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.base,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  sectionTitle: {
    fontFamily: typography.itemTitle.fontFamily,
    fontSize: 16,
    color: colors.text.primary,
  },
  sectionSpacing: {
    marginTop: spacing.lg,
  },
  sectionHint: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  list: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface.primary,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.sm,
    minHeight: 44,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: typography.body.fontFamily,
    fontWeight: "600",
    fontSize: 14,
    color: colors.text.primary,
  },
  rowMeta: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 1,
  },
  removeButton: {
    padding: spacing.xxs,
  },
  removeLabel: {
    color: colors.text.muted,
    fontSize: 16,
  },
  addButton: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border.strong,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  addLabel: {
    fontFamily: typography.body.fontFamily,
    fontWeight: "600",
    fontSize: 14,
    color: colors.text.secondary,
  },
});
