import type { HomeFeedResponse, HomeListSummary, HomeProduct } from "@depaso/validation";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { useToast } from "@/components/common/Toast";
import { homeClient } from "@/lib/apiClient";
import { useAuth } from "@/lib/auth/AuthContext";
import { useLists } from "@/lib/lists/ListsContext";
import { usePlaces } from "@/lib/places/PlacesContext";
import { usePurchase } from "@/lib/purchase/PurchaseContext";
import { useTodayRoute } from "@/lib/routeContext/TodayRouteContext";
import { useColors, useTheme } from "@/lib/theme";
import { SavePresetForm } from "../route-context/components/SavePresetForm";
import { SavedRoutesRow } from "../route-context/components/SavedRoutesRow";
import { useSavedRoutes } from "../route-context/useSavedRoutes";
import { GuidePanel } from "./components/GuidePanel";
import { ListSummaryCard } from "./components/ListSummaryCard";
import { PriceChanges } from "./components/PriceChanges";
import { ProductStrip } from "./components/ProductStrip";
import { PromosToday } from "./components/PromosToday";
import { useStyles } from "./styles";

/**
 * Inicio. Al principio muestra una guía de 3 pasos (armar la lista, elegir el recorrido, ver
 * dónde comprar). Cuando ya hay lista y recorrido pasa a ser un tablero: la lista, cuánto
 * saldría, y las novedades. En los dos casos hay productos baratos y recomendados, para que
 * nunca quede vacío.
 */
export default function HomeScreen() {
  const colors = useColors();
  const styles = useStyles();
  const { user } = useAuth();
  const { waypoints, setWaypoints } = useTodayRoute();
  const { places } = usePlaces();
  const { lists, addItem } = useLists();
  const { isDark, setMode } = useTheme();
  const { routePlan } = usePurchase();
  const { show: showToast } = useToast();
  const [feed, setFeed] = useState<HomeFeedResponse | null>(null);
  // rutas guardadas con nombre: se usan de un toque o se guarda la de hoy desde acá
  const saved = useSavedRoutes(waypoints, setWaypoints, places, showToast);

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
  const activeLists = lists.filter((list) => !list.archivedAt);
  const listWithItems = activeLists.find((list) => list.itemCount > 0);
  const hasRoute = waypoints.length >= 2;

  // Lo que le falta al usuario para poder iniciar, en el orden en que se resuelve.
  const action = routePlan
    ? { label: "Ver mi compra de paso", hint: "Ya está armada: miralo en el mapa.", onPress: () => router.push("/map") }
    : { label: "Iniciar mi recorrido", hint: "Te mostramos lo más barato según cuánto te desviás.", onPress: () => router.push("/optimization") };

  // Mientras llega el resumen del servidor se usa lo que ya se sabe de la lista.
  const listSummary: HomeListSummary | null = listWithItems
    ? (feed?.listSummary ?? { id: listWithItems.id, name: listWithItems.name, itemCount: listWithItems.itemCount, previewItems: [], cheapestTotal: null, pricedItems: 0 })
    : null;

  // Suma un producto sugerido a la lista activa; si todavía no hay ninguna, lleva a crearla.
  const addSuggested = async (product: HomeProduct) => {
    const target = listWithItems ?? activeLists[0];
    if (!target) {
      showToast("Primero armá una lista y después sumamos los productos.", "info");
      router.push("/lists/form");
      return;
    }
    try {
      await addItem(target.id, { productId: product.productId, quantity: 1 });
      showToast(`Sumamos "${product.name}" a ${target.name}.`, "success");
    } catch {
      showToast("No pudimos sumarlo. Probá de nuevo.", "error");
    }
  };

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

        {listSummary && hasRoute ? (
          <ListSummaryCard
            list={listSummary}
            routeNames={waypoints.map((waypoint) => waypoint.name)}
            actionLabel={action.label}
            actionHint={action.hint}
            onAction={action.onPress}
          />
        ) : (
          <GuidePanel hasList={Boolean(listSummary)} hasRoute={hasRoute} hasPlan={Boolean(routePlan)} />
        )}

        <SavedRoutesRow presets={saved.presets} onApply={saved.apply} onDelete={(preset) => void saved.remove(preset)} />
        <SavePresetForm
          stopCount={waypoints.length}
          name={saved.savingName}
          isSaving={saved.isSaving}
          onOpen={() => saved.setSavingName("")}
          onChangeName={saved.setSavingName}
          onCancel={() => saved.setSavingName(null)}
          onSave={() => void saved.save()}
        />

        <ProductStrip
          title="Barato hoy"
          subtitle="Productos con el precio más bajo comparado con el resto."
          products={feed ? feed.cheapToday : null}
          showSaving
          onAdd={(product) => void addSuggested(product)}
        />
        <PriceChanges changes={feed?.priceChanges ?? []} />
        <PromosToday promos={feed?.promos ?? []} />
        <ProductStrip
          title="Recomendados"
          subtitle="Lo que más se busca, con su mejor precio."
          products={feed ? feed.popular : null}
          onAdd={(product) => void addSuggested(product)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
