import type { ProductSearchResult } from "@depaso/validation";
import { ReactNode } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { BackToTopFlatList, BackToTopScrollView } from "@/components/common/BackToTop";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/common/Skeleton";
import { ProductThumb } from "@/components/lists/ProductThumb";
import { BrowseBoxes } from "@/features/product-search/components/BrowseBoxes";
import { SearchFilters } from "@/features/product-search/components/SearchFilters";
import { describeProduct } from "@/features/product-search/helpers";
import { useProductSearch } from "@/features/product-search/useProductSearch";
import { LIST_PERFORMANCE } from "@/lib/listPerformance";
import { makeStyles, useColors } from "@/lib/theme";

interface ProductFinderProps {
  /** Se llama al elegir un producto de los resultados. */
  onPick: (product: ProductSearchResult) => void;
  /** Lo que va al pie (por ejemplo, "No lo encuentro"). */
  footer?: ReactNode;
}

/**
 * Buscador de productos para elegir uno exacto: sin escribir, se explora por cajas de categorías
 * (categoría → tipo → marca → productos); escribiendo, se busca por nombre y se afina con los mismos filtros.
 */
export function ProductFinder({ onPick, footer }: ProductFinderProps) {
  const styles = useStyles();
  const colors = useColors();
  const search = useProductSearch();
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
        placeholder="Buscar producto o marca"
        placeholderTextColor={colors.text.muted}
        autoCapitalize="none"
        returnKeyType="search"
        style={styles.input}
      />

      {!search.hasCriteria ? (
        <BackToTopScrollView contentContainerStyle={styles.browse} keyboardShouldPersistTaps="handled">
          {group ? filters : null}
          <BrowseBoxes group={group} onPickGroup={search.setGroupId} onPickType={search.pickType} />
          {footer}
        </BackToTopScrollView>
      ) : (
        <>
          {filters}
          {isSearching && results.length === 0 ? (
            <View style={styles.list}>
              {[0, 1, 2, 3].map((index) => (
                <Skeleton key={index} height={64} borderRadius={radii.md} />
              ))}
            </View>
          ) : results.length === 0 ? (
            <View style={styles.list}>
              <EmptyState emoji="🤔" title="Ni de paso lo vimos" description="Probá con otra palabra o con la marca." />
              {footer}
            </View>
          ) : (
            <BackToTopFlatList
              {...LIST_PERFORMANCE}
              data={results}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              keyboardShouldPersistTaps="handled"
              {...(footer ? { ListFooterComponent: <View style={styles.footer}>{footer}</View> } : {})}
              renderItem={({ item }) => (
                <AnimatedPressable accessibilityLabel={`Elegir ${item.name}`} haptic={false} onPress={() => onPick(item)} style={styles.row}>
                  <ProductThumb imageUrl={item.imageUrl} name={item.name} />
                  <View style={styles.rowText}>
                    <Text style={styles.rowName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.rowMeta} numberOfLines={1}>
                      {describeProduct(item) || item.category}
                    </Text>
                  </View>
                  <Text style={styles.pick}>Elegir</Text>
                </AnimatedPressable>
              )}
            />
          )}
        </>
      )}
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    container: { flex: 1, gap: spacing.sm },
    input: { minHeight: 48, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border.subtle, backgroundColor: colors.surface.input, paddingHorizontal: spacing.md, fontFamily: typography.body.fontFamily, fontSize: 15, color: colors.text.primary },
    browse: { gap: spacing.md, paddingBottom: spacing.xxl },
    list: { gap: spacing.sm, paddingBottom: spacing.xxl },
    footer: { marginTop: spacing.md },
    row: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: 64, padding: spacing.sm, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border.subtle, backgroundColor: colors.surface.primary },
    rowText: { flex: 1, gap: 2 },
    rowName: { fontFamily: typography.body.fontFamily, fontWeight: "600", fontSize: 14, color: colors.text.primary },
    rowMeta: { fontFamily: typography.caption.fontFamily, fontSize: 12, color: colors.text.secondary },
    pick: { fontFamily: typography.itemTitle.fontFamily, fontSize: 13, color: colors.brand.route },
  }),
);