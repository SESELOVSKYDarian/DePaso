import { Ionicons } from "@expo/vector-icons";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { router } from "expo-router";
import { useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { EmptyState } from "@/components/common/EmptyState";
import { FilterChips } from "@/components/common/FilterChips";
import { SearchField } from "@/components/common/SearchField";
import { Skeleton } from "@/components/common/Skeleton";
import { useLists } from "@/lib/lists/ListsContext";
import { makeStyles, useColors } from "@/lib/theme";
import { ListCard } from "./components/ListCard";
import { LIST_PERFORMANCE } from "@/lib/listPerformance";

type Filter = "all" | "mine" | "shared";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "mine", label: "Mías" },
  { id: "shared", label: "Compartidas" },
];

/** Mis listas: buscador, filtros y una tarjeta por lista (las compartidas conmigo van mezcladas). */
export default function ListsScreen() {
  const colors = useColors();
  const styles = useStyles();
  const { lists, isLoading, error } = useLists();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const active = lists.filter((list) => !list.archivedAt);
  const visible = active
    .filter((list) => (filter === "mine" ? list.role === "OWNER" : filter === "shared" ? list.role === "MEMBER" || list.memberCount > 0 : true))
    .filter((list) => list.name.toLowerCase().includes(query.trim().toLowerCase()));

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

      {active.length > 0 ? (
        <View style={styles.filters}>
          <SearchField value={query} onChangeText={setQuery} placeholder="Buscar en mis listas…" />
          <FilterChips options={FILTERS} selected={filter} onSelect={setFilter} />
        </View>
      ) : null}

      {isLoading && active.length === 0 ? (
        <View style={styles.list}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} width="100%" height={92} borderRadius={24} />
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
      ) : visible.length === 0 ? (
        <EmptyState emoji="🔎" title="No encontramos listas" description="Probá con otro nombre o cambiá el filtro." />
      ) : (
        <FlatList
          {...LIST_PERFORMANCE}
          data={visible}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <ListCard list={item} />}
        />
      )}
    </SafeAreaView>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface.base },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
    },
    title: { fontFamily: typography.heroTitle.fontFamily, fontSize: 32, lineHeight: 38, color: colors.text.primary },
    addButton: {
      width: 44,
      height: 44,
      borderRadius: radii.full,
      backgroundColor: colors.brand.navy,
      alignItems: "center",
      justifyContent: "center",
    },
    filters: { paddingHorizontal: spacing.lg, gap: spacing.xs },
    list: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxl, gap: spacing.md },
  }),
);
