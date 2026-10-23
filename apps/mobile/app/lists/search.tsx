import { Ionicons } from "@expo/vector-icons";
import { PRODUCT_TYPE_GROUPS, PRODUCT_TYPE_LABELS } from "@depaso/domain";
import type { ProductFacets, ProductSearchResult } from "@depaso/validation";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState, type ComponentProps } from "react";
import { FlatList, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { makeStyles, useColors } from "@/lib/theme";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { EmptyState } from "@/components/EmptyState";
import { ProductThumb } from "@/components/ProductThumb";
import { useToast } from "@/components/Toast";
import { productsClient } from "@/lib/apiClient";
import { useLists } from "@/lib/lists/ListsContext";

type IconName = ComponentProps<typeof Ionicons>["name"];

const EMPTY_FACETS: ProductFacets = { types: [], brands: [] };

const GROUP_ICONS: Record<string, IconName> = {
  bebidas: "water-outline",
  alcohol: "wine-outline",
  infusiones: "cafe-outline",
  lacteos: "egg-outline",
  almacen: "basket-outline",
  dulces: "ice-cream-outline",
  carnes: "restaurant-outline",
  limpieza: "sparkles-outline",
  personal: "body-outline",
  bebes: "happy-outline",
  hogar: "home-outline",
};

const groupOfType = (typeId: string) => PRODUCT_TYPE_GROUPS.find((group) => group.typeIds.includes(typeId)) ?? null;

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

  const [query, setQuery] = useState("");
  const [groupId, setGroupId] = useState<string | null>(null);
  const [typeId, setTypeId] = useState<string | null>(null);
  const [brand, setBrand] = useState<{ id: string; name: string } | null>(null);
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [facets, setFacets] = useState<ProductFacets>(EMPTY_FACETS);
  const [isSearching, setIsSearching] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [addingId, setAddingId] = useState<string | null>(null);

  const requestId = useRef(0);
  const trimmed = query.trim();
  const hasCriteria = trimmed.length > 0 || typeId !== null || brand !== null;
  const group = PRODUCT_TYPE_GROUPS.find((g) => g.id === groupId) ?? (typeId ? groupOfType(typeId) : null);

  // Cada cambio de texto o filtro vuelve a buscar (con una pausa corta mientras se tipea).
  useEffect(() => {
    if (!hasCriteria) {
      setResults([]);
      setFacets(EMPTY_FACETS);
      setFailed(false);
      return;
    }
    const id = ++requestId.current;
    const filters = { type: typeId ?? undefined, brandId: brand?.id };
    setIsSearching(true);
    const timer = setTimeout(
      async () => {
        const [found, options] = await Promise.all([
          productsClient.search(trimmed, filters).catch(() => null),
          productsClient.facets(trimmed, { type: typeId ?? undefined }).catch(() => null),
        ]);
        if (id !== requestId.current) return; // llegó tarde: ya hay una búsqueda más nueva
        // Un error de red no es "no existe": se avisa distinto y se puede reintentar.
        setFailed(found === null);
        setResults(found?.results ?? []);
        if (options) setFacets(options);
        setIsSearching(false);
      },
      trimmed ? 300 : 0,
    );
    return () => clearTimeout(timer);
  }, [trimmed, typeId, brand, hasCriteria, retry]);

  const pickType = (id: string | null) => {
    setTypeId(id);
    setBrand(null);
  };

  const goHome = () => {
    setGroupId(null);
    pickType(null);
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

  const crumbs: { label: string; onPress: () => void }[] = [];
  if (group || typeId) crumbs.push({ label: "Todo", onPress: goHome });
  if (group) crumbs.push({ label: group.label, onPress: () => { setGroupId(group.id); pickType(null); } });
  if (typeId) crumbs.push({ label: PRODUCT_TYPE_LABELS[typeId] ?? typeId, onPress: () => setBrand(null) });
  if (brand) crumbs.push({ label: brand.name, onPress: () => undefined });

  // Tipos para elegir: los de la categoría (explorando) o los que salen de la búsqueda (escribiendo).
  const typeOptions =
    trimmed.length > 0 ? facets.types.map((t) => ({ id: t.id, label: t.label })) : [];

  const header = (
    <View style={styles.headerBlock}>
      {crumbs.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.crumbs}>
          {crumbs.map((crumb, index) => (
            <View key={crumb.label} style={styles.crumbItem}>
              {index > 0 ? <Ionicons name="chevron-forward" size={14} color={colors.text.tertiary} /> : null}
              <AnimatedPressable accessibilityLabel={`Ir a ${crumb.label}`} haptic={false} onPress={crumb.onPress}>
                <Text style={[styles.crumb, index === crumbs.length - 1 ? styles.crumbCurrent : null]}>{crumb.label}</Text>
              </AnimatedPressable>
            </View>
          ))}
        </ScrollView>
      ) : null}

      {typeOptions.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.chipRow}>
          {typeOptions.map((type) => {
            const selected = typeId === type.id;
            return (
              <AnimatedPressable
                key={type.id}
                accessibilityLabel={`${selected ? "Quitar filtro" : "Filtrar por"} ${type.label}`}
                haptic={false}
                onPress={() => pickType(selected ? null : type.id)}
                style={[styles.chip, selected ? styles.chipSelected : null]}
              >
                <Text style={[styles.chipLabel, selected ? styles.chipLabelSelected : null]}>{type.label}</Text>
              </AnimatedPressable>
            );
          })}
        </ScrollView>
      ) : null}

      {typeId && facets.brands.length > 0 ? (
        <>
          <Text style={styles.sectionLabel}>Marcas</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.chipRow}>
            {[{ id: "", name: "Todas", count: 0 }, ...facets.brands].map((option) => {
              const selected = option.id === "" ? brand === null : brand?.id === option.id;
              return (
                <AnimatedPressable
                  key={option.id || "all"}
                  accessibilityLabel={option.id ? `Marca ${option.name}` : "Todas las marcas"}
                  haptic={false}
                  onPress={() => setBrand(option.id ? { id: option.id, name: option.name } : null)}
                  style={[styles.brandBox, selected ? styles.chipSelected : null]}
                >
                  <Text style={[styles.brandName, selected ? styles.chipLabelSelected : null]} numberOfLines={1}>
                    {option.name}
                  </Text>
                  {option.count > 0 ? (
                    <Text style={[styles.brandCount, selected ? styles.chipLabelSelected : null]}>{option.count}</Text>
                  ) : null}
                </AnimatedPressable>
              );
            })}
          </ScrollView>
        </>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="¿Qué te falta? Arroz, leche, yerba…"
        placeholderTextColor={colors.text.muted}
        autoCapitalize="none"
        returnKeyType="search"
        style={styles.input}
      />

      {!hasCriteria ? (
        // Explorar sin escribir: cajas de categorías o, dentro de una, de tipos.
        <ScrollView contentContainerStyle={styles.browse} keyboardShouldPersistTaps="handled">
          {group ? (
            <>
              {header}
              <View style={styles.grid}>
                {group.typeIds.map((id) => (
                  <AnimatedPressable
                    key={id}
                    accessibilityLabel={PRODUCT_TYPE_LABELS[id] ?? id}
                    haptic={false}
                    onPress={() => pickType(id)}
                    style={styles.box}
                  >
                    <Ionicons name={GROUP_ICONS[group.id] ?? "pricetag-outline"} size={24} color={colors.text.primary} />
                    <Text style={styles.boxLabel} numberOfLines={2}>
                      {PRODUCT_TYPE_LABELS[id] ?? id}
                    </Text>
                  </AnimatedPressable>
                ))}
              </View>
            </>
          ) : (
            <>
              <AnimatedPressable
                accessibilityLabel="Armar la lista con IA, escribiendo o dictando todo junto"
                haptic={false}
                onPress={() => router.push({ pathname: "/lists/assistant", params: { listId } })}
                style={styles.assistantRow}
              >
                <Ionicons name="sparkles-outline" size={20} color={colors.text.primary} />
                <View style={styles.assistantText}>
                  <Text style={styles.assistantTitle}>Armar con IA</Text>
                  <Text style={styles.assistantSub}>Decí todo lo que te falta de corrido</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
              </AnimatedPressable>
              <Text style={styles.sectionLabel}>O explorá por categoría</Text>
              <View style={styles.grid}>
                {PRODUCT_TYPE_GROUPS.map((option) => (
                  <AnimatedPressable
                    key={option.id}
                    accessibilityLabel={option.label}
                    haptic={false}
                    onPress={() => setGroupId(option.id)}
                    style={styles.box}
                  >
                    <Ionicons name={GROUP_ICONS[option.id] ?? "pricetag-outline"} size={26} color={colors.text.primary} />
                    <Text style={styles.boxLabel} numberOfLines={2}>
                      {option.label}
                    </Text>
                  </AnimatedPressable>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      ) : (
        <>
          {header}
          {failed && !isSearching ? (
            <EmptyState
              emoji="📡"
              title="No pudimos buscar"
              description="Parece un problema de conexión, no que no exista."
              action={
                <AnimatedPressable accessibilityLabel="Reintentar" onPress={() => setRetry((n) => n + 1)} style={styles.retry}>
                  <Text style={styles.retryLabel}>Reintentar</Text>
                </AnimatedPressable>
              }
            />
          ) : results.length === 0 && !isSearching ? (
            <EmptyState
              emoji="🤔"
              title="Ni de paso lo vimos"
              description={typeId || brand ? "Probá con otra marca o sacando el filtro." : "Probá con otra palabra o con la marca."}
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
        </>
      )}
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface.base },
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
    browse: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xl, gap: spacing.sm },
    assistantRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      minHeight: 64,
      paddingHorizontal: spacing.md,
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      backgroundColor: colors.surface.primary,
    },
    assistantText: { flex: 1, gap: 2 },
    assistantTitle: { fontFamily: typography.itemTitle.fontFamily, fontSize: 16, color: colors.text.primary },
    assistantSub: { fontFamily: typography.subtitle.fontFamily, fontSize: 13, color: colors.text.secondary },
    sectionLabel: {
      fontFamily: typography.caption.fontFamily,
      fontSize: 13,
      color: colors.text.secondary,
      marginTop: spacing.xs,
      paddingHorizontal: 0,
    },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
    box: {
      width: "48%",
      flexGrow: 1,
      minHeight: 92,
      padding: spacing.md,
      gap: spacing.xs,
      justifyContent: "space-between",
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      backgroundColor: colors.surface.primary,
    },
    boxLabel: { fontFamily: typography.itemTitle.fontFamily, fontSize: 15, lineHeight: 20, color: colors.text.primary },
    headerBlock: { paddingTop: spacing.sm, gap: spacing.xs },
    crumbs: { paddingHorizontal: spacing.lg, alignItems: "center", gap: spacing.xs },
    crumbItem: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
    crumb: { fontFamily: typography.body.fontFamily, fontSize: 14, color: colors.text.secondary, paddingVertical: 6 },
    crumbCurrent: { color: colors.text.primary, fontWeight: "600" },
    chipRow: { paddingHorizontal: spacing.lg, gap: spacing.xs },
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
    chipSelected: { backgroundColor: colors.brand.navy, borderColor: colors.brand.navy },
    chipLabel: { fontFamily: typography.body.fontFamily, fontSize: 14, color: colors.text.primary },
    chipLabelSelected: { color: colors.text.onNavy },
    brandBox: {
      minWidth: 88,
      maxWidth: 160,
      minHeight: 56,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      backgroundColor: colors.surface.primary,
      justifyContent: "center",
    },
    brandName: { fontFamily: typography.itemTitle.fontFamily, fontSize: 14, color: colors.text.primary },
    brandCount: { fontFamily: typography.caption.fontFamily, fontSize: 12, color: colors.text.secondary },
    retry: {
      minHeight: 44,
      paddingHorizontal: spacing.lg,
      borderRadius: radii.full,
      backgroundColor: colors.brand.navy,
      alignItems: "center",
      justifyContent: "center",
    },
    retryLabel: { fontFamily: typography.buttonLabel.fontFamily, fontSize: 15, color: colors.text.onNavy },
    list: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl, gap: spacing.sm },
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
    rowText: { flex: 1 },
    rowName: { fontFamily: typography.body.fontFamily, fontWeight: "600", fontSize: 15, color: colors.text.primary },
    rowMeta: { fontFamily: typography.caption.fontFamily, fontSize: 12, color: colors.text.muted, marginTop: 1 },
    addLabel: { fontFamily: typography.body.fontFamily, fontWeight: "600", fontSize: 13, color: colors.text.secondary },
  }),
);
