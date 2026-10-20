import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Fragment } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, useReducedMotion } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { makeStyles, useColors } from "@/lib/theme";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Button } from "@/components/Button";
import { useAuth } from "@/lib/auth/AuthContext";
import { useLists } from "@/lib/lists/ListsContext";
import { useTodayRoute } from "@/lib/routeContext/TodayRouteContext";

/** Entrada sutil y escalonada (MOTION-SYSTEM.md) - respeta Reduce Motion. */
function useEntering(index: number) {
  const reducedMotion = useReducedMotion();
  return reducedMotion ? undefined : FadeInDown.delay(index * 70).duration(240);
}

/**
 * Inicio. Una sola cosa por vez: arriba el saludo, en el medio la acción principal (armar el
 * recorrido o buscar la mejor compra) y abajo las listas. Nada más compite por la atención;
 * medios de pago, promos y el resto viven en Perfil.
 */
export default function HomeScreen() {
  const colors = useColors();
  const styles = useStyles();
  const { user } = useAuth();
  const { waypoints } = useTodayRoute();
  const { lists } = useLists();

  const firstName = user?.displayName?.split(" ")[0] ?? "";
  const activeLists = lists.filter((list) => !list.archivedAt).slice(0, 3);
  const hasRoute = waypoints.length >= 2;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={useEntering(0)} style={styles.header}>
          <Text accessibilityRole="header" style={styles.greeting} numberOfLines={1}>
            Hola{firstName ? `, ${firstName}` : ""}
          </Text>
          <Text style={styles.question}>¿Qué te queda de paso hoy?</Text>
        </Animated.View>

        <Animated.View entering={useEntering(1)} style={styles.mainCard}>
          {hasRoute ? (
            <>
              <Text style={styles.cardLabel}>Tu recorrido de hoy</Text>
              <Text style={styles.routeText} numberOfLines={2}>
                {waypoints.map((waypoint) => waypoint.name).join("  →  ")}
              </Text>
              <Button
                label="Encontrar mi mejor compra"
                onPress={() => router.push("/optimization")}
                style={styles.primaryButton}
              />
              <Button
                label="Cambiar recorrido"
                variant="ghost"
                onPress={() => router.push("/route-context")}
              />
            </>
          ) : (
            <>
              <Text style={styles.cardTitle}>¿Por dónde pasás hoy?</Text>
              <Text style={styles.cardBody}>Contanos tu recorrido y buscamos dónde conviene comprar.</Text>
              <Button
                label="Armar mi recorrido"
                onPress={() => router.push("/route-context")}
                style={styles.primaryButton}
              />
            </>
          )}
        </Animated.View>

        <Animated.View entering={useEntering(2)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              Tus listas
            </Text>
            {activeLists.length > 0 ? (
              <AnimatedPressable
                accessibilityLabel="Ver todas tus listas"
                haptic={false}
                onPress={() => router.push("/lists")}
                style={styles.sectionLinkHit}
              >
                <Text style={styles.sectionLink}>Ver todas</Text>
              </AnimatedPressable>
            ) : null}
          </View>

          {activeLists.length === 0 ? (
            <AnimatedPressable
              accessibilityLabel="Crear tu primera lista"
              haptic={false}
              onPress={() => router.push("/lists/form")}
              style={styles.emptyList}
            >
              <Ionicons name="add" size={22} color={colors.text.primary} />
              <Text style={styles.emptyListLabel}>Crear mi primera lista</Text>
            </AnimatedPressable>
          ) : (
            <View style={styles.listCard}>
              {activeLists.map((list, index) => (
                <Fragment key={list.id}>
                  {index > 0 ? <View style={styles.listDivider} /> : null}
                  <AnimatedPressable
                    accessibilityLabel={`Abrir la lista ${list.name}`}
                    haptic={false}
                    onPress={() => router.push({ pathname: "/lists/[id]", params: { id: list.id } })}
                    style={styles.listRow}
                  >
                    <View style={styles.listRowText}>
                      <Text style={styles.listRowName} numberOfLines={1}>
                        {list.name}
                      </Text>
                      <Text style={styles.listRowMeta} numberOfLines={1}>
                        {list.itemCount} {list.itemCount === 1 ? "producto" : "productos"}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
                  </AnimatedPressable>
                </Fragment>
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface.base,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xxl,
      gap: spacing.xl,
    },
    header: {
      gap: spacing.xxs,
    },
    greeting: {
      fontFamily: typography.heroTitle.fontFamily,
      fontSize: 32,
      lineHeight: 38,
      color: colors.text.primary,
    },
    question: {
      fontFamily: typography.subtitle.fontFamily,
      fontSize: 16,
      lineHeight: 22,
      color: colors.text.secondary,
    },
    mainCard: {
      backgroundColor: colors.surface.primary,
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    cardLabel: {
      fontFamily: typography.caption.fontFamily,
      fontSize: 13,
      color: colors.text.secondary,
    },
    cardTitle: {
      fontFamily: typography.heroTitle.fontFamily,
      fontSize: 22,
      lineHeight: 28,
      color: colors.text.primary,
    },
    cardBody: {
      fontFamily: typography.subtitle.fontFamily,
      fontSize: 15,
      lineHeight: 22,
      color: colors.text.secondary,
    },
    routeText: {
      fontFamily: typography.itemTitle.fontFamily,
      fontSize: 18,
      lineHeight: 26,
      color: colors.text.primary,
    },
    primaryButton: {
      borderRadius: radii.full,
      marginTop: spacing.sm,
    },
    section: {
      gap: spacing.sm,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    sectionTitle: {
      fontFamily: typography.itemTitle.fontFamily,
      fontSize: 20,
      lineHeight: 26,
      color: colors.text.primary,
    },
    sectionLinkHit: {
      minHeight: 44,
      justifyContent: "center",
    },
    sectionLink: {
      fontFamily: typography.body.fontFamily,
      fontSize: 15,
      color: colors.text.secondary,
    },
    listCard: {
      backgroundColor: colors.surface.primary,
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      overflow: "hidden",
    },
    listDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border.subtle,
      marginHorizontal: spacing.lg,
    },
    listRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      minHeight: 64,
    },
    listRowText: {
      flex: 1,
      gap: 2,
    },
    listRowName: {
      fontFamily: typography.itemTitle.fontFamily,
      fontSize: 16,
      lineHeight: 22,
      color: colors.text.primary,
    },
    listRowMeta: {
      fontFamily: typography.subtitle.fontFamily,
      fontSize: 14,
      color: colors.text.secondary,
    },
    emptyList: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      minHeight: 64,
      paddingHorizontal: spacing.lg,
      borderRadius: radii.xl,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: colors.border.strong,
    },
    emptyListLabel: {
      fontFamily: typography.body.fontFamily,
      fontSize: 16,
      color: colors.text.primary,
    },
  }),
);
