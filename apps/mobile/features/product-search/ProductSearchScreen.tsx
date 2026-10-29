import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { FlatList, ScrollView, Text, TextInput, View } from "react-native";
import { radii } from "@depaso/design-tokens";
import type { ProductSearchResult } from "@depaso/validation";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/common/Skeleton";
import { useToast } from "@/components/common/Toast";
import { useLists } from "@/lib/lists/ListsContext";
import { useColors } from "@/lib/theme";
import { BrowseBoxes } from "./components/BrowseBoxes";
import { ResultRow } from "./components/ResultRow";
import { SearchFilters } from "./components/SearchFilters";
import { useStyles } from "./styles";
import { useProductSearch } from "./useProductSearch";
import { LIST_PERFORMANCE } from "@/lib/listPerformance";

/**
 * Buscar un producto para sumarlo a una lista. Sin escribir nada se explora por cajas, de lo
 * grande a lo chico: categoría (Bebidas) → tipo (Gaseosas) → marca (Pepsi) → productos.
 * Escribiendo, se busca por texto y se afina con los mismos tipos y marcas.
 */
export default function ProductSearchScreen() {
  const colors = useColors();
  const styles = useStyles();
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const { addItem } = useLists();
  const { show: showToast } = useToast();
  const search = useProductSearch();
  const [addingId, setAddingId] = useState<string | null>(null);

  // sumo el producto a la lista y vuelvo a ella
  const handleAdd = async (product: ProductSearchResult) => {
    const variant = product.variants[0];
    // Mientras se agrega uno, los demás toques se ignoran (antes se repetía el producto).
    if (!variant || addingId) return;
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

  const { group, typeId, brand, results, isSearching } = search;

  const filters = (
    <SearchFilters
      group={group}
      typeId={typeId}
      brand={brand}
      facets={search.facets}
      isTyping={search.trimmed.length > 0}
      onGoHome={search.goHome}
      onGoGroup={() => {
        if (group) search.setGroupId(group.id);
        search.pickType(null);
      }}
      onPickType={search.pickType}
      onClearBrand={() => search.setBrand(null)}
      onPickBrand={search.setBrand}
    />
  );

  return (
    <View style={styles.container}>
      <TextInput
        value={search.query}
        onChangeText={search.setQuery}
        placeholder="¿Qué te falta? Arroz, leche, yerba…"
        placeholderTextColor={colors.text.muted}
        autoCapitalize="none"
        returnKeyType="search"
        style={styles.input}
      />

      {!search.hasCriteria ? (
        <ScrollView contentContainerStyle={styles.browse} keyboardShouldPersistTaps="handled">
          {group ? filters : null}
          <BrowseBoxes group={group} onPickGroup={search.setGroupId} onPickType={search.pickType} />
        </ScrollView>
      ) : (
        <>
          {filters}
          {search.failed && !isSearching ? (
            <EmptyState
              emoji="📡"
              title="No pudimos buscar"
              description="Parece un problema de conexión, no que no exista."
              action={
                <AnimatedPressable accessibilityLabel="Reintentar" onPress={search.retryAgain} style={styles.retry}>
                  <Text style={styles.retryLabel}>Reintentar</Text>
                </AnimatedPressable>
              }
            />
          ) : isSearching && results.length === 0 ? (
            <View style={styles.list}>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <Skeleton key={index} height={64} borderRadius={radii.md} />
              ))}
            </View>
          ) : results.length === 0 ? (
            <EmptyState
              emoji="🤔"
              title="Ni de paso lo vimos"
              description={typeId || brand ? "Probá con otra marca o sacando el filtro." : "Probá con otra palabra o con la marca."}
            />
          ) : (
            <FlatList
          {...LIST_PERFORMANCE}
              data={results}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => <ResultRow product={item} addingId={addingId} onAdd={() => void handleAdd(item)} />}
            />
          )}
        </>
      )}
    </View>
  );
}
