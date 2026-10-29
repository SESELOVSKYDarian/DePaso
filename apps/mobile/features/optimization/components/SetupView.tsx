import { Ionicons } from "@expo/vector-icons";
import type { ShoppingListSummary } from "@depaso/validation";
import { router } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { Button } from "@/components/common/Button";
import { LoadingOverlay } from "@/components/common/LoadingOverlay";
import type { TodayWaypoint } from "@/lib/routeContext/TodayRouteContext";
import { makeStyles, useColors } from "@/lib/theme";

const LOADING_STEPS = [
  "Mirando tu recorrido…",
  "Comparando precios cerca de tu camino…",
  "Sumando las promos de tus medios de pago…",
  "Buscando dónde parar para ahorrar más…",
  "Ya casi: ordenando las opciones…",
];

interface SetupViewProps {
  lists: ShoppingListSummary[];
  loadingLists: boolean;
  selectedListId: string | null;
  onSelectList: (id: string) => void;
  waypoints: TodayWaypoint[];
  error: string | null;
  running: boolean;
  canRun: boolean;
  onRun: () => void;
}

/** Antes de calcular: elegir la lista, confirmar el recorrido y pedir el Top 3. */
export function SetupView({ lists, loadingLists, selectedListId, onSelectList, waypoints, error, running, canRun, onRun }: SetupViewProps) {
  const colors = useColors();
  const styles = useStyles();
  const hasRoute = waypoints.length >= 2;

  return (
    <>
      <Text style={styles.eyebrow}>OPTIMIZAR COMPRA</Text>
      <Text style={styles.screenTitle}>Encontrá tu mejor compra</Text>
      <Text style={styles.intro}>Usamos tu recorrido, lista y preferencias para comparar precios reales sin hacerte salirte del camino.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Elegí una lista</Text>
        {loadingLists ? <ActivityIndicator color={colors.brand.navy} style={styles.loader} /> : null}
        {!loadingLists && lists.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Necesitás una lista con al menos un producto para calcular opciones.</Text>
            <Button label="Crear una lista" variant="secondary" onPress={() => router.push("/lists/form")} />
          </View>
        ) : null}
        {lists.map((list) => {
          const selected = list.id === selectedListId;
          return (
            <AnimatedPressable
              key={list.id}
              accessibilityLabel={`Usar la lista ${list.name}`}
              onPress={() => onSelectList(list.id)}
              style={[styles.choice, selected ? styles.choiceSelected : null]}
            >
              <View style={styles.choiceIcon} accessible={false}>
                <Ionicons name="list-outline" size={20} color={colors.brand.route} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.choiceName}>{list.name}</Text>
                <Text style={styles.meta}>
                  {list.itemCount} {list.itemCount === 1 ? "producto" : "productos"}
                </Text>
              </View>
              <Ionicons
                name={selected ? "radio-button-on" : "radio-button-off"}
                size={22}
                color={selected ? colors.brand.accentDark : colors.text.secondary}
                accessible={false}
              />
            </AnimatedPressable>
          );
        })}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Confirmá tu recorrido</Text>
        <AnimatedPressable accessibilityLabel="Editar recorrido de hoy" haptic={false} onPress={() => router.push("/route-context")} style={styles.choice}>
          <View style={styles.choiceIcon} accessible={false}>
            <Ionicons name="navigate-outline" size={20} color={colors.brand.route} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.choiceName}>
              {hasRoute ? `${waypoints[0]?.name ?? "Origen"} → ${waypoints[waypoints.length - 1]?.name ?? "Destino"}` : "Todavía no hay un recorrido completo"}
            </Text>
            <Text style={styles.meta}>{hasRoute ? `${waypoints.length} paradas para hoy` : "Elegí al menos origen y destino"}</Text>
          </View>
          <Ionicons name="chevron-forward" size={19} color={colors.text.secondary} accessible={false} />
        </AnimatedPressable>
      </View>

      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}

      <LoadingOverlay visible={running} title="Armando tu compra de paso" steps={LOADING_STEPS} />
      <Button label="Ver mi Top 3" loading={running} disabled={!canRun} onPress={onRun} style={styles.runButton} />
    </>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    eyebrow: { fontFamily: typography.caption.fontFamily, fontSize: 12, letterSpacing: 1, color: colors.brand.accentDark },
    screenTitle: { fontFamily: typography.heroTitle.fontFamily, fontSize: 28, lineHeight: 34, color: colors.text.primary },
    intro: { fontFamily: typography.body.fontFamily, fontSize: 15, lineHeight: 22, color: colors.text.secondary },
    section: { gap: spacing.sm, marginTop: spacing.sm },
    sectionTitle: { fontFamily: typography.itemTitle.fontFamily, fontSize: 16, color: colors.text.primary },
    loader: { marginVertical: spacing.md },
    choice: {
      minHeight: 64,
      padding: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      borderRadius: radii.lg,
      backgroundColor: colors.surface.primary,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    choiceSelected: { borderColor: colors.brand.accentDark, backgroundColor: colors.surface.secondary },
    choiceIcon: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: radii.md, backgroundColor: colors.tint.blue.bg },
    choiceName: { fontFamily: typography.itemTitle.fontFamily, fontSize: 15, color: colors.text.primary },
    meta: { fontFamily: typography.caption.fontFamily, fontSize: 12, color: colors.text.secondary },
    empty: { gap: spacing.sm, padding: spacing.md, borderRadius: radii.lg, backgroundColor: colors.surface.primary, borderWidth: 1, borderColor: colors.border.subtle },
    emptyText: { fontFamily: typography.body.fontFamily, fontSize: 14, lineHeight: 20, color: colors.text.secondary },
    error: { fontFamily: typography.body.fontFamily, fontSize: 14, color: colors.state.error },
    runButton: { marginTop: spacing.md },
  }),
);
