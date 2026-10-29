import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
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

  // solo sirven las listas con al menos un producto
  const usableLists = lists.filter((list) => !list.archivedAt && list.itemCount > 0);

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
        <ScrollView contentContainerStyle={styles.content}>
          {tab === "options" ? (
            <OptionsTab plans={optimization.plans} hasPaymentMethods={optimization.hasPaymentMethods} />
          ) : (
            <BestPricesTab bestPrices={optimization.bestPrices} ranking={optimization.ranking} />
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // sin resultados todavía: elegir lista y recorrido
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
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
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface.base },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  }),
);
