import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { EmptyState } from "@/components/common/EmptyState";
import { useColors } from "@/lib/theme";
import { BranchCard } from "./components/BranchCard";
import { MerchantFilters } from "./components/MerchantFilters";
import { MerchantPriceRow } from "./components/MerchantPriceRow";
import { useStyles } from "./styles";
import { useMerchantPrices } from "./useMerchantPrices";
import { LIST_PERFORMANCE } from "@/lib/listPerformance";

/**
 * Panel del comercio: su sucursal y todos sus precios, con el mismo buscador y filtros que ve
 * la gente (texto, tipo y marca). Una sucursal importada trae miles de precios, por eso la
 * lista viene paginada desde el servidor (ver `useMerchantPrices`).
 */
export default function MerchantHomeScreen() {
  const colors = useColors();
  const styles = useStyles();
  const data = useMerchantPrices();

  const header = (
    <View style={styles.header}>
      {data.branch ? <BranchCard branch={data.branch} total={data.total} hasFilters={data.hasFilters} /> : null}

      <AnimatedPressable accessibilityLabel="Agregar un producto" onPress={() => router.push("/merchant/price-form")} style={styles.addButton}>
        <Ionicons name="add" size={20} color={colors.text.onNavy} />
        <Text style={styles.addLabel}>Agregar producto</Text>
      </AnimatedPressable>

      <MerchantFilters
        query={data.query}
        onChangeQuery={data.setQuery}
        facets={data.facets}
        typeId={data.typeId}
        brandId={data.brandId}
        hasFilters={data.hasFilters}
        hasText={data.trimmed.length > 0}
        onPickType={data.pickType}
        onPickBrand={data.setBrandId}
        onClear={data.clearFilters}
      />
    </View>
  );

  // lo que se muestra cuando la lista está vacía: cargando, error, sin resultados o sin productos
  const empty = data.isLoading ? (
    <ActivityIndicator color={colors.text.secondary} style={styles.loader} />
  ) : data.failed ? (
    <EmptyState emoji="📡" title="No pudimos cargar tus productos" description="Revisá la conexión y volvé a entrar." />
  ) : data.hasFilters ? (
    <EmptyState emoji="🤔" title="No hay nada con eso" description="Probá con otra palabra o sacando un filtro." />
  ) : (
    <EmptyState
      emoji="🛒"
      title="Todavía no cargaste productos"
      description="Agregá lo que vendés con su precio para que aparezca en las comparaciones de DePaso."
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
          {...LIST_PERFORMANCE}
        data={data.prices}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={header}
        onEndReached={data.loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={data.isLoadingMore ? <ActivityIndicator color={colors.text.secondary} /> : undefined}
        ListEmptyComponent={empty}
        renderItem={({ item }) => <MerchantPriceRow item={item} />}
      />
    </View>
  );
}
