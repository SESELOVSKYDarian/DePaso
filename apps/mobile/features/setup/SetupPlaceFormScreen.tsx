import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { makeStyles, useColors } from "@/lib/theme";
import PlaceFormScreen from "@/features/place-form/PlaceFormScreen";

/**
 * Mismo formulario que `places/form.tsx`, alcanzable dentro del stack propio de `(setup)` en vez
 * de compartir el nombre de ruta con la copia del stack raíz (registrar la misma `name` en dos
 * `Stack.Protected` hermanos rompe `router.push`). Acá no hay encabezado del sistema, así que se
 * le pone uno propio y el margen de la barra de estado: antes el formulario quedaba pegado
 * arriba, por debajo de la hora y la batería.
 */
export default function SetupPlaceFormScreen() {
  const styles = useStyles();
  const colors = useColors();
  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <AnimatedPressable accessibilityLabel="Volver" haptic={false} onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </AnimatedPressable>
        <Text accessibilityRole="header" style={styles.title}>
          Agregar un lugar
        </Text>
      </View>
      <View style={styles.body}>
        <PlaceFormScreen />
      </View>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface.base },
    header: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
    back: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
    title: { fontFamily: typography.screenTitle.fontFamily, fontSize: 22, color: colors.text.primary },
    body: { flex: 1 },
  }),
);
