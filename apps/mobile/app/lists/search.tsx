import type { ProductSearchResult } from "@depaso/validation";
import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { makeStyles, useColors } from "@/lib/theme";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { EmptyState } from "@/components/EmptyState";
import { ProductThumb } from "@/components/ProductThumb";
import { useToast } from "@/components/Toast";
import { productsClient } from "@/lib/apiClient";
import { useLists } from "@/lib/lists/ListsContext";

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
 * Búsqueda de catálogo (Fase 8) usada acá para agregar un producto a una lista (Fase 9,
 * sección 37 — "tolerante a variaciones": el backend ya matchea por alias, esta pantalla
 * sólo muestra el resultado).
 */
export default function ProductSearchScreen() {
  const colors = useColors();
  const styles = useStyles();
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const { addItem } = useLists();
  const { show: showToast } = useToast();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChangeText = (text: string) => {
    setQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!text.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { results: found } = await productsClient.search(text.trim());
        setResults(found);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
        setSearched(true);
      }
    }, 300);
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

  return (
    <View style={styles.container}>
      <TextInput
        value={query}
        onChangeText={handleChangeText}
        placeholder="¿Qué te falta? Arroz, leche, yerba…"
        placeholderTextColor={colors.text.muted}
        autoFocus
        autoCapitalize="none"
        style={styles.input}
      />

      {!searched && !isSearching ? (
        <EmptyState
          emoji="🔎"
          title="Anotá lo que te falta"
          description="Escribí el producto o la marca. Lo de siempre va primero; las versiones raras, después."
        />
      ) : results.length === 0 && !isSearching ? (
        <EmptyState
          emoji="🤔"
          title="Ni de paso lo vimos"
          description="Probá con otra palabra o con la marca."
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
    </View>
  );
}

const useStyles = makeStyles((colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.base,
  },
  input: {
    margin: spacing.lg,
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.input,
    paddingHorizontal: spacing.md,
    fontFamily: typography.subtitle.fontFamily,
    fontSize: 14,
    color: colors.text.primary,
  },
  list: {
    paddingHorizontal: spacing.lg,
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
}));
