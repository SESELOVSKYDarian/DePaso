import type { ProductSearchResult } from "@depaso/validation";
import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/components/Toast";
import { productsClient } from "@/lib/apiClient";
import { useLists } from "@/lib/lists/ListsContext";

/**
 * Búsqueda de catálogo (Fase 8) usada acá para agregar un producto a una lista (Fase 9,
 * sección 37 — "tolerante a variaciones": el backend ya matchea por alias, esta pantalla
 * sólo muestra el resultado).
 */
export default function ProductSearchScreen() {
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
      showToast(`${product.name} agregado a la lista`, "success");
      router.back();
    } catch {
      showToast("No pudimos agregar el producto. Probá de nuevo.", "error");
    } finally {
      setAddingId(null);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        value={query}
        onChangeText={handleChangeText}
        placeholder="Buscar producto (ej. leche, yerba, coca)"
        placeholderTextColor={colors.text.muted}
        autoFocus
        autoCapitalize="none"
        style={styles.input}
      />

      {!searched && !isSearching ? (
        <EmptyState
          emoji="🔎"
          title="Buscá lo que necesitás"
          description="Escribí el nombre de un producto o una marca — encontramos variaciones aunque no sea exacto."
        />
      ) : results.length === 0 && !isSearching ? (
        <EmptyState emoji="🤔" title="Nada por acá" description="Probá con otro nombre o una marca distinta." />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <AnimatedPressable
              accessibilityLabel={`Agregar ${item.name}`}
              haptic={false}
              onPress={() => void handleAdd(item)}
              style={styles.row}
            >
              <View style={styles.rowText}>
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.rowMeta}>
                  {item.category}
                  {item.variants[0] ? ` · ${item.variants[0].unitSize}${item.variants[0].unit}` : ""}
                </Text>
              </View>
              <Text style={styles.addLabel}>
                {addingId === item.variants[0]?.id ? "Agregando..." : "+ Agregar"}
              </Text>
            </AnimatedPressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
    justifyContent: "space-between",
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
});
