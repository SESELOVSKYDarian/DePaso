import type { CustomProductPreferenceResponse, CustomStorePreferenceResponse, ProductPreferenceResponse, StorePreferenceResponse } from "@depaso/validation";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { makeStyles } from "@/lib/theme";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { BackToTopScrollView } from "@/components/common/BackToTop";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { EmptyState } from "@/components/common/EmptyState";
import { useToast } from "@/components/common/Toast";
import { preferencesClient } from "@/lib/apiClient";
import { PreferenceRow } from "./components/PreferenceRow";

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
  const styles = useStyles();
  const { show: showToast } = useToast();
  const [productPrefs, setProductPrefs] = useState<ProductPreferenceResponse[]>([]);
  const [storePrefs, setStorePrefs] = useState<StorePreferenceResponse[]>([]);
  // lo que la persona agregó a mano (productos sin catálogo y comercios marcados en el mapa)
  const [customProducts, setCustomProducts] = useState<CustomProductPreferenceResponse[]>([]);
  const [customStores, setCustomStores] = useState<CustomStorePreferenceResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [{ preferences: products }, { preferences: stores }, { preferences: customP }, { preferences: customS }] = await Promise.all([
        preferencesClient.products.list(),
        preferencesClient.stores.list(),
        preferencesClient.customProducts.list(),
        preferencesClient.customStores.list(),
      ]);
      setProductPrefs(products);
      setStorePrefs(stores);
      setCustomProducts(customP);
      setCustomStores(customS);
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

  const handleRemoveCustomProduct = async (id: string) => {
    try {
      await preferencesClient.customProducts.remove(id);
      setCustomProducts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      showToast("No pudimos quitar esa preferencia.", "error");
    }
  };

  const handleRemoveCustomStore = async (id: string) => {
    try {
      await preferencesClient.customStores.remove(id);
      setCustomStores((prev) => prev.filter((p) => p.id !== id));
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
    <BackToTopScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Marcas de producto</Text>
      <Text style={styles.sectionHint}>
        "Marca exacta" nunca se reemplaza, "preferida" la priorizamos y "cualquiera" no restringe.
      </Text>
      {!isLoading && productPrefs.length + customProducts.length === 0 ? (
        <EmptyState emoji="🏷️" title="Sin preferencias de marca" description="Elegí un producto y decile a DePaso si querés siempre la misma marca." />
      ) : (
        <View style={styles.list}>
          {productPrefs.map((pref) => (
            <PreferenceRow
              key={pref.id}
              title={pref.productName}
              meta={PRODUCT_TYPE_LABEL[pref.type]}
              removeLabel={`Quitar preferencia de ${pref.productName}`}
              onRemove={() => void handleRemoveProduct(pref.productId)}
            />
          ))}
          {customProducts.map((pref) => (
            <PreferenceRow
              key={pref.id}
              title={pref.name}
              meta={`${PRODUCT_TYPE_LABEL[pref.type]} · anotado por vos`}
              removeLabel={`Quitar preferencia de ${pref.name}`}
              onRemove={() => void handleRemoveCustomProduct(pref.id)}
            />
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
        "Obligatorio" fija el comercio; "preferido" lo prioriza sin descartar otras opciones.
      </Text>
      {!isLoading && storePrefs.length + customStores.length === 0 ? (
        <EmptyState emoji="🏬" title="Sin preferencias de comercio" description="Ej.: siempre la carnicería de siempre, aunque haya otra más barata." />
      ) : (
        <View style={styles.list}>
          {storePrefs.map((pref) => (
            <PreferenceRow
              key={pref.id}
              title={pref.category}
              meta={`${STORE_TYPE_LABEL[pref.type]} · ${pref.storeName} — ${pref.storeBranchName}`}
              removeLabel={`Quitar preferencia de ${pref.category}`}
              onRemove={() => void handleRemoveStore(pref.id)}
            />
          ))}
          {customStores.map((pref) => (
            <PreferenceRow
              key={pref.id}
              title={pref.category}
              meta={`${STORE_TYPE_LABEL[pref.type]} · ${pref.name}${pref.address ? ` — ${pref.address}` : ""}`}
              removeLabel={`Quitar preferencia de ${pref.category}`}
              onRemove={() => void handleRemoveCustomStore(pref.id)}
            />
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
    </BackToTopScrollView>
  );
}

const useStyles = makeStyles((colors) => StyleSheet.create({
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
}));
