import { Ionicons } from "@expo/vector-icons";
import type { ShoppingListSummary } from "@depaso/validation";
import { colors, radii, spacing, typography } from "@depaso/design-tokens";
import { router } from "expo-router";
import { useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";
import { useLists } from "@/lib/lists/ListsContext";

/**
 * Mis listas (Fase 9). El backend real (`ShoppingList` CRUD) ya existe — ver
 * `docs/development/IMPLEMENTATION-PLAN.md`. "Compartidas" sigue sin implementar (no hay
 * modelo de lista compartida entre usuarios todavía).
 */
export default function ListsScreen() {
  const { lists, isLoading, error } = useLists();
  const [tab, setTab] = useState<"mine" | "shared">("mine");

  const active = lists.filter((l) => !l.archivedAt);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Mis listas</Text>
        <AnimatedPressable
          accessibilityLabel="Crear una lista nueva"
          onPress={() => router.push("/lists/form")}
          style={styles.addButton}
        >
          <Ionicons name="add" size={20} color={colors.text.onLime} />
        </AnimatedPressable>
      </View>

      <View style={styles.tabs}>
        <AnimatedPressable
          accessibilityLabel="Mis listas"
          haptic={false}
          onPress={() => setTab("mine")}
          style={[styles.tabButton, tab === "mine" ? styles.tabButtonActive : null]}
        >
          <Text style={[styles.tabLabel, tab === "mine" ? styles.tabLabelActive : null]}>Mis listas</Text>
        </AnimatedPressable>
        <AnimatedPressable
          accessibilityLabel="Compartidas"
          haptic={false}
          onPress={() => setTab("shared")}
          style={[styles.tabButton, tab === "shared" ? styles.tabButtonActive : null]}
        >
          <Text style={[styles.tabLabel, tab === "shared" ? styles.tabLabelActive : null]}>Compartidas</Text>
        </AnimatedPressable>
      </View>

      {tab === "shared" ? (
        <EmptyState emoji="🤝" title="Todavía no hay listas compartidas" description="Compartir listas con otras personas llega en una fase siguiente." />
      ) : isLoading && active.length === 0 ? (
        <View style={styles.list}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} width="100%" height={72} borderRadius={12} />
          ))}
        </View>
      ) : error ? (
        <EmptyState emoji="⚠️" title="Algo salió mal" description={error} />
      ) : active.length === 0 ? (
        <EmptyState
          emoji="📝"
          title="Todavía no tenés listas"
          description="Creá tu primera lista y empezá a agregar productos — es lo que necesita el motor de optimización para armar tu Top 3."
        />
      ) : (
        <FlatList
          data={active}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <ListCard list={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function ListCard({ list }: { list: ShoppingListSummary }) {
  return (
    <AnimatedPressable
      accessibilityLabel={`Abrir lista ${list.name}`}
      haptic={false}
      onPress={() => router.push({ pathname: "/lists/[id]", params: { id: list.id } })}
      style={styles.card}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{list.name}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
      </View>
      <Text style={styles.cardMeta}>
        {list.itemCount} {list.itemCount === 1 ? "producto" : "productos"}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.base,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  title: {
    fontFamily: typography.heroTitle.fontFamily,
    fontSize: 24,
    color: colors.text.primary,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: colors.brand.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  tabs: {
    flexDirection: "row",
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.surface.primary,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  tabButtonActive: {
    backgroundColor: colors.brand.navy,
  },
  tabLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    color: colors.text.secondary,
  },
  tabLabelActive: {
    color: colors.text.onNavy,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface.primary,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontFamily: typography.itemTitle.fontFamily,
    fontSize: 15,
    color: colors.text.primary,
  },
  cardMeta: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
});
