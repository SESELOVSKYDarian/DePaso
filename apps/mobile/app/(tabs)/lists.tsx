import { Ionicons } from "@expo/vector-icons";
import type { ShoppingListSummary } from "@depaso/validation";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { makeStyles, useColors } from "@/lib/theme";
import { router } from "expo-router";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/common/Skeleton";
import { useLists } from "@/lib/lists/ListsContext";

/**
 * Mis listas. Una sola lista, sin pestañas: las que compartieron con vos aparecen mezcladas
 * y se distinguen por una línea chica debajo del nombre.
 */
export default function ListsScreen() {
  const colors = useColors();
  const styles = useStyles();
  const { lists, isLoading, error } = useLists();

  const active = lists.filter((l) => !l.archivedAt);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Text accessibilityRole="header" style={styles.title}>
          Mis listas
        </Text>
        <AnimatedPressable
          accessibilityLabel="Crear una lista nueva"
          onPress={() => router.push("/lists/form")}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color={colors.text.onNavy} />
        </AnimatedPressable>
      </View>

      {isLoading && active.length === 0 ? (
        <View style={styles.list}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} width="100%" height={72} borderRadius={16} />
          ))}
        </View>
      ) : error ? (
        <EmptyState emoji="⚠️" title="Algo salió mal" description={error} />
      ) : active.length === 0 ? (
        <EmptyState
          emoji="📝"
          title="Todavía no tenés listas"
          description="Armá una con lo que te falta y nosotros buscamos dónde te queda de paso."
        />
      ) : (
        <FlatList
          data={active}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <ListCard list={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function ListCard({ list }: { list: ShoppingListSummary }) {
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
      <View style={styles.cardText}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {list.name}
        </Text>
        <Text style={styles.cardMeta} numberOfLines={1}>
          {sharedNote ? `${count}  ·  ${sharedNote}` : count}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
    </AnimatedPressable>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface.base,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
    },
    title: {
      fontFamily: typography.heroTitle.fontFamily,
      fontSize: 32,
      lineHeight: 38,
      color: colors.text.primary,
    },
    addButton: {
      width: 44,
      height: 44,
      borderRadius: radii.full,
      backgroundColor: colors.brand.navy,
      alignItems: "center",
      justifyContent: "center",
    },
    list: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xs,
      paddingBottom: spacing.xxl,
      gap: spacing.md,
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      minHeight: 72,
      backgroundColor: colors.surface.primary,
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    cardText: {
      flex: 1,
      gap: 2,
    },
    cardTitle: {
      fontFamily: typography.itemTitle.fontFamily,
      fontSize: 17,
      lineHeight: 24,
      color: colors.text.primary,
    },
    cardMeta: {
      fontFamily: typography.subtitle.fontFamily,
      fontSize: 14,
      color: colors.text.secondary,
    },
  }),
);
