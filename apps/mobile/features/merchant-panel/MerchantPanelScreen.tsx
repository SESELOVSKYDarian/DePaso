import { Ionicons } from "@expo/vector-icons";
import type { MerchantBranchResponse, MerchantPriceResponse, MerchantPricesResponse } from "@depaso/validation";
import { makeStyles, useColors } from "@/lib/theme";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { EmptyState } from "@/components/common/EmptyState";
import { merchantClient } from "@/lib/apiClient";
import { useStyles } from "./styles";
import { Facets } from "./types";
import { formatPrice } from "./helpers";

/**
 * Panel del comercio: su sucursal y todos sus precios, con el mismo buscador y filtros que ve
 * la gente (texto, tipo y marca). Una sucursal importada trae miles de precios, por eso la
 * lista viene paginada desde el servidor.
 */
export default function MerchantHomeScreen() {
  const colors = useColors();
  const styles = useStyles();
  const [branch, setBranch] = useState<MerchantBranchResponse | null>(null);
  const [query, setQuery] = useState("");
  const [typeId, setTypeId] = useState<string | null>(null);
  const [brandId, setBrandId] = useState<string | null>(null);
  const [prices, setPrices] = useState<MerchantPriceResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [facets, setFacets] = useState<Facets>({ types: [], brands: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reload, setReload] = useState(0);
  const requestId = useRef(0);
  const trimmed = query.trim();

  useEffect(() => {
    merchantClient
      .branch()
      .then(({ branch: found }) => setBranch(found))
      .catch(() => setBranch(null));
  }, []);

  // Al volver de editar un precio se recarga la lista.
  useFocusEffect(
    useCallback(() => {
      setReload((n) => n + 1);
    }, []),
  );

  useEffect(() => {
    const id = ++requestId.current;
    setIsLoading(true);
    const timer = setTimeout(
      () => {
        merchantClient.prices
          .list({ q: trimmed || undefined, type: typeId ?? undefined, brandId: brandId ?? undefined })
          .then((response) => {
            if (id !== requestId.current) return;
            setPrices(response.prices);
            setTotal(response.total);
            setFacets(response.facets);
            setFailed(false);
          })
          .catch(() => {
            if (id === requestId.current) setFailed(true);
          })
          .finally(() => {
            if (id === requestId.current) setIsLoading(false);
          });
      },
      trimmed ? 300 : 0,
    );
    return () => clearTimeout(timer);
  }, [trimmed, typeId, brandId, reload]);

  const loadMore = () => {
    if (isLoadingMore || isLoading || prices.length >= total) return;
    setIsLoadingMore(true);
    const id = requestId.current;
    merchantClient.prices
      .list({ q: trimmed || undefined, type: typeId ?? undefined, brandId: brandId ?? undefined, offset: prices.length })
      .then((response) => {
        if (id === requestId.current) setPrices((current) => [...current, ...response.prices]);
      })
      .catch(() => undefined)
      .finally(() => setIsLoadingMore(false));
  };

  const hasFilters = trimmed.length > 0 || typeId !== null || brandId !== null;

  const header = (
    <View style={styles.header}>
      {branch ? (
        <View style={styles.branchCard}>
          <Ionicons name="storefront-outline" size={24} color={colors.text.onNavy} />
          <View style={styles.flex}>
            <Text style={styles.branchName}>{branch.storeName}</Text>
            <Text style={styles.branchAddress} numberOfLines={1}>
              {branch.address}
            </Text>
          </View>
          <View style={styles.counter}>
            <Text style={styles.counterValue}>{total}</Text>
            <Text style={styles.counterLabel}>{hasFilters ? "encontrados" : "productos"}</Text>
          </View>
        </View>
      ) : null}

      <AnimatedPressable
        accessibilityLabel="Agregar un producto"
        onPress={() => router.push("/merchant/price-form")}
        style={styles.addButton}
      >
        <Ionicons name="add" size={20} color={colors.text.onNavy} />
        <Text style={styles.addLabel}>Agregar producto</Text>
      </AnimatedPressable>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.text.secondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar en tus productos"
          placeholderTextColor={colors.text.muted}
          autoCapitalize="none"
          returnKeyType="search"
          accessibilityLabel="Buscar en tus productos"
          style={styles.searchInput}
        />
        {query ? (
          <AnimatedPressable accessibilityLabel="Borrar búsqueda" haptic={false} onPress={() => setQuery("")}>
            <Ionicons name="close-circle" size={18} color={colors.text.secondary} />
          </AnimatedPressable>
        ) : null}
      </View>

      {facets.types.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {facets.types.map((type) => {
            const selected = typeId === type.id;
            return (
              <AnimatedPressable
                key={type.id}
                accessibilityLabel={`${selected ? "Quitar filtro" : "Filtrar por"} ${type.label}`}
                haptic={false}
                onPress={() => {
                  setTypeId(selected ? null : type.id);
                  setBrandId(null);
                }}
                style={[styles.chip, selected ? styles.chipSelected : null]}
              >
                <Text style={[styles.chipLabel, selected ? styles.chipLabelSelected : null]}>
                  {type.label} · {type.count}
                </Text>
              </AnimatedPressable>
            );
          })}
        </ScrollView>
      ) : null}

      {facets.brands.length > 0 && (typeId || trimmed) ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {facets.brands.map((brand) => {
            const selected = brandId === brand.id;
            return (
              <AnimatedPressable
                key={brand.id}
                accessibilityLabel={`${selected ? "Quitar marca" : "Marca"} ${brand.name}`}
                haptic={false}
                onPress={() => setBrandId(selected ? null : brand.id)}
                style={[styles.chip, selected ? styles.chipSelected : null]}
              >
                <Text style={[styles.chipLabel, selected ? styles.chipLabelSelected : null]}>{brand.name}</Text>
              </AnimatedPressable>
            );
          })}
        </ScrollView>
      ) : null}

      {hasFilters ? (
        <AnimatedPressable
          accessibilityLabel="Limpiar búsqueda y filtros"
          haptic={false}
          onPress={() => {
            setQuery("");
            setTypeId(null);
            setBrandId(null);
          }}
          style={styles.clear}
        >
          <Text style={styles.clearLabel}>Limpiar filtros</Text>
        </AnimatedPressable>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={prices}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={header}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={isLoadingMore ? <ActivityIndicator color={colors.text.secondary} /> : undefined}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={colors.text.secondary} style={styles.loader} />
          ) : failed ? (
            <EmptyState emoji="📡" title="No pudimos cargar tus productos" description="Revisá la conexión y volvé a entrar." />
          ) : hasFilters ? (
            <EmptyState emoji="🤔" title="No hay nada con eso" description="Probá con otra palabra o sacando un filtro." />
          ) : (
            <EmptyState
              emoji="🛒"
              title="Todavía no cargaste productos"
              description="Agregá lo que vendés con su precio para que aparezca en las comparaciones de DePaso."
            />
          )
        }
        renderItem={({ item }) => {
          const name = item.displayName ?? item.productName;
          const fromPublicSource = item.sourceType !== "MERCHANT";
          return (
            <AnimatedPressable
              accessibilityLabel={`Editar ${name}, ${formatPrice(item.price)}`}
              haptic={false}
              onPress={() =>
                router.push({
                  pathname: "/merchant/price-form",
                  params: {
                    priceId: item.id,
                    name: item.productName,
                    price: String(item.price),
                    displayName: item.displayName ?? "",
                  },
                })
              }
              style={styles.row}
            >
              <View style={styles.flex}>
                <Text style={styles.rowName} numberOfLines={2}>
                  {name}
                </Text>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {[item.brandName, item.unitSize > 0 ? `${item.unitSize}${item.unit}` : null].filter(Boolean).join(" · ")}
                </Text>
                {fromPublicSource ? <Text style={styles.badge}>Precio publicado por SEPA · tocá para confirmarlo</Text> : null}
              </View>
              <Text style={styles.rowPrice}>{formatPrice(item.price)}</Text>
              <Ionicons name="create-outline" size={18} color={colors.text.secondary} />
            </AnimatedPressable>
          );
        }}
      />
    </View>
  );
}
