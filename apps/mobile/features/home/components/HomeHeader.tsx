import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { useBreakpoint } from "@/lib/responsive/useBreakpoint";
import { useColors } from "@/lib/theme";
import { useStyles } from "../styles";

interface HomeHeaderProps {
  firstName: string;
  isDark: boolean;
  onToggleTheme: () => void;
}

/** Saludo de Inicio con el botón para cambiar entre modo claro y oscuro. */
export function HomeHeader({ firstName, isDark, onToggleTheme }: HomeHeaderProps) {
  const colors = useColors();
  const styles = useStyles();
  const { contentWidth } = useBreakpoint();
  const wide = contentWidth >= 980;
  return (
    <View style={styles.headerRow}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[styles.greeting, wide ? styles.greetingWide : null]} numberOfLines={1}>
          Hola{firstName ? `, ${firstName}` : ""}
        </Text>
        <Text style={[styles.question, wide ? styles.questionWide : null]}>¿Qué te queda de paso hoy?</Text>
      </View>
      <AnimatedPressable
        accessibilityLabel={isDark ? "Pasar a modo claro" : "Pasar a modo oscuro"}
        onPress={onToggleTheme}
        style={styles.themeButton}
      >
        <Ionicons name={isDark ? "sunny-outline" : "moon-outline"} size={22} color={colors.text.primary} />
      </AnimatedPressable>
    </View>
  );
}