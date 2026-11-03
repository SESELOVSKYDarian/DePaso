import { Ionicons } from "@expo/vector-icons";
import type { HomeProduct } from "@depaso/validation";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { BottomSheet } from "@/components/common/BottomSheet";
import { Button } from "@/components/common/Button";
import { makeStyles, useColors } from "@/lib/theme";

interface ListOption {
  id: string;
  name: string;
  itemCount: number;
}

interface AddToListSheetProps {
  /** `null` = cerrada */
  product: HomeProduct | null;
  lists: ListOption[];
  /** lista que viene marcada de entrada */
  defaultListId: string | null;
  isSaving: boolean;
  onConfirm: (listId: string, quantity: number) => void;
  onClose: () => void;
}

const MAX_QUANTITY = 99;

/** Hoja para sumar un producto sugerido: se elige a qué lista va y cuántas unidades. */
export function AddToListSheet({ product, lists, defaultListId, isSaving, onConfirm, onClose }: AddToListSheetProps) {
  const styles = useStyles();
  const colors = useColors();
  const [listId, setListId] = useState<string | null>(defaultListId);
  const [quantity, setQuantity] = useState(1);

  // cada vez que se abre con otro producto arranca de cero
  useEffect(() => {
    if (product) {
      setListId(defaultListId ?? lists[0]?.id ?? null);
      setQuantity(1);
    }
  }, [product, defaultListId, lists]);

  return (
    <BottomSheet visible={product !== null} onClose={onClose}>
      <Text style={styles.title}>Sumar a una lista</Text>
      {product ? (
        <Text style={styles.product} numberOfLines={2}>
          {product.name}
        </Text>
      ) : null}

      <Text style={styles.label}>¿A qué lista?</Text>
      <View style={styles.lists}>
        {lists.map((list) => {
          const selected = list.id === listId;
          return (
            <Pressable
              key={list.id}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`Lista ${list.name}`}
              onPress={() => setListId(list.id)}
              style={[styles.listRow, selected ? styles.listRowSelected : null]}
            >
              <Ionicons name={selected ? "radio-button-on" : "radio-button-off"} size={20} color={selected ? colors.brand.navy : colors.text.tertiary} />
              <Text style={styles.listName} numberOfLines={1}>
                {list.name}
              </Text>
              <Text style={styles.listCount}>
                {list.itemCount} {list.itemCount === 1 ? "producto" : "productos"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>¿Cuántas unidades?</Text>
      <View style={styles.stepper}>
        <Pressable
          accessibilityLabel="Una unidad menos"
          disabled={quantity <= 1}
          onPress={() => setQuantity((q) => Math.max(1, q - 1))}
          style={[styles.stepButton, quantity <= 1 ? styles.stepDisabled : null]}
        >
          <Ionicons name="remove" size={22} color={colors.text.primary} />
        </Pressable>
        <Text accessibilityLabel={`${quantity} unidades`} style={styles.quantity}>
          {quantity}
        </Text>
        <Pressable
          accessibilityLabel="Una unidad más"
          disabled={quantity >= MAX_QUANTITY}
          onPress={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
          style={styles.stepButton}
        >
          <Ionicons name="add" size={22} color={colors.text.primary} />
        </Pressable>
      </View>

      <Button
        label={isSaving ? "Sumando…" : quantity > 1 ? `Sumar ${quantity} unidades` : "Sumar a la lista"}
        onPress={() => listId && onConfirm(listId, quantity)}
        loading={isSaving}
        disabled={!listId || isSaving}
      />
    </BottomSheet>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    title: { fontFamily: typography.screenTitle.fontFamily, fontSize: 20, color: colors.text.primary },
    product: { fontFamily: typography.body.fontFamily, fontSize: 14, lineHeight: 20, color: colors.text.secondary, marginBottom: spacing.sm },
    label: { fontFamily: typography.itemTitle.fontFamily, fontSize: 14, color: colors.text.primary, marginTop: spacing.sm },
    lists: { gap: spacing.xs },
    listRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      minHeight: 48,
      paddingHorizontal: spacing.md,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      backgroundColor: colors.surface.primary,
    },
    listRowSelected: { borderColor: colors.brand.navy, borderWidth: 2 },
    listName: { flex: 1, fontFamily: typography.itemTitle.fontFamily, fontSize: 15, color: colors.text.primary },
    listCount: { fontFamily: typography.caption.fontFamily, fontSize: 12, color: colors.text.secondary },
    stepper: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.lg, marginBottom: spacing.sm },
    stepButton: {
      width: 48,
      height: 48,
      borderRadius: radii.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface.input,
    },
    stepDisabled: { opacity: 0.4 },
    quantity: { minWidth: 56, textAlign: "center", fontFamily: typography.heroTitle.fontFamily, fontSize: 30, color: colors.text.primary },
  }),
);
