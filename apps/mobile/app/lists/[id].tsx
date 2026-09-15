import type { ShoppingListResponse } from "@depaso/validation";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeOutLeft, useReducedMotion } from "react-native-reanimated";
import { colors, motion, radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";
import { useToast } from "@/components/Toast";
import { useLists } from "@/lib/lists/ListsContext";

/** Detalle de una lista de compra (Fase 9) — agregar/quitar productos, ajustar cantidad. */
export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { lists, getList, updateItem, removeItem, removeList } = useLists();
  const { show: showToast } = useToast();
  const reducedMotion = useReducedMotion();
  // `itemCount` del resumen compartido (`ListsContext`) — cambia cuando `lists/search.tsx`
  // agrega un producto y vuelve acá. Bug real encontrado probando el flujo completo: sin
  // esto, la pantalla mostraba "vacía" después de agregar un producto porque el detalle
  // se pedía una sola vez al montar, sin refetch al volver de buscar (este proyecto evita
  // `useFocusEffect` — no está confirmado accesible desde `expo-router` sin importar
  // `@react-navigation/native` directo, ver `PlacesContext`).
  const summaryItemCount = lists.find((l) => l.id === id)?.itemCount;

  const [list, setList] = useState<ShoppingListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetched = await getList(id);
      setList(fetched);
      setError(null);
    } catch {
      setError("No pudimos cargar esta lista.");
    } finally {
      setIsLoading(false);
    }
  }, [id, getList]);

  useEffect(() => {
    void load();
    // Deliberadamente sin `load` en las deps de abajo — sólo debe re-disparar cuando
    // cambia el conteo real de items, no cada vez que `load` se recrea (sería un loop).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, summaryItemCount]);

  const handleQuantityChange = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    try {
      const updated = await updateItem(id, itemId, { quantity });
      setList(updated);
    } catch {
      showToast("No pudimos actualizar la cantidad.", "error");
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      const updated = await removeItem(id, itemId);
      setList(updated);
    } catch {
      showToast("No pudimos quitar el producto.", "error");
    }
  };

  const handleDeleteList = async () => {
    try {
      await removeList(id);
      router.back();
    } catch {
      showToast("No pudimos eliminar la lista.", "error");
    }
  };

  if (isLoading && !list) {
    return (
      <View style={styles.container}>
        <View style={styles.list}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} width="100%" height={56} borderRadius={12} />
          ))}
        </View>
      </View>
    );
  }

  if (error || !list) {
    return <EmptyState emoji="⚠️" title="Algo salió mal" description={error ?? "Lista no encontrada."} />;
  }

  return (
    <View style={styles.container}>
      {list.items.length === 0 ? (
        <EmptyState
          emoji="🛒"
          title="Esta lista está vacía"
          description="Buscá productos y agregalos — el motor de optimización los necesita para armar tu Top 3."
        />
      ) : (
        <FlatList
          data={list.items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Animated.View
              entering={reducedMotion ? undefined : FadeInDown.springify().damping(motion.spring.soft.damping).stiffness(motion.spring.soft.stiffness)}
              exiting={reducedMotion ? undefined : FadeOutLeft.duration(motion.duration.fast)}
              style={styles.row}
            >
              <View style={styles.rowText}>
                <Text style={styles.rowName}>{item.productName}</Text>
                {item.note ? <Text style={styles.rowNote}>{item.note}</Text> : null}
              </View>
              <View style={styles.quantityRow}>
                <AnimatedPressable
                  accessibilityLabel="Restar uno"
                  haptic={false}
                  onPress={() => void handleQuantityChange(item.id, item.quantity - 1)}
                  style={styles.stepperButton}
                >
                  <Text style={styles.stepperLabel}>−</Text>
                </AnimatedPressable>
                <Text style={styles.quantity}>{item.quantity}</Text>
                <AnimatedPressable
                  accessibilityLabel="Sumar uno"
                  haptic={false}
                  onPress={() => void handleQuantityChange(item.id, item.quantity + 1)}
                  style={styles.stepperButton}
                >
                  <Text style={styles.stepperLabel}>+</Text>
                </AnimatedPressable>
              </View>
              <AnimatedPressable
                accessibilityLabel={`Quitar ${item.productName}`}
                haptic={false}
                onPress={() => void handleRemoveItem(item.id)}
                style={styles.removeButton}
              >
                <Text style={styles.removeLabel}>✕</Text>
              </AnimatedPressable>
            </Animated.View>
          )}
        />
      )}

      <View style={styles.footer}>
        <AnimatedPressable
          accessibilityLabel="Agregar producto"
          onPress={() => router.push({ pathname: "/lists/search", params: { listId: id } })}
          style={styles.addButton}
        >
          <Text style={styles.addLabel}>+ Agregar producto</Text>
        </AnimatedPressable>
        <AnimatedPressable
          accessibilityLabel="Eliminar lista"
          haptic={false}
          onPress={() => void handleDeleteList()}
          style={styles.deleteButton}
        >
          <Text style={styles.deleteLabel}>Eliminar lista</Text>
        </AnimatedPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.base,
  },
  list: {
    padding: spacing.lg,
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
  rowNote: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 1,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  stepperButton: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperLabel: {
    fontFamily: typography.body.fontFamily,
    fontWeight: "700",
    fontSize: 16,
    color: colors.text.primary,
  },
  quantity: {
    fontFamily: typography.body.fontFamily,
    fontWeight: "600",
    fontSize: 15,
    color: colors.text.primary,
    minWidth: 20,
    textAlign: "center",
  },
  removeButton: {
    padding: spacing.xxs,
  },
  removeLabel: {
    color: colors.text.muted,
    fontSize: 16,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    gap: spacing.sm,
  },
  addButton: {
    backgroundColor: colors.brand.navy,
    borderRadius: radii.lg,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  addLabel: {
    fontFamily: typography.title.fontFamily,
    fontWeight: "600",
    fontSize: 16,
    color: colors.text.onNavy,
  },
  deleteButton: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.state.error,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  deleteLabel: {
    fontFamily: typography.body.fontFamily,
    fontWeight: "600",
    fontSize: 15,
    color: colors.state.error,
  },
});
