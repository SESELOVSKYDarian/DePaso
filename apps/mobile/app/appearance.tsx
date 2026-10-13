import { ScrollView, StyleSheet, Text } from "react-native";
import { spacing, typography } from "@depaso/design-tokens";
import { GroupedList, GroupedRow } from "@/components/GroupedList";
import { SelectionMark } from "@/components/SelectionMark";
import { makeStyles, useTheme, type ThemeMode } from "@/lib/theme";

const OPTIONS: { mode: ThemeMode; label: string; icon: "phone-portrait-outline" | "sunny-outline" | "moon-outline" }[] = [
  { mode: "system", label: "Automático", icon: "phone-portrait-outline" },
  { mode: "light", label: "Claro", icon: "sunny-outline" },
  { mode: "dark", label: "Oscuro", icon: "moon-outline" },
];

/** Elegir entre seguir al sistema, siempre claro o siempre oscuro. Se aplica al instante. */
export default function AppearanceScreen() {
  const styles = useStyles();
  const { mode, setMode } = useTheme();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.intro}>
        Elegí cómo se ve DePaso. En automático usa el modo claro u oscuro de tu teléfono.
      </Text>
      <GroupedList>
        {OPTIONS.map((option) => (
          <GroupedRow
            key={option.mode}
            icon={option.icon}
            label={option.label}
            accessibilityState={{ selected: mode === option.mode }}
            onPress={() => setMode(option.mode)}
            trailing={<SelectionMark selected={mode === option.mode} />}
          />
        ))}
      </GroupedList>
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      backgroundColor: colors.surface.base,
      padding: spacing.lg,
      gap: spacing.lg,
    },
    intro: {
      fontFamily: typography.subtitle.fontFamily,
      fontSize: 14,
      lineHeight: 20,
      color: colors.text.secondary,
    },
  }),
);
