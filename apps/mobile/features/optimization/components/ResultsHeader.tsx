import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { makeStyles, useColors } from "@/lib/theme";

export type ResultsTab = "options" | "prices";

const TABS: { value: ResultsTab; title: string }[] = [
  { value: "options", title: "Opciones de compra" },
  { value: "prices", title: "Mejores precios" },
];

interface ResultsHeaderProps {
  tab: ResultsTab;
  onChangeTab: (tab: ResultsTab) => void;
  onReset: () => void;
}

/** Cabecera de los resultados: título, botón para empezar de nuevo y las dos pestañas. */
export function ResultsHeader({ tab, onChangeTab, onReset }: ResultsHeaderProps) {
  const colors = useColors();
  const styles = useStyles();

  return (
    <View style={styles.top}>
      <View style={styles.head}>
        <View>
          <Text style={styles.eyebrow}>TU COMPRA</Text>
          <Text style={styles.title}>Comprá mejor, de paso</Text>
        </View>
        <AnimatedPressable accessibilityLabel="Armar otra optimización" haptic={false} onPress={onReset} style={styles.reset}>
          <Ionicons name="refresh" size={19} color={colors.text.primary} accessible={false} />
        </AnimatedPressable>
      </View>
      <View accessibilityRole="tablist" style={styles.tabs}>
        {TABS.map(({ value, title }) => {
          const selected = tab === value;
          return (
            <Pressable
              key={value}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={title}
              onPress={() => onChangeTab(value)}
              style={[styles.tab, selected ? styles.tabSelected : null]}
            >
              <Text style={[styles.tabLabel, selected ? styles.tabLabelSelected : null]}>{title}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    top: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md },
    head: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    eyebrow: { fontFamily: typography.caption.fontFamily, fontSize: 12, letterSpacing: 1, color: colors.brand.accentDark },
    title: { fontFamily: typography.heroTitle.fontFamily, fontSize: 28, lineHeight: 34, color: colors.text.primary },
    reset: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radii.full,
      backgroundColor: colors.surface.primary,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    tabs: { flexDirection: "row", padding: 4, borderRadius: radii.full, backgroundColor: colors.surface.input },
    tab: { flex: 1, minHeight: 40, borderRadius: radii.full, alignItems: "center", justifyContent: "center" },
    tabSelected: { backgroundColor: colors.surface.primary },
    tabLabel: { fontFamily: typography.body.fontFamily, fontSize: 14, color: colors.text.secondary },
    tabLabelSelected: { color: colors.text.primary, fontWeight: "600" },
  }),
);
