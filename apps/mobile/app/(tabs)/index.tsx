import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { Fragment, useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Illustration } from "@/components/Illustration";
import Animated, { FadeInDown, useReducedMotion } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { makeStyles, useColors } from "@/lib/theme";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { paymentsClient } from "@/lib/apiClient";
import { useAuth } from "@/lib/auth/AuthContext";
import { useLists } from "@/lib/lists/ListsContext";
import { useTodayRoute } from "@/lib/routeContext/TodayRouteContext";

/** Stagger sutil de entrada (MOTION-SYSTEM.md, "Entrada de Home") — respeta Reduce Motion. */
function useEntering(index: number) {
  const reducedMotion = useReducedMotion();
  return reducedMotion ? undefined : FadeInDown.delay(index * 70).duration(240);
}

/**
 * Home (depaso-inicio en Figma, sección 73 del master prompt): no es un catálogo, arranca
 * en "¿Qué vamos a hacer hoy?" y prioriza acción. El banner de ahorro de Figma mostraba un
 * monto fijo ("Hoy podés ahorrar hasta $3.250") — acá se deja el mismo look (tarjeta verde
 * con ícono + chevron) pero sin un número inventado, porque hasta no correr una
 * optimización real no hay un ahorro real que mostrar (sección "no mostrar ahorros
 * inventados", confirmado por el propio flujo de prueba de usuario).
 *
 * Catálogo/precios reales (Fase 8/12, SEPA) y Listas (Fase 9) ya están conectados — lo que
 * falta es la UI del Top 3 (Fase 16: elegir lista, llamar a `/api/optimize`, revelar los 3
 * planes con el "por qué") y el mapa/modo compra que vienen después (Fase 17/18). Por eso
 * el botón sigue avisando en vez de fingir un resultado — encontrado real probando el
 * flujo completo de usuario (35 pasos, "Encontrar mi mejor compra" en Home).
 */
export default function HomeScreen() {
  const colors = useColors();
  const styles = useStyles();
  const { user, isAuthenticated } = useAuth();
  const { waypoints } = useTodayRoute();
  const { lists } = useLists();
  // `null` = todavía no se sabe; evita mostrar el aviso de medios de pago antes de consultarlo.
  const [paymentMethodCount, setPaymentMethodCount] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) return;
      paymentsClient
        .getMethods()
        .then(({ methods }) => setPaymentMethodCount(methods.length))
        .catch(() => setPaymentMethodCount(null));
    }, [isAuthenticated])
  );

  const firstName = user?.displayName?.split(" ")[0] ?? "";
  const activeLists = lists.filter((list) => !list.archivedAt).slice(0, 3);

  const handleFindBestPurchase = () => {
    if (waypoints.length < 2) {
      router.push("/route-context");
      return;
    }
    router.push("/optimization");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View entering={useEntering(0)} style={styles.headerRow}>
          <Text accessibilityRole="header" style={styles.greeting} numberOfLines={1}>
            ¡Hola{firstName ? `, ${firstName}` : ""}! 👋
          </Text>
          <Text style={styles.question}>¿Qué te queda de paso hoy?</Text>
        </Animated.View>

        <Animated.View entering={useEntering(1)}>
          <AnimatedPressable
            accessibilityLabel="Elegir por dónde vas a andar hoy"
            haptic={false}
            onPress={() => router.push("/route-context")}
            style={styles.routeCard}
          >
            <View style={styles.routeCardHeader}>
              <Text style={styles.routeCardTitle}>Por dónde pasás hoy</Text>
              <Text style={styles.editLink}>Editar</Text>
            </View>
            {waypoints.length === 0 ? (
              <Text style={styles.routeEmptyLabel}>+ Contanos por dónde andás hoy</Text>
            ) : (
              <>
                <View style={styles.chipsRow}>
                  {waypoints.map((w, i) => (
                    <Fragment key={w.key}>
                      {i > 0 ? (
                        <View style={styles.chipArrowWrap}>
                          <Ionicons name="arrow-forward" size={14} color={colors.text.secondary} />
                        </View>
                      ) : null}
                      <View style={styles.pinBadge}>
                        <Text style={styles.pinEmoji}>{w.emoji}</Text>
                      </View>
                      <Text style={styles.chipLabel} numberOfLines={1}>
                        {w.name}
                      </Text>
                    </Fragment>
                  ))}
                </View>
                <Text style={styles.routeMeta}>
                  {waypoints.length} {waypoints.length === 1 ? "parada" : "paradas"}
                </Text>
              </>
            )}
          </AnimatedPressable>
        </Animated.View>

        <Animated.View entering={useEntering(2)}>
          <AnimatedPressable accessibilityLabel="Encontrar mi mejor compra" onPress={handleFindBestPurchase} style={styles.findCard}>
            <View style={styles.findCardText}>
              <Text style={styles.findCardTitle}>Encontrar mi mejor compra</Text>
              <Text style={styles.findCardSubtitle}>Comparamos precios en lo que ya te queda de paso.</Text>
            </View>
            <Illustration
              compact
              source={require("../../assets/images/encontramejorcompra.png")}
              style={styles.findCardIllustration}
              resizeMode="contain"
            />
          </AnimatedPressable>
        </Animated.View>

        <Animated.View entering={useEntering(3)}>
          <AnimatedPressable
            accessibilityLabel="Descubrí cuánto podés ahorrar comprando de paso"
            haptic={false}
            onPress={handleFindBestPurchase}
            style={styles.savingsBanner}
          >
            <View style={styles.savingsIcon}>
              <Ionicons name="trending-up" size={18} color={colors.brand.accentDark} />
            </View>
            <Text style={styles.savingsLabel}>Descubrí cuánto podés ahorrar comprando de paso</Text>
            <View style={styles.savingsChevron}>
              <Ionicons name="chevron-forward" size={14} color={colors.text.onLime} />
            </View>
          </AnimatedPressable>
        </Animated.View>

        {paymentMethodCount === 0 ? (
          <Animated.View entering={useEntering(4)}>
            <AnimatedPressable
              accessibilityLabel="Sumá tus medios de pago para ver promos"
              haptic={false}
              onPress={() => router.push("/payment-methods")}
              style={styles.promoCard}
            >
              <View style={styles.promoIcon}>
                <Ionicons name="wallet-outline" size={20} color={colors.brand.navy} />
              </View>
              <View style={styles.promoText}>
                <Text style={styles.promoTitle}>Sumá tus medios de pago</Text>
                <Text style={styles.promoSubtitle}>
                  Cuenta DNI, Mercado Pago, MODO o tarjetas: descontamos sus promos de tu Top 3.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
            </AnimatedPressable>
          </Animated.View>
        ) : null}

        <Animated.View entering={useEntering(5)} style={styles.listsSection}>
          <View style={styles.sectionHeader}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              Tus listas
            </Text>
            {activeLists.length > 0 ? (
              <AnimatedPressable
                accessibilityLabel="Ver todas tus listas"
                haptic={false}
                onPress={() => router.push("/lists")}
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
              style={styles.emptyListCard}
            >
              <Ionicons name="add-circle-outline" size={22} color={colors.brand.navy} />
              <Text style={styles.emptyListLabel}>Armá tu primera lista de compras</Text>
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
                        {list.role === "MEMBER" ? ` · de ${list.ownerName ?? "otra persona"}` : ""}
                        {list.role === "OWNER" && list.memberCount > 0 ? " · compartida" : ""}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
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

const useStyles = makeStyles((colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.base,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  headerRow: {
    gap: 2,
  },
  greeting: {
    fontFamily: typography.heroTitle.fontFamily,
    fontSize: 26,
    lineHeight: 32,
    color: colors.text.primary,
  },
  question: {
    fontFamily: typography.subtitle.fontFamily,
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 2,
  },
  promoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radii.xl,
    padding: spacing.md,
  },
  promoIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.brand.mint,
    alignItems: "center",
    justifyContent: "center",
  },
  promoText: {
    flex: 1,
    gap: 2,
  },
  promoTitle: {
    fontFamily: typography.itemTitle.fontFamily,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text.primary,
  },
  promoSubtitle: {
    fontFamily: typography.subtitle.fontFamily,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
  },
  listsSection: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xxs,
  },
  sectionTitle: {
    fontFamily: typography.itemTitle.fontFamily,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text.primary,
  },
  sectionLink: {
    fontFamily: typography.subtitle.fontFamily,
    fontSize: 13,
    color: colors.brand.accentDark,
  },
  listCard: {
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radii.xl,
    overflow: "hidden",
  },
  listDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.subtle,
    marginHorizontal: spacing.md,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 56,
  },
  listRowText: {
    flex: 1,
    gap: 1,
  },
  listRowName: {
    fontFamily: typography.itemTitle.fontFamily,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text.primary,
  },
  listRowMeta: {
    fontFamily: typography.subtitle.fontFamily,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
  },
  emptyListCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border.strong,
    borderRadius: radii.xl,
    padding: spacing.md,
    minHeight: 56,
  },
  emptyListLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: 15,
    color: colors.text.primary,
  },
  routeCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.md + 2,
    gap: spacing.xs,
  },
  routeCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  routeCardTitle: {
    fontFamily: typography.itemTitle.fontFamily,
    fontSize: 14,
    color: colors.text.primary,
  },
  editLink: {
    fontFamily: typography.subtitle.fontFamily,
    fontSize: 13,
    color: colors.brand.accentDark,
  },
  routeEmptyLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: 15,
    color: colors.brand.accentDark,
  },
  chipsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  pinBadge: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    backgroundColor: colors.tint.blue.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  pinEmoji: {
    fontSize: 14,
  },
  chipLabel: {
    fontFamily: typography.itemTitle.fontFamily,
    fontSize: 15,
    color: colors.text.primary,
  },
  chipArrowWrap: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  routeMeta: {
    fontFamily: typography.subtitle.fontFamily,
    fontSize: 13,
    color: colors.text.secondary,
  },
  findCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.tint.blue.bg,
    borderWidth: 1,
    borderColor: colors.tint.blue.border,
    borderRadius: radii.xl,
    padding: spacing.md + 2,
    gap: spacing.sm,
  },
  findCardText: {
    flex: 1,
  },
  findCardTitle: {
    fontFamily: typography.heroTitle.fontFamily,
    fontSize: 20,
    color: colors.text.primary,
  },
  findCardSubtitle: {
    fontFamily: typography.subtitle.fontFamily,
    fontSize: 13,
    lineHeight: 19,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
  findCardIllustration: {
    width: 90,
    height: 90,
  },
  savingsBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.tint.green.bg,
    borderWidth: 1,
    borderColor: colors.tint.green.border,
    borderRadius: radii.lg,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  savingsIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    backgroundColor: colors.surface.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  savingsLabel: {
    flex: 1,
    fontFamily: typography.subtitle.fontFamily,
    fontSize: 13,
    color: colors.brand.accentDark,
  },
  savingsChevron: {
    width: 24,
    height: 24,
    borderRadius: radii.md,
    backgroundColor: colors.brand.accent,
    alignItems: "center",
    justifyContent: "center",
  },
}));
