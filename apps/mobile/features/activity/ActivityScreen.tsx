import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { EmptyState } from "@/components/common/EmptyState";
import { makeStyles, useColors } from "@/lib/theme";
import { ActivityRow } from "./components/ActivityRow";
import { ActivityTabs } from "./components/ActivityTabs";
import { useActivityFeed } from "./useActivityFeed";

/**
 * Actividad. "Comunidad" muestra los precios que reportaron otras personas en los últimos días
 * (de forma anónima), para saber dónde conviene pasar antes de salir; "Mis reportes" lista los
 * que reportaste vos y en qué estado están. Todo viene de reportes reales: no hay datos de muestra.
 */
export default function ActivityScreen() {
  const styles = useStyles();
  const colors = useColors();
  const { tab, setTab, feed, refreshing, refresh } = useActivityFeed();

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
        tab === "community" ? (
          <EmptyState
            emoji="🌎"
            title="Todavía no hay reportes"
            description="Cuando alguien cuente a cuánto vio un producto, lo vas a ver acá. Podés ser el primero: en modo compra tocá “Reportar” al lado de un precio."
          />
        ) : (
          <EmptyState
            emoji="🧾"
            title="Todavía no reportaste precios"
            description="Si ves un precio distinto al de la app, contalo en modo compra. Cada aporte hace que el próximo ahorre de paso."
          />
        )
      ) : (
        <FlatList
          data={feed.items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ActivityRow item={item} scope={tab} />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />}
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
