import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { EmptyState } from "@/components/common/EmptyState";
import { makeStyles, useColors } from "@/lib/theme";
import { ActivityTabs } from "./components/ActivityTabs";
import { AnnouncementRow } from "./components/AnnouncementRow";
import { PersonalRow } from "./components/PersonalRow";
import { useActivityFeed } from "./useActivityFeed";
import { LIST_PERFORMANCE } from "@/lib/listPerformance";

/**
 * Actividad. "Novedades" son los avisos que publica el equipo (actualizaciones, promos, mantenimiento);
 * "Para vos" junta lo que le pasa a esta cuenta: listas que te compartieron, productos de tus listas
 * que bajaron de precio y ofertas en comercios cerca de tus lugares.
 */
export default function ActivityScreen() {
  const styles = useStyles();
  const colors = useColors();
  const { tab, setTab, news, mine, refreshing, refresh } = useActivityFeed();
  const feed = tab === "news" ? news : mine;
  const refreshControl = <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text accessibilityRole="header" style={styles.title}>
        Actividad
      </Text>
      <ActivityTabs tab={tab} onChange={setTab} />

      {!feed.loaded ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.text.secondary} />
        </View>
      ) : feed.failed && feed.items.length === 0 ? (
        <EmptyState emoji="📡" title="No pudimos cargarlo" description="Revisá tu conexión y tirá hacia abajo para reintentar." />
      ) : feed.items.length === 0 ? (
        tab === "news" ? (
          <EmptyState emoji="📣" title="Todavía no hay novedades" description="Cuando el equipo publique algo (mejoras, promos, avisos), lo vas a ver acá." />
        ) : (
          <EmptyState
            emoji="🔔"
            title="Por ahora no hay avisos para vos"
            description="Te avisamos cuando te compartan una lista, baje un producto de tus listas o haya algo barato cerca de tus lugares."
          />
        )
      ) : tab === "news" ? (
        <FlatList
          {...LIST_PERFORMANCE}
          data={news.items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <AnnouncementRow item={item} />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={refreshControl}
        />
      ) : (
        <FlatList
          {...LIST_PERFORMANCE}
          data={mine.items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PersonalRow item={item} />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={refreshControl}
        />
      )}
    </SafeAreaView>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface.base },
    title: {
      fontFamily: typography.heroTitle.fontFamily,
      fontSize: 28,
      lineHeight: 34,
      color: colors.text.primary,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    loading: { flex: 1, alignItems: "center", justifyContent: "center" },
    list: {
      marginHorizontal: spacing.lg,
      marginBottom: spacing.xl,
      backgroundColor: colors.surface.primary,
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      overflow: "hidden",
    },
    separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border.subtle, marginLeft: spacing.md + 40 + spacing.sm },
  }),
);
