import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, typography } from "@depaso/design-tokens";

interface PlaceholderScreenProps {
  title: string;
  description: string;
}

/**
 * Placeholder branded para tabs cuyo contenido real es de fases posteriores (Listas, Mapa,
 * Actividad, Perfil — fases 9/17/68-69/19 en docs/development/IMPLEMENTATION-PLAN.md).
 */
export function PlaceholderScreen({ title, description }: PlaceholderScreenProps) {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.base,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  title: {
    fontFamily: typography.title.fontFamily,
    fontWeight: typography.title.fontWeight as "600",
    fontSize: typography.title.fontSize,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  description: {
    fontFamily: typography.bodyRegular.fontFamily,
    fontSize: typography.bodyRegular.fontSize,
    lineHeight: typography.bodyRegular.lineHeight,
    color: colors.text.secondary,
  },
});
