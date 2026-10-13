import { Ionicons } from "@expo/vector-icons";
import type { CommunityFeedItem, CommunityFeedScope } from "@depaso/validation";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { EmptyState } from "@/components/EmptyState";
import { communityClient } from "@/lib/apiClient";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { makeStyles, useColors } from "@/lib/theme";

type FeedState = { items: CommunityFeedItem[]; loaded: boolean; failed: boolean };
const EMPTY: FeedState = { items: [], loaded: false, failed: false };

function formatPrice(value: number): string {
  return `$${Math.round(value).toLocaleString("es-AR")}`;
}

/**
 * Actividad. "Tu actividad" lista los precios que reportaste y en qué estado están;
 * "Comunidad" muestra los precios que reportaron otras personas en los últimos días (de
 * forma anónima), para saber dónde conviene pasar antes de salir. Todo viene de los
 * reportes reales: no hay datos de muestra.
 */
export default function ActivityScreen() {
  const styles = useStyles();
  const colors = useColors();
  const [tab, setTab] = useState<CommunityFeedScope>("community");
  const [feeds, setFeeds] = useState<Record<CommunityFeedScope, FeedState>>({ community: EMPTY, mine: EMPTY });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (scope: CommunityFeedScope) => {
    try {
      const { items } = await communityClient.feed(scope);
      setFeeds((current) => ({ ...current, [scope]: { items, loaded: true, failed: false } }));
    } catch {
      setFeeds((current) => ({ ...current, [scope]: { ...current[scope], loaded: true, failed: true } }));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load(tab);
    }, [load, tab]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await load(tab);
    setRefreshing(false);
  };

  const feed = feeds[tab];

  const renderItem = ({ item }: { item: CommunityFeedItem }) => (
    <View style={styles.row}>
      <View style={styles.priceBadge}>
        <Ionicons name="pricetag" size={16} color={colors.text.primary} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.product} numberOfLines={2}>
          {item.productName}
          {item.sizeLabel ? ` · ${item.sizeLabel}` : ""}
        </Text>
        <Text style={styles.store} numberOfLines={1}>
          {item.storeName} · {item.branchName}
        </Text>
        <Text style={styles.meta} numberOfLines={2}>
          {item.isMine && tab === "community" ? "Vos · " : ""}
          {formatRelativeTime(item.createdAt)}
          {item.requiresPromotion ? ` · Con promo${item.promotionNote ? `: ${item.promotionNote}` : ""}` : ""}
          {item.status === "HIDDEN" ? " · En revisión" : ""}
        </Text>
      </View>
      <Text style={styles.price}>{formatPrice(item.reportedPrice)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text accessibilityRole="header" style={styles.title}>
        Actividad
      </Text>

      <View style={styles.tabs}>
        {(
          [
            { id: "community", label: "Comunidad" },
            { id: "mine", label: "Tu actividad" },
          ] as const
        ).map((option) => (
          <AnimatedPressable
            key={option.id}
            accessibilityLabel={option.label}
            haptic={false}
            onPress={() => setTab(option.id)}
            style={[styles.tabButton, tab === option.id ? styles.tabButtonActive : null]}
          >
            <Text style={[styles.tabLabel, tab === option.id ? styles.tabLabelActive : null]}>{option.label}</Text>
          </AnimatedPressable>
        ))}
      </View>

      {!feed.loaded ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.text.secondary} />
        </View>
      ) : feed.failed && feed.items.length === 0 ? (
        <EmptyState
          emoji="📡"
          title="No pudimos cargarlo"
          description="Revisá tu conexión y tirá hacia abajo para reintentar."
        />
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
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} />}
        />
      )}
    </SafeAreaView>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface.base,
    },
    title: {
      fontFamily: typography.heroTitle.fontFamily,
      fontSize: 28,
      lineHeight: 34,
      color: colors.text.primary,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    tabs: {
      flexDirection: "row",
      marginHorizontal: spacing.lg,
      marginVertical: spacing.md,
      backgroundColor: colors.surface.input,
      borderRadius: radii.full,
      padding: 3,
    },
    tabButton: {
      flex: 1,
      minHeight: 40,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radii.full,
    },
    tabButtonActive: {
      backgroundColor: colors.surface.primary,
    },
    tabLabel: {
      fontFamily: typography.body.fontFamily,
      fontSize: 14,
      color: colors.text.secondary,
    },
    tabLabelActive: {
      color: colors.text.primary,
      fontWeight: "600",
    },
    loading: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    list: {
      marginHorizontal: spacing.lg,
      marginBottom: spacing.xl,
      backgroundColor: colors.surface.primary,
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      overflow: "hidden",
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border.subtle,
      marginLeft: spacing.md + 40 + spacing.sm,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      padding: spacing.md,
    },
    priceBadge: {
      width: 40,
      height: 40,
      borderRadius: radii.full,
      backgroundColor: colors.surface.input,
      alignItems: "center",
      justifyContent: "center",
    },
    rowText: { flex: 1, gap: 1 },
    product: {
      fontFamily: typography.itemTitle.fontFamily,
      fontSize: 15,
      lineHeight: 20,
      color: colors.text.primary,
    },
    store: {
      fontFamily: typography.subtitle.fontFamily,
      fontSize: 13,
      color: colors.text.secondary,
    },
    meta: {
      fontFamily: typography.caption.fontFamily,
      fontSize: 12,
      color: colors.text.tertiary,
    },
    price: {
      fontFamily: typography.itemTitle.fontFamily,
      fontSize: 16,
      color: colors.text.primary,
    },
  }),
);
