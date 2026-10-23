import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Fragment } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { makeStyles, useColors, useTheme } from "@/lib/theme";
import { usePurchase } from "@/lib/purchase/PurchaseContext";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Button } from "@/components/Button";
import { useAuth } from "@/lib/auth/AuthContext";
import { useLists } from "@/lib/lists/ListsContext";
import { useTodayRoute } from "@/lib/routeContext/TodayRouteContext";

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
  const { isDark, setMode } = useTheme();
  const { routePlan } = usePurchase();

  const firstName = user?.displayName?.split(" ")[0] ?? "";
  const activeLists = lists.filter((list) => !list.archivedAt).slice(0, 3);
  const hasRoute = waypoints.length >= 2;
  const listWithItems = lists.find((list) => !list.archivedAt && list.itemCount > 0);

  // Los tres pasos de la app, en orden. El próximo pendiente es la acción principal.
  const steps = [
    {
      key: "list",
      title: "Armá tu lista",
      done: Boolean(listWithItems),
      detail: listWithItems ? `${listWithItems.name}: ${listWithItems.itemCount} productos` : "Escribila, dictala o buscá por categoría.",
      icon: "list-outline" as const,
      onPress: () =>
        listWithItems
          ? router.push({ pathname: "/lists/[id]", params: { id: listWithItems.id } })
          : router.push("/lists/form"),
    },
    {
      key: "route",
      title: "Contanos por dónde pasás",
      done: hasRoute,
      detail: hasRoute ? waypoints.map((waypoint) => waypoint.name).join(" → ") : "De dónde salís, tus paradas y a dónde vas.",
      icon: "navigate-outline" as const,
      onPress: () => router.push("/route-context"),
    },
    {
      key: "buy",
      title: "Comprá de paso",
      done: routePlan !== null,
      detail: routePlan ? "Ya tenés tu compra armada: miralo en el mapa." : "Te mostramos lo más barato según cuánto te desviás.",
      icon: "cart-outline" as const,
      onPress: () => (routePlan ? router.push("/map") : router.push("/optimization")),
    },
  ];
  const nextStep = steps.find((step) => !step.done) ?? steps[2]!;

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
          <Text style={styles.cardLabel}>Así se usa DePaso</Text>
          {steps.map((step, index) => (
            <AnimatedPressable
              key={step.key}
              accessibilityLabel={`Paso ${index + 1}: ${step.title}. ${step.done ? "Listo" : "Pendiente"}. ${step.detail}`}
              haptic={false}
              onPress={step.onPress}
              style={[styles.stepRow, step.key === nextStep.key && !step.done ? styles.stepRowNext : null]}
            >
              <View style={[styles.stepBadge, step.done ? styles.stepBadgeDone : null]}>
                {step.done ? (
                  <Ionicons name="checkmark" size={18} color={colors.text.onNavy} />
                ) : (
                  <Text style={styles.stepNumber}>{index + 1}</Text>
                )}
              </View>
              <View style={styles.stepText}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDetail} numberOfLines={2}>
                  {step.detail}
                </Text>
              </View>
              <Ionicons name={step.icon} size={20} color={colors.text.secondary} />
            </AnimatedPressable>
          ))}
          <Button
            label={nextStep.done ? "Ver mi compra de paso" : nextStep.key === "buy" ? "Encontrar mi mejor compra" : nextStep.title}
            onPress={nextStep.onPress}
            style={styles.primaryButton}
          />
        </View>

        <View style={styles.section}>
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
        </View>
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
    headerRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    themeButton: {
      width: 48,
      height: 48,
      borderRadius: radii.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface.primary,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    stepRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      minHeight: 64,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.xs,
      borderRadius: radii.lg,
    },
    stepRowNext: {
      backgroundColor: colors.surface.input,
    },
    stepBadge: {
      width: 32,
      height: 32,
      borderRadius: radii.full,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: colors.text.primary,
    },
    stepBadgeDone: {
      backgroundColor: colors.brand.navy,
      borderColor: colors.brand.navy,
    },
    stepNumber: { fontFamily: typography.itemTitle.fontFamily, fontSize: 15, color: colors.text.primary },
    stepText: { flex: 1, gap: 2 },
    stepTitle: { fontFamily: typography.itemTitle.fontFamily, fontSize: 16, color: colors.text.primary },
    stepDetail: { fontFamily: typography.caption.fontFamily, fontSize: 13, lineHeight: 18, color: colors.text.secondary },
    content: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xxl,
      gap: spacing.xl,
    },
    header: {
      flex: 1,
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
