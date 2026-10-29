import { Ionicons } from "@expo/vector-icons";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { Button } from "@/components/common/Button";
import { useToast } from "@/components/common/Toast";
import { usePlaces } from "@/lib/places/PlacesContext";
import { useTodayRoute } from "@/lib/routeContext/TodayRouteContext";
import { makeStyles, useColors } from "@/lib/theme";
import { presetToWaypoints } from "../route-context/presetToWaypoints";
import { useSavedRoutes } from "../route-context/useSavedRoutes";
import { AddDestinationSection } from "./components/AddDestinationSection";
import { RouteChoiceCard } from "./components/RouteChoiceCard";
import { findMatchingPreset } from "@/lib/routeContext/routeMatches";

/** Clave de la tarjeta "Tu recorrido de hoy" (la que todavía no se guardó con nombre). */
const TODAY_KEY = "today";

/**
 * "Elegí tu recorrido": el caso de todos los días. Se elige una ruta guardada (o la de hoy) y se
 * sale en un toque. Para crear o cambiar paradas está "Armar ruta".
 */
export default function ChooseRouteScreen() {
  const colors = useColors();
  const styles = useStyles();
  const { places } = usePlaces();
  const { waypoints, setWaypoints } = useTodayRoute();
  const { show: showToast } = useToast();
  const saved = useSavedRoutes(waypoints, setWaypoints, places, showToast);
  const [selected, setSelected] = useState<string | null>(null);

  const matching = findMatchingPreset(saved.presets, waypoints);
  const hasUnsavedToday = waypoints.length > 0 && !matching;

  // al abrir, queda marcada la ruta que ya es la de hoy
  useEffect(() => {
    if (selected !== null) return;
    if (matching) setSelected(matching.id);
    else if (hasUnsavedToday) setSelected(TODAY_KEY);
  }, [selected, matching, hasUnsavedToday]);

  /** Deja la ruta elegida como recorrido de hoy y devuelve si hubo algo que elegir. */
  const commitSelection = (): boolean => {
    if (selected === null) return false;
    if (selected !== TODAY_KEY) {
      const preset = saved.presets.find((candidate) => candidate.id === selected);
      if (!preset) return false;
      setWaypoints(presetToWaypoints(preset, places));
    }
    return true;
  };

  const viewOnMap = () => {
    if (commitSelection()) router.replace("/map");
  };
  const start = () => {
    if (commitSelection()) router.replace("/optimization");
  };

  const canGo = selected !== null;
  const noRoutes = saved.presets.length === 0 && !hasUnsavedToday;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.navHeader}>
        <AnimatedPressable accessibilityLabel="Volver" haptic={false} onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </AnimatedPressable>
        <Text accessibilityRole="header" style={styles.navTitle}>
          Elegí tu recorrido
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AnimatedPressable
          accessibilityLabel="Armar una ruta desde mi ubicación actual"
          haptic={false}
          onPress={() => router.push({ pathname: "/route-builder", params: { withLocation: "1" } })}
          style={styles.locationRow}
        >
          <Ionicons name="locate-outline" size={20} color={colors.brand.route} />
          <Text style={styles.locationText}>Usar mi ubicación actual</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
        </AnimatedPressable>

        {hasUnsavedToday ? (
          <RouteChoiceCard
            name="Tu recorrido de hoy"
            stopNames={waypoints.map((waypoint) => waypoint.name)}
            emoji="📍"
            selected={selected === TODAY_KEY}
            onSelect={() => setSelected(TODAY_KEY)}
          />
        ) : null}

        {saved.presets.map((preset) => (
          <RouteChoiceCard
            key={preset.id}
            name={preset.name}
            stopNames={(preset.stops ?? []).map((stop) => stop.name)}
            emoji={preset.stops?.[0]?.emoji ?? "📍"}
            selected={selected === preset.id}
            onSelect={() => setSelected(preset.id)}
            onDelete={() => {
              if (selected === preset.id) setSelected(null);
              void saved.remove(preset);
            }}
          />
        ))}

        {noRoutes ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Todavía no tenés rutas guardadas</Text>
            <Text style={styles.emptyText}>Armá una con tus paradas del día y la guardás para usarla cuando quieras.</Text>
          </View>
        ) : null}

        <Button label="Armar una ruta nueva" variant="secondary" onPress={() => router.push("/route-builder")} />
        <AddDestinationSection places={places} />
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Ver en el mapa" variant="secondary" onPress={viewOnMap} disabled={!canGo} style={styles.footerButton} />
        <Button label="Iniciar recorrido" onPress={start} disabled={!canGo} style={styles.footerButton} />
      </View>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface.base },
    navHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
    backButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
    navTitle: { fontFamily: typography.screenTitle.fontFamily, fontSize: 22, color: colors.text.primary },
    content: { padding: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xl, gap: spacing.md },
    locationRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      minHeight: 52,
      paddingHorizontal: spacing.md,
      borderRadius: radii.lg,
      backgroundColor: colors.surface.primary,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    locationText: { flex: 1, fontFamily: typography.itemTitle.fontFamily, fontSize: 15, color: colors.text.primary },
    empty: { gap: spacing.xs, padding: spacing.md },
    emptyTitle: { fontFamily: typography.itemTitle.fontFamily, fontSize: 16, color: colors.text.primary },
    emptyText: { fontFamily: typography.body.fontFamily, fontSize: 14, color: colors.text.secondary },
    footer: {
      flexDirection: "row",
      gap: spacing.sm,
      padding: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border.subtle,
      backgroundColor: colors.surface.base,
    },
    footerButton: { flex: 1 },
  }),
);
