import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { BackToTopScrollView } from "@/components/common/BackToTop";
import { SafeAreaView } from "react-native-safe-area-context";
import { spacing } from "@depaso/design-tokens";
import { useLists } from "@/lib/lists/ListsContext";
import { useTodayRoute } from "@/lib/routeContext/TodayRouteContext";
import { makeStyles } from "@/lib/theme";
import { BestPricesTab } from "./components/BestPricesTab";
import { OptionsTab } from "./components/OptionsTab";
import { ResultsHeader, type ResultsTab } from "./components/ResultsHeader";
import { SetupView } from "./components/SetupView";
import { useOptimizationRun } from "./useOptimizationRun";

/**
 * Optimizar compra: primero se elige la lista y se confirma el recorrido; después se muestran las
 * tres opciones de compra y, en otra pestaña, dónde está más barato cada producto.
 */
export default function OptimizationScreen() {
  const styles = useStyles();
  const { lists, isLoading: loadingLists } = useLists();
  const { waypoints } = useTodayRoute();
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [tab, setTab] = useState<ResultsTab>("options");
  const optimization = useOptimizationRun(selectedListId);
  const { listId: requestedListId } = useLocalSearchParams<{ listId?: string }>();

  // solo sirven las listas con al menos un producto
  const usableLists = lists.filter((list) => !list.archivedAt && list.itemCount > 0);

  // la lista ya viene elegida: la que se pidió desde el detalle o, si no, la primera
  useEffect(() => {
    if (selectedListId || usableLists.length === 0) return;
    const asked = usableLists.find((list) => list.id === requestedListId);
    setSelectedListId((asked ?? usableLists[0])!.id);
  }, [selectedListId, usableLists, requestedListId]);

  // con resultados: cabecera con pestañas y el contenido de la pestaña elegida
  if (optimization.plans) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ResultsHeader
          tab={tab}
          onChangeTab={setTab}
          onReset={() => {
            optimization.reset();
            setTab("options");
          }}
        />
        <BackToTopScrollView contentContainerStyle={styles.content}>
          {tab === "options" ? (
            <OptionsTab plans={optimization.plans} hasPaymentMethods={optimization.hasPaymentMethods} />
          ) : (
            <BestPricesTab bestPrices={optimization.bestPrices} ranking={optimization.ranking} />
          )}
        </BackToTopScrollView>
      </SafeAreaView>
    );
  }

  // sin resultados todavía: elegir lista y recorrido
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Volver" hitSlop={12} onPress={() => router.back()} style={styles.back}>
        <Ionicons name="arrow-back" size={24} color="#9aa1b0" />
      </Pressable>
      <BackToTopScrollView contentContainerStyle={styles.content}>
        <SetupView
          lists={usableLists}
          loadingLists={loadingLists}
          selectedListId={selectedListId}
          onSelectList={setSelectedListId}
          waypoints={waypoints}
          error={optimization.error}
          running={optimization.running}
          canRun={optimization.canRun}
          onRun={() => void optimization.run()}
        />
      </BackToTopScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface.base },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
    back: { alignSelf: "flex-start", paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  }),
);
