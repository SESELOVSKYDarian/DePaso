import type { ProductSearchResult } from "@depaso/validation";
import { colors, radii, spacing, typography } from "@depaso/design-tokens";
import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Button } from "@/components/Button";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { merchantClient, productsClient } from "@/lib/apiClient";

function parsePrice(raw: string): number | null {
  const value = Number(raw.replace(",", "."));
  return Number.isFinite(value) && value > 0 ? value : null;
}

/**
 * Tres modos: editar/dar de baja un precio existente (`priceId`), publicar un producto que
 * ya está en el catálogo (buscándolo) o crear un producto nuevo con su primer precio.
 */
export default function MerchantPriceFormScreen() {
  const params = useLocalSearchParams<{ priceId?: string; name?: string; price?: string }>();
  const { show: showToast } = useToast();
  const isEditing = Boolean(params.priceId);

  const [mode, setMode] = useState<"catalog" | "new">("catalog");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState("");
  const [priceText, setPriceText] = useState(params.price ?? "");
  const [priceError, setPriceError] = useState<string | undefined>();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [brandName, setBrandName] = useState("");
  const [unit, setUnit] = useState("");
  const [unitSizeText, setUnitSizeText] = useState("");
  const [newError, setNewError] = useState<string | undefined>();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (text: string) => {
    setQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!text.trim()) {
      setResults([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      try {
        const { results: found } = await productsClient.search(text.trim());
        setResults(found);
      } catch {
        setResults([]);
      }
    }, 300);
  };

  const run = async (action: () => Promise<unknown>, successMessage: string) => {
    setIsSubmitting(true);
    try {
      await action();
      showToast(successMessage, "success");
      router.back();
    } catch {
      showToast("No pudimos guardar. Probá de nuevo.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async () => {
    const price = parsePrice(priceText);
    if (price === null) {
      setPriceError("Ingresá un precio válido mayor a 0.");
      return;
    }
    setPriceError(undefined);

    if (isEditing && params.priceId) {
      const priceId = params.priceId;
      await run(() => merchantClient.prices.update(priceId, price), "Precio actualizado");
      return;
    }

    if (mode === "catalog") {
      if (!selectedVariantId) {
        showToast("Elegí un producto de la lista.", "info");
        return;
      }
      const productVariantId = selectedVariantId;
      await run(() => merchantClient.prices.set({ productVariantId, price }), "Producto publicado");
      return;
    }

    const unitSize = parsePrice(unitSizeText);
    if (name.trim().length < 2 || category.trim().length < 2 || !unit.trim() || unitSize === null) {
      setNewError("Completá nombre, categoría, unidad (ej. kg, l, u) y tamaño.");
      return;
    }
    setNewError(undefined);
    await run(
      () =>
        merchantClient.createProduct({
          name: name.trim(),
          category: category.trim(),
          ...(brandName.trim() ? { brandName: brandName.trim() } : {}),
          unit: unit.trim(),
          unitSize,
          price,
        }),
      "Producto creado y publicado"
    );
  };

  const handleRemove = async () => {
    const priceId = params.priceId;
    if (!priceId) return;
    await run(() => merchantClient.prices.remove(priceId), "Producto dado de baja");
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {isEditing ? (
        <Text style={styles.title}>{params.name}</Text>
      ) : (
        <View style={styles.tabs}>
          {(["catalog", "new"] as const).map((value) => (
            <AnimatedPressable
              key={value}
              accessibilityLabel={value === "catalog" ? "Buscar en el catálogo" : "Producto nuevo"}
              haptic={false}
              onPress={() => setMode(value)}
              style={[styles.tab, mode === value ? styles.tabSelected : null]}
            >
              <Text style={[styles.tabLabel, mode === value ? styles.tabLabelSelected : null]}>
                {value === "catalog" ? "Buscar en el catálogo" : "Producto nuevo"}
              </Text>
            </AnimatedPressable>
          ))}
        </View>
      )}

      {!isEditing && mode === "catalog" ? (
        <>
          <FormField label="Buscar producto" value={query} onChangeText={handleSearch} placeholder="Leche, yerba, coca..." />
          {selectedVariantId ? <Text style={styles.selected}>Elegido: {selectedLabel}</Text> : null}
          {results.map((product) =>
            product.variants.map((variant) => (
              <AnimatedPressable
                key={variant.id}
                accessibilityLabel={`Elegir ${variant.name}`}
                haptic={false}
                onPress={() => {
                  setSelectedVariantId(variant.id);
                  setSelectedLabel(variant.name);
                }}
                style={[styles.row, selectedVariantId === variant.id ? styles.rowSelected : null]}
              >
                <Text style={styles.rowName}>{variant.name}</Text>
                <Text style={styles.rowMeta}>
                  {product.category} · {variant.unitSize}
                  {variant.unit}
                </Text>
              </AnimatedPressable>
            ))
          )}
        </>
      ) : null}

      {!isEditing && mode === "new" ? (
        <>
          <FormField label="Nombre del producto" value={name} onChangeText={setName} autoCapitalize="sentences" />
          <FormField label="Categoría" value={category} onChangeText={setCategory} placeholder="Almacén, Verdulería..." autoCapitalize="sentences" />
          <FormField label="Marca (opcional)" value={brandName} onChangeText={setBrandName} autoCapitalize="words" />
          <FormField label="Unidad" value={unit} onChangeText={setUnit} placeholder="kg, l, u, g, ml" />
          <FormField label="Tamaño" value={unitSizeText} onChangeText={setUnitSizeText} keyboardType="decimal-pad" placeholder="Ej. 1, 0.5, 500" error={newError} />
        </>
      ) : null}

      <FormField
        label="Precio (ARS)"
        value={priceText}
        onChangeText={(text) => {
          setPriceText(text);
          setPriceError(undefined);
        }}
        keyboardType="decimal-pad"
        error={priceError}
      />

      <Button label={isSubmitting ? "Guardando..." : "Guardar"} onPress={() => void handleSave()} loading={isSubmitting} />
      {isEditing ? <Button label="Dar de baja" variant="danger" onPress={() => void handleRemove()} disabled={isSubmitting} /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.surface.base, padding: spacing.lg, gap: spacing.md },
  title: { fontFamily: typography.heroTitle.fontFamily, fontSize: 20, color: colors.text.primary },
  tabs: { flexDirection: "row", gap: spacing.sm },
  tab: {
    flex: 1,
    alignItems: "center",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.primary,
    paddingVertical: spacing.sm,
  },
  tabSelected: { borderColor: colors.brand.navy, backgroundColor: colors.brand.mint },
  tabLabel: { fontFamily: typography.body.fontFamily, fontSize: 13, color: colors.text.secondary },
  tabLabelSelected: { color: colors.text.primary, fontWeight: "600" },
  selected: { fontFamily: typography.body.fontFamily, fontSize: 13, color: colors.text.primary, fontWeight: "600" },
  row: {
    backgroundColor: colors.surface.primary,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.sm,
    minHeight: 44,
  },
  rowSelected: { borderColor: colors.brand.navy, backgroundColor: colors.brand.mint },
  rowName: { fontFamily: typography.body.fontFamily, fontWeight: "600", fontSize: 14, color: colors.text.primary },
  rowMeta: { fontFamily: typography.caption.fontFamily, fontSize: 12, color: colors.text.muted, marginTop: 1 },
});
