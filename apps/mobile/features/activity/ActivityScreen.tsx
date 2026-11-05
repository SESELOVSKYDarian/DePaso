import { ActivityIndicator, RefreshControl, StyleSheet, Text, View } from "react-native";
import { BackToTopFlatList } from "@/components/common/BackToTop";
import { SafeAreaView } from "react-native-safe-area-context";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { EmptyState } from "@/components/common/EmptyState";
import { ScreenFrame } from "@/components/common/ScreenFrame";
import { useBreakpoint } from "@/lib/responsive/useBreakpoint";
import { makeStyles, useColors } from "@/lib/theme";
import { ActivityTabs } from "./components/ActivityTabs";
import { AnnouncementRow } from "./components/AnnouncementRow";
import { PersonalRow } from "./components/PersonalRow";
import { useActivityFeed } from "./useActivityFeed";
import { LIST_PERFORMANCE } from "@/lib/listPerformance";

type Kind = "news" | "mine";

/**
 * Actividad. "Novedades" son los avisos que publica el equipo (actualizaciones, promos, mantenimiento);
 * "Para vos" junta lo que le pasa a esta cuenta: listas que te compartieron, productos de tus listas
 * que bajaron de precio y ofertas en comercios cerca de tus lugares. En el celular son dos pestañas;
 * en una pantalla ancha se ven las dos juntas, una al lado de la otra.
 */
export default function ActivityScreen() {
  const styles = useStyles();
  const colors = useColors();
  const { contentWidth } = useBreakpoint();
  const sideBySide = contentWidth >= 980;
  const { tab, setTab, news, mine, refreshing, refresh } = useActivityFeed(sideBySide);
  const refreshControl = <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />;

  // el contenido de una de las dos listas: cargando, con error, vacía o con sus avisos
  const content = (kind: Kind) => {
    const feed = kind === "news" ? news : mine;
    if (!feed.loaded) {
      return (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.text.secondary} />
        </View>
      );
    }
    if (feed.failed && feed.items.length === 0) {
      return <EmptyState emoji="📡" title="No pudimos cargarlo" description="Revisá tu conexión y tirá hacia abajo para reintentar." />;
    }
    if (feed.items.length === 0) {
      return kind === "news" ? (
        <EmptyState emoji="📣" title="Todavía no hay novedades" description="Cuando el equipo publique algo (mejoras, promos, avisos), lo vas a ver acá." />
      ) : (
        <EmptyState
          emoji="🔔"
          title="Por ahora no hay avisos para vos"
          description="Te avisamos cuando te compartan una lista, baje un producto de tus listas o haya algo barato cerca de tus lugares."
        />
      );
    }
    return kind === "news" ? (
      <BackToTopFlatList
        {...LIST_PERFORMANCE}
        wide
        data={news.items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AnnouncementRow item={item} />}
        contentContainerStyle={sideBySide ? styles.panelList : styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={refreshControl}
      />
    ) : (
      <BackToTopFlatList
        {...LIST_PERFORMANCE}
        wide
        data={mine.items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PersonalRow item={item} />}
        contentContainerStyle={sideBySide ? styles.panelList : styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={refreshControl}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScreenFrame wide={sideBySide}>
        <Text accessibilityRole="header" style={styles.title}>
          Actividad
        </Text>
        {sideBySide ? (
          <View style={styles.panels}>
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Para vos</Text>
              <View style={styles.panelBody}>{content("mine")}</View>
            </View>
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Novedades</Text>
              <View style={styles.panelBody}>{content("news")}</View>
            </View>
          </View>
        ) : (
          <>
            <ActivityTabs tab={tab} onChange={setTab} />
            {content(tab)}
          </>
        )}
      </ScreenFrame>
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
    // una al lado de la otra: cada lista es una tarjeta dentro de su panel
    panels: { flex: 1, flexDirection: "row", gap: spacing.lg, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
    panel: { flex: 1, minWidth: 0 },
    panelTitle: { fontFamily: typography.itemTitle.fontFamily, fontSize: 18, color: colors.text.primary, marginBottom: spacing.sm },
    panelBody: { flex: 1 },
    panelList: {
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
