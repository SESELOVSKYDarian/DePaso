import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { BrandLogo } from "@/components/common/BrandLogo";
import { useAuth } from "@/lib/auth/AuthContext";
import { SIDE_NAV_WIDTH } from "@/lib/responsive/useBreakpoint";
import { makeStyles, useColors } from "@/lib/theme";

/** Lo mínimo que se usa de lo que arma el navegador de pestañas (así no depende de su librería). */
export interface SideNavProps {
  state: { index: number; routes: { key: string; name: string }[] };
  descriptors: Record<
    string,
    {
      options: {
        title?: string;
        tabBarBadge?: string | number;
        tabBarIcon?: (props: { color: string; size: number; focused: boolean }) => ReactNode;
      };
    }
  >;
  navigation: { navigate: (name: string) => void };
  /** Barra angosta, solo íconos (celular acostado). */
  compact: boolean;
}

/** Ancho de la barra angosta. */
const COMPACT_WIDTH = 84;

/**
 * Menú lateral de la versión para computadora: el logo arriba, las secciones en una lista
 * limpia y la cuenta abajo. Con el celular acostado queda una barra angosta de íconos.
 */
export function SideNav({ state, descriptors, navigation, compact }: SideNavProps) {
  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const name = user?.displayName ?? user?.email ?? "";

  return (
    <View style={[styles.bar, { width: compact ? COMPACT_WIDTH : SIDE_NAV_WIDTH + 20, paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg }]}>
      <View style={[styles.brand, compact ? styles.brandCompact : null]}>
        <BrandLogo variant={compact ? "mark" : "wordmark"} style={compact ? styles.mark : styles.wordmark} />
      </View>

      <View style={styles.items}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key]!;
          const focused = state.index === index;
          const color = focused ? colors.text.primary : colors.text.secondary;
          return (
            <AnimatedPressable
              key={route.key}
              accessibilityLabel={options.title ?? route.name}
              haptic={false}
              onPress={() => navigation.navigate(route.name)}
              style={[styles.item, compact ? styles.itemCompact : null, focused ? styles.itemActive : null]}
            >
              <View>
                {options.tabBarIcon?.({ color, size: 22, focused })}
                {compact && options.tabBarBadge ? <View style={styles.dot} /> : null}
              </View>
              {compact ? null : (
                <>
                  <Text style={[styles.label, { color }, focused ? styles.labelActive : null]}>{options.title ?? route.name}</Text>
                  {options.tabBarBadge ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{options.tabBarBadge}</Text>
                    </View>
                  ) : null}
                </>
              )}
            </AnimatedPressable>
          );
        })}
      </View>

      {compact ? null : (
        <AnimatedPressable accessibilityLabel="Mi perfil" haptic={false} onPress={() => navigation.navigate("profile")} style={styles.account}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={16} color={colors.text.onNavy} />
          </View>
          <Text style={styles.accountName} numberOfLines={1}>
            {name}
          </Text>
        </AnimatedPressable>
      )}
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    bar: { backgroundColor: colors.surface.primary, borderRightWidth: 1, borderRightColor: colors.border.subtle, paddingHorizontal: spacing.md, justifyContent: "flex-start" },
    brand: { paddingHorizontal: spacing.sm, marginBottom: spacing.xl },
    brandCompact: { alignItems: "center", paddingHorizontal: 0 },
    wordmark: { width: 150, height: 40, alignSelf: "flex-start" },
    mark: { width: 40, height: 40 },
    items: { flex: 1, gap: spacing.xxs },
    item: { flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: 48, paddingHorizontal: spacing.md, borderRadius: radii.lg },
    itemCompact: { justifyContent: "center", paddingHorizontal: 0 },
    itemActive: { backgroundColor: colors.surface.input },
    label: { flex: 1, fontFamily: typography.body.fontFamily, fontSize: 15 },
    labelActive: { fontFamily: typography.itemTitle.fontFamily },
    badge: { minWidth: 22, height: 22, paddingHorizontal: 6, borderRadius: radii.full, alignItems: "center", justifyContent: "center", backgroundColor: colors.state.errorStrong },
    badgeText: { fontFamily: typography.itemTitle.fontFamily, fontSize: 12, color: "#FFFFFF" },
    dot: { position: "absolute", top: -2, right: -4, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.state.errorStrong },
    account: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.sm, borderRadius: radii.lg },
    avatar: { width: 32, height: 32, borderRadius: radii.full, alignItems: "center", justifyContent: "center", backgroundColor: colors.brand.navy },
    accountName: { flex: 1, fontFamily: typography.body.fontFamily, fontSize: 13, color: colors.text.secondary },
  }),
);