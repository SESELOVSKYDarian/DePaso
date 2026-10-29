import { spacing, typography } from "@depaso/design-tokens";
import { ScrollView, StyleSheet, Text } from "react-native";
import { DetourPicker } from "@/components/map/DetourPicker";
import { makeStyles } from "@/lib/theme";

/** Perfil → "Cuánto me desvío": cuántas cuadras aceptás salirte del camino en cada nivel de compra. */
export default function DetourSettingsScreen() {
  const styles = useStyles();
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>
        Una cuadra son unos 100 metros. Se usa al armar tu compra de paso; el nivel hipereconómico no tiene tope.
      </Text>
      <DetourPicker />
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    content: { padding: spacing.lg, gap: spacing.md },
    subtitle: { fontFamily: typography.subtitle.fontFamily, fontSize: 15, lineHeight: 22, color: colors.text.secondary },
  }),
);
