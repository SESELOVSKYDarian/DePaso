import type { HomeFeedResponse } from "@depaso/validation";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { makeStyles, useColors, useTheme } from "@/lib/theme";
import { usePurchase } from "@/lib/purchase/PurchaseContext";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { Button } from "@/components/common/Button";
import { useAuth } from "@/lib/auth/AuthContext";
import { useLists } from "@/lib/lists/ListsContext";
import { useTodayRoute } from "@/lib/routeContext/TodayRouteContext";
import { homeClient } from "@/lib/apiClient";
import { useStyles } from "./styles";
import { money } from "./helpers";

/**
 * Inicio. Una sola tarjeta con la acción de siempre ("Iniciar mi recorrido") y, abajo, las
 * novedades de lo que hay en tus listas: qué subió o bajó y qué promos rigen hoy. Las listas
 * se arman en su pestaña; acá sólo se las usa.
 */
export default function HomeScreen() {
  const colors = useColors();
  const styles = useStyles();
  const { user } = useAuth();
  const { waypoints } = useTodayRoute();
  const { lists } = useLists();
  const { isDark, setMode } = useTheme();
  const { routePlan } = usePurchase();
  const [feed, setFeed] = useState<HomeFeedResponse | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      homeClient
        .feed()
        .then((result) => {
          if (active) setFeed(result);
        })
        // Las novedades son un extra: si fallan, Inicio sigue sirviendo para iniciar el recorrido.
        .catch(() => undefined);
      return () => {
        active = false;
      };
    }, []),
  );

  const firstName = user?.displayName?.split(" ")[0] ?? "";
  const listWithItems = lists.find((list) => !list.archivedAt && list.itemCount > 0);
  const hasRoute = waypoints.length >= 2;
  const routeText = hasRoute ? waypoints.map((waypoint) => waypoint.name).join(" → ") : null;

  // Lo que le falta al usuario para poder iniciar, en el orden en que se resuelve.
  const action = !listWithItems
    ? {
        label: "Armar mi lista",
        hint: "Primero sumá lo que necesitás comprar.",
        onPress: () => router.push("/lists/form"),
      }
    : !hasRoute
      ? { label: "Elegir mi recorrido", hint: "Contanos por dónde pasás hoy.", onPress: () => router.push("/route-context") }
      : routePlan
        ? { label: "Ver mi compra de paso", hint: "Ya está armada: miralo en el mapa.", onPress: () => router.push("/map") }
        : { label: "Iniciar mi recorrido", hint: "Te mostramos lo más barato según cuánto te desviás.", onPress: () => router.push("/optimization") };

  const hasNews = feed !== null && (feed.priceChanges.length > 0 || feed.promos.length > 0);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.greeting} numberOfLines={1}>
              Hola{firstName ? `, ${firstName}` : ""}
            </Text>
            <Text style={styles.question}>¿Qué te queda de paso hoy?</Text>
          </View>
          <AnimatedPressable
            accessibilityLabel={isDark ? "Pasar a modo claro" : "Pasar a modo oscuro"}
            onPress={() => setMode(isDark ? "light" : "dark")}
            style={styles.themeButton}
          >
            <Ionicons name={isDark ? "sunny-outline" : "moon-outline"} size={22} color={colors.text.primary} />
          </AnimatedPressable>
        </View>

        <View style={styles.mainCard}>
          <View style={styles.summaryRow}>
            <Ionicons name="list-outline" size={18} color={colors.text.secondary} />
            <Text style={styles.summaryText} numberOfLines={1}>
              {listWithItems ? `${listWithItems.name} · ${listWithItems.itemCount} productos` : "Todavía no tenés una lista"}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="navigate-outline" size={18} color={colors.text.secondary} />
            <Text style={styles.summaryText} numberOfLines={1}>
              {routeText ?? "Todavía no elegiste por dónde pasás"}
            </Text>
          </View>
          <Button label={action.label} onPress={action.onPress} style={styles.primaryButton} />
          <Text style={styles.hint}>{action.hint}</Text>
        </View>

        {hasNews && feed ? (
          <>
            {feed.priceChanges.length > 0 ? (
              <View style={styles.section}>
                <Text accessibilityRole="header" style={styles.sectionTitle}>
                  Cambios en tu lista
                </Text>
                <View style={styles.card}>
                  {feed.priceChanges.map((change, index) => {
                    const down = change.changePercent < 0;
                    return (
                      <View key={change.productId} style={[styles.row, index > 0 ? styles.rowDivider : null]}>
                        <Ionicons
                          name={down ? "trending-down" : "trending-up"}
                          size={22}
                          color={down ? colors.state.successStrong : colors.state.errorStrong}
                        />
                        <View style={styles.rowText}>
                          <Text style={styles.rowTitle} numberOfLines={1}>
                            {change.productName}
                          </Text>
                          <Text style={styles.rowMeta} numberOfLines={1}>
                            {down ? "Bajó" : "Subió"} en {change.storeName}: {money(change.previousPrice)} → {money(change.currentPrice)}
                          </Text>
                        </View>
                        <Text style={[styles.badge, { color: down ? colors.state.successStrong : colors.state.errorStrong }]}>
                          {down ? "" : "+"}
                          {change.changePercent.toLocaleString("es-AR")}%
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {feed.promos.length > 0 ? (
              <View style={styles.section}>
                <Text accessibilityRole="header" style={styles.sectionTitle}>
                  Ofertas de hoy
                </Text>
                <View style={styles.card}>
                  {feed.promos.map((promo, index) => (
                    <View key={promo.id} style={[styles.row, index > 0 ? styles.rowDivider : null]}>
                      <Ionicons name={promo.big ? "flame" : "pricetag-outline"} size={22} color={colors.text.primary} />
                      <View style={styles.rowText}>
                        <Text style={styles.rowTitle} numberOfLines={1}>
                          {promo.retailer}
                        </Text>
                        <Text style={styles.rowMeta} numberOfLines={1}>
                          {promo.label}
                        </Text>
                      </View>
                      {promo.mine ? <Text style={styles.mineTag}>Tuya</Text> : null}
                    </View>
                  ))}
                </View>
                <Text style={styles.footnote}>Promos informadas por la fuente: confirmá condiciones y tope en el comercio.</Text>
              </View>
            ) : null}
          </>
        ) : feed && feed.watchedProducts > 0 ? (
          <Text style={styles.footnote}>Cuando cambien los precios de lo que hay en tu lista, te lo mostramos acá.</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
