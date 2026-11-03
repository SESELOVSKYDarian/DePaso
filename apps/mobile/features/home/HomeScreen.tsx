import type { HomeFeedResponse, HomeListSummary, HomeProduct } from "@depaso/validation";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { BackToTopScrollView } from "@/components/common/BackToTop";
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
import { findMatchingPreset } from "@/lib/routeContext/routeMatches";
import { SavePresetForm } from "../route-context/components/SavePresetForm";
import { SavedRoutesRow } from "../route-context/components/SavedRoutesRow";
import { useSavedRoutes } from "../route-context/useSavedRoutes";
import { DeleteRouteDialog } from "../route-context/components/DeleteRouteDialog";
import { AddToListSheet } from "./components/AddToListSheet";
import { StartRouteCard } from "./components/StartRouteCard";
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
  // producto sugerido que se está por sumar (elige lista y cantidad) y si se está guardando
  const [pending, setPending] = useState<HomeProduct | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  // rutas guardadas con nombre: se usan de un toque o se guarda la de hoy desde acá
  const saved = useSavedRoutes(waypoints, setWaypoints, places, showToast);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      homeClient
        .feed()
        .then((result) => {
          if (active) setFeed(result);
          // las fotos de las tiras se bajan de antemano: al llegar a la tira ya están
          const photos = [...result.cheapToday, ...result.popular].flatMap((product) => (product.imageUrl ? [product.imageUrl] : []));
          if (photos.length > 0) void Image.prefetch(photos, "memory-disk");
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
    : {
        label: "Iniciar mi recorrido",
        hint: hasRoute ? "Te mostramos lo más barato según cuánto te desviás." : "Contanos por dónde andás hoy y te armamos la compra de paso.",
        // sin recorrido, el botón lleva a elegirlo; con recorrido, a calcular dónde comprar
        onPress: () => router.push(hasRoute ? "/optimization" : "/route-context"),
      };

  // Mientras llega el resumen del servidor se usa lo que ya se sabe de la lista.
  const listSummary: HomeListSummary | null = listWithItems
    ? (feed?.listSummary ?? { id: listWithItems.id, name: listWithItems.name, itemCount: listWithItems.itemCount, previewItems: [], cheapestTotal: null, pricedItems: 0 })
    : null;

  // Sin ninguna lista se lleva a crearla; con una o más, se abre la hoja para elegir lista y cantidad.
  const addSuggested = (product: HomeProduct) => {
    if (activeLists.length === 0) {
      showToast("Primero armá una lista y después sumamos los productos.", "info");
      router.push("/lists/form");
      return;
    }
    setPending(product);
  };

  const confirmAdd = async (listId: string, quantity: number) => {
    if (!pending) return;
    const target = activeLists.find((list) => list.id === listId);
    setIsAdding(true);
    try {
      await addItem(listId, { productId: pending.productId, quantity });
      showToast(`Sumamos ${quantity > 1 ? `${quantity} × ` : ""}"${pending.name}" a ${target?.name ?? "tu lista"}.`, "success");
      setPending(null);
    } catch {
      showToast("No pudimos sumarlo. Probá de nuevo.", "error");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <BackToTopScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
          <StartRouteCard
            routeNames={waypoints.map((waypoint) => waypoint.name)}
            label={action.label}
            hint={action.hint}
            onPress={action.onPress}
          />
        )}

        <SavedRoutesRow presets={saved.presets} onApply={saved.apply} onDelete={saved.requestRemove} />
        <SavePresetForm
          stopCount={waypoints.length}
          savedName={findMatchingPreset(saved.presets, waypoints)?.name ?? null}
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
          onAdd={addSuggested}
        />
        <PriceChanges changes={feed?.priceChanges ?? []} />
        <PromosToday promos={feed?.promos ?? []} />
        <ProductStrip
          title="Recomendados"
          subtitle="Lo que más se busca, con su mejor precio."
          products={feed ? feed.popular : null}
          onAdd={addSuggested}
        />
      </BackToTopScrollView>

      <DeleteRouteDialog route={saved.toDelete} onConfirm={() => void saved.confirmRemove()} onCancel={saved.cancelRemove} />
      <AddToListSheet
        product={pending}
        lists={activeLists}
        defaultListId={listWithItems?.id ?? activeLists[0]?.id ?? null}
        isSaving={isAdding}
        onConfirm={(listId, quantity) => void confirmAdd(listId, quantity)}
        onClose={() => setPending(null)}
      />
    </SafeAreaView>
  );
}
