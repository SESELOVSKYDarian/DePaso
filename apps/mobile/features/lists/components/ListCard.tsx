import { Ionicons } from "@expo/vector-icons";
import type { ShoppingListSummary } from "@depaso/validation";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { productIcon } from "@/lib/products/productIcon";
import { makeStyles, useColors } from "@/lib/theme";

/** Tarjeta de una lista: portada con ícono, nombre, cantidad y si está compartida. */
export function ListCard({ list }: { list: ShoppingListSummary }) {
  const colors = useColors();
  const styles = useStyles();
  const count = `${list.itemCount} ${list.itemCount === 1 ? "producto" : "productos"}`;
  const sharedNote =
    list.role === "MEMBER"
      ? `Compartida por ${list.ownerName ?? "otra persona"}`
      : list.memberCount > 0
        ? "Compartida"
        : null;

  return (
    <AnimatedPressable
      accessibilityLabel={`Abrir lista ${list.name}`}
      haptic={false}
      onPress={() => router.push({ pathname: "/lists/[id]", params: { id: list.id } })}
      style={styles.card}
    >
      <View style={styles.cover}>
        {/* el ícono sale del nombre: "Asado" → carne, "Casa" → canasta */}
        <Ionicons name={productIcon(list.name)} size={30} color={colors.brand.accentDark} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={1}>
          {list.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {count}
        </Text>
        {sharedNote ? (
          <View style={styles.sharedChip}>
            <Ionicons name="people-outline" size={12} color={colors.brand.accentDark} />
            <Text style={styles.sharedText} numberOfLines={1}>
              {sharedNote}
            </Text>
          </View>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
    </AnimatedPressable>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      padding: spacing.md,
      backgroundColor: colors.surface.primary,
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    cover: {
      width: 64,
      height: 64,
      borderRadius: radii.lg,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.tint.green.bg,
      borderWidth: 1,
      borderColor: colors.tint.green.border,
    },
    text: { flex: 1, gap: 2 },
    title: { fontFamily: typography.itemTitle.fontFamily, fontSize: 17, lineHeight: 24, color: colors.text.primary },
    meta: { fontFamily: typography.body.fontFamily, fontSize: 13, color: colors.text.secondary },
    sharedChip: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
    sharedText: { fontFamily: typography.body.fontFamily, fontSize: 12, color: colors.brand.accentDark },
  }),
);
