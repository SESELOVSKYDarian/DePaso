import { Ionicons } from "@expo/vector-icons";
import type { ProductFacets, ProductSearchResult } from "@depaso/validation";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { FlatList, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { makeStyles, useColors } from "@/lib/theme";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { BottomSheet } from "@/components/BottomSheet";
import { EmptyState } from "@/components/EmptyState";
import { ProductThumb } from "@/components/ProductThumb";
import { useToast } from "@/components/Toast";
import { productsClient } from "@/lib/apiClient";
import { useLists } from "@/lib/lists/ListsContext";

const EMPTY_FACETS: ProductFacets = { types: [], brands: [] };

/** "Gallo · 1 kg": marca y tamaño; la categoría sólo si es una de verdad (SEPA no categoriza). */
function describeProduct(product: ProductSearchResult): string {
  const variant = product.variants[0];
  const parts: string[] = [];
  if (product.brandName) parts.push(product.brandName);
  if (variant && variant.unitSize > 0) parts.push(`${variant.unitSize}${variant.unit}`);
  if (parts.length === 0 && !/^sin categorizar/i.test(product.category)) parts.push(product.category);
  return parts.join(" · ");
}

/**
 * Buscar un producto para sumarlo a una lista. Se escribe lo que falta ("arroz") y, si hace
 * falta afinar, se filtra por tipo ("Gaseosas") y por marca. También se puede explorar por
 * tipo sin escribir nada. Los filtros salen de lo que realmente hay para esa búsqueda.
 */
export default function ProductSearchScreen() {
  const colors = useColors();
  const styles = useStyles();
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const { addItem } = useLists();
  const { show: showToast } = useToast();

  const [query, setQuery] = useState("");
  const [typeId, setTypeId] = useState<string | null>(null);
  const [brand, setBrand] = useState<{ id: string; name: string } | null>(null);
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [facets, setFacets] = useState<ProductFacets>(EMPTY_FACETS);
  const [isSearching, setIsSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [brandSheetOpen, setBrandSheetOpen] = useState(false);

  const requestId = useRef(0);
  const trimmed = query.trim();
  const hasCriteria = trimmed.length > 0 || typeId !== null || brand !== null;

  // Cada cambio de texto o filtro vuelve a buscar (con una pausa corta mientras se tipea).
  useEffect(() => {
    const id = ++requestId.current;
    const filters = { type: typeId ?? undefined, brandId: brand?.id };
    const timer = setTimeout(
      async () => {
        setIsSearching(hasCriteria);
        const [found, options] = await Promise.all([
          hasCriteria ? productsClient.search(trimmed, filters).catch(() => null) : Promise.resolve(null),
          productsClient.facets(trimmed, filters).catch(() => null),
        ]);
        if (id !== requestId.current) return; // llegó tarde: ya hay una búsqueda más nueva
        setResults(found?.results ?? []);
        if (options) setFacets(options);
        setIsSearching(false);
      },
      trimmed ? 300 : 0,
    );
    return () => clearTimeout(timer);
  }, [trimmed, typeId, brand, hasCriteria]);

  const clearFilters = () => {
    setTypeId(null);
    setBrand(null);
  };

  const handleAdd = async (product: ProductSearchResult) => {
    const variant = product.variants[0];
    if (!variant) return;
    setAddingId(variant.id);
    try {
      await addItem(listId, { productId: product.id, quantity: 1 });
      showToast(`Anotado: ${product.name}. Que no se te pase.`, "success");
      router.back();
    } catch {
      showToast("No pudimos anotarlo. Probá de nuevo.", "error");
    } finally {
      setAddingId(null);
    }
  };

  const hasFilters = typeId !== null || brand !== null;

  return (
    <View style={styles.container}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="¿Qué te falta? Arroz, leche, yerba…"
        placeholderTextColor={colors.text.muted}
        autoFocus
        autoCapitalize="none"
        style={styles.input}
      />

      <View style={styles.filters}>
        {facets.types.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.chipRow}
          >
            {facets.types.map((type) => {
              const selected = typeId === type.id;
              return (
                <AnimatedPressable
                  key={type.id}
                  accessibilityLabel={`${selected ? "Quitar filtro" : "Filtrar por"} ${type.label}`}
                  haptic={false}
                  onPress={() => setTypeId(selected ? null : type.id)}
                  style={[styles.chip, selected ? styles.chipSelected : null]}
                >
                  <Text style={[styles.chipLabel, selected ? styles.chipLabelSelected : null]}>{type.label}</Text>
                </AnimatedPressable>
              );
            })}
          </ScrollView>
        ) : null}

        {facets.brands.length > 0 || brand ? (
          <View style={styles.brandRow}>
            <AnimatedPressable
              accessibilityLabel={brand ? `Marca: ${brand.name}. Cambiar` : "Filtrar por marca"}
              haptic={false}
              onPress={() => setBrandSheetOpen(true)}
              style={[styles.brandButton, brand ? styles.chipSelected : null]}
            >
              <Text style={[styles.chipLabel, brand ? styles.chipLabelSelected : null]} numberOfLines={1}>
                {brand ? brand.name : "Marca"}
              </Text>
              <Ionicons
                name="chevron-down"
                size={14}
                color={brand ? colors.text.onNavy : colors.text.secondary}
              />
            </AnimatedPressable>
            {hasFilters ? (
              <AnimatedPressable
                accessibilityLabel="Limpiar filtros"
                haptic={false}
                onPress={clearFilters}
                style={styles.clearButton}
              >
                <Text style={styles.clearLabel}>Limpiar filtros</Text>
              </AnimatedPressable>
            ) : null}
          </View>
        ) : null}
      </View>

      {!hasCriteria ? (
        <EmptyState
          emoji="🔎"
          title="Anotá lo que te falta"
          description="Escribí el producto o elegí un tipo de arriba. Lo de siempre va primero; las versiones raras, después."
        />
      ) : results.length === 0 && !isSearching ? (
        <EmptyState
          emoji="🤔"
          title="Ni de paso lo vimos"
          description={hasFilters ? "Probá sacando algún filtro." : "Probá con otra palabra o con la marca."}
        />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const meta = describeProduct(item);
            return (
              <AnimatedPressable
                accessibilityLabel={`Agregar ${item.name}${item.brandName ? `, ${item.brandName}` : ""}`}
                haptic={false}
                onPress={() => void handleAdd(item)}
                style={styles.row}
              >
                <ProductThumb imageUrl={item.imageUrl} />
                <View style={styles.rowText}>
                  <Text style={styles.rowName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  {meta ? (
                    <Text style={styles.rowMeta} numberOfLines={1}>
                      {meta}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.addLabel}>{addingId === item.variants[0]?.id ? "…" : "Sumar"}</Text>
              </AnimatedPressable>
            );
          }}
        />
      )}

      <BottomSheet visible={brandSheetOpen} onClose={() => setBrandSheetOpen(false)}>
        <Text accessibilityRole="header" style={styles.sheetTitle}>
          Marca
        </Text>
        <ScrollView style={styles.sheetList} showsVerticalScrollIndicator={false}>
          <AnimatedPressable
            accessibilityLabel="Todas las marcas"
            haptic={false}
            onPress={() => {
              setBrand(null);
              setBrandSheetOpen(false);
            }}
            style={styles.sheetRow}
          >
            <Text style={styles.sheetRowLabel}>Todas las marcas</Text>
            {brand === null ? <Ionicons name="checkmark" size={20} color={colors.text.primary} /> : null}
          </AnimatedPressable>
          {facets.brands.map((option) => (
            <AnimatedPressable
              key={option.id}
              accessibilityLabel={`${option.name}, ${option.count} productos`}
              haptic={false}
              onPress={() => {
                setBrand({ id: option.id, name: option.name });
                setBrandSheetOpen(false);
              }}
              style={styles.sheetRow}
            >
              <Text style={styles.sheetRowLabel} numberOfLines={1}>
                {option.name}
              </Text>
              <Text style={styles.sheetRowCount}>{option.count}</Text>
              {brand?.id === option.id ? <Ionicons name="checkmark" size={20} color={colors.text.primary} /> : null}
            </AnimatedPressable>
          ))}
        </ScrollView>
      </BottomSheet>
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface.base,
    },
    input: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.lg,
      minHeight: 48,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      backgroundColor: colors.surface.input,
      paddingHorizontal: spacing.md,
      fontFamily: typography.subtitle.fontFamily,
      fontSize: 15,
      color: colors.text.primary,
    },
    filters: {
      paddingTop: spacing.sm,
      gap: spacing.xs,
    },
    chipRow: {
      paddingHorizontal: spacing.lg,
      gap: spacing.xs,
    },
    chip: {
      minHeight: 40,
      paddingHorizontal: spacing.md,
      borderRadius: radii.full,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      backgroundColor: colors.surface.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    chipSelected: {
      backgroundColor: colors.brand.navy,
      borderColor: colors.brand.navy,
    },
    chipLabel: {
      fontFamily: typography.body.fontFamily,
      fontSize: 14,
      color: colors.text.primary,
    },
    chipLabelSelected: {
      color: colors.text.onNavy,
    },
    brandRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
    },
    brandButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      minHeight: 40,
      maxWidth: "60%",
      paddingHorizontal: spacing.md,
      borderRadius: radii.full,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      backgroundColor: colors.surface.primary,
    },
    clearButton: {
      minHeight: 40,
      justifyContent: "center",
      paddingHorizontal: spacing.xs,
    },
    clearLabel: {
      fontFamily: typography.body.fontFamily,
      fontSize: 14,
      color: colors.text.secondary,
      textDecorationLine: "underline",
    },
    list: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.xl,
      gap: spacing.sm,
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
      minHeight: 64,
    },
    rowText: {
      flex: 1,
    },
    rowName: {
      fontFamily: typography.body.fontFamily,
      fontWeight: "600",
      fontSize: 15,
      color: colors.text.primary,
    },
    rowMeta: {
      fontFamily: typography.caption.fontFamily,
      fontSize: 12,
      color: colors.text.muted,
      marginTop: 1,
    },
    addLabel: {
      fontFamily: typography.body.fontFamily,
      fontWeight: "600",
      fontSize: 13,
      color: colors.text.secondary,
    },
    sheetTitle: {
      fontFamily: typography.heroTitle.fontFamily,
      fontSize: 20,
      color: colors.text.primary,
      marginBottom: spacing.sm,
    },
    sheetList: {
      maxHeight: 420,
    },
    sheetRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      minHeight: 48,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border.subtle,
    },
    sheetRowLabel: {
      flex: 1,
      fontFamily: typography.body.fontFamily,
      fontSize: 16,
      color: colors.text.primary,
    },
    sheetRowCount: {
      fontFamily: typography.caption.fontFamily,
      fontSize: 13,
      color: colors.text.tertiary,
    },
  }),
);
