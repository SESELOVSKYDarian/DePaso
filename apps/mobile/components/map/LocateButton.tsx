import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Linking, Platform, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { radii } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { Dialog } from "@/components/common/Dialog";
import { useMyLocation, type LocationProblem, type MyPoint } from "@/lib/location/useMyLocation";
import { makeStyles, useColors } from "@/lib/theme";

interface LocateButtonProps {
  /** Se llama con la posición cuando se logra ubicar al usuario. */
  onLocated: (point: MyPoint) => void;
  style?: StyleProp<ViewStyle>;
}

/** Texto del cartel que explica qué hacer según el problema. */
const PROBLEM_TEXT: Record<LocationProblem, { title: string; description: string }> = {
  denied: {
    title: "Necesitamos tu ubicación",
    description: "Para mostrarte dónde estás, dale permiso de ubicación a DePaso. Podés hacerlo desde los ajustes.",
  },
  "services-off": {
    title: "Tenés la ubicación apagada",
    description: "Prendé la ubicación del celular para que podamos mostrarte dónde estás.",
  },
  failed: {
    title: "No pudimos ubicarte",
    description: "Probá de nuevo en un lugar con mejor señal, o elegí el lugar en el mapa.",
  },
};

/**
 * Botón redondo "dónde estoy" (el de la mira de Google Maps). Pide el permiso de ubicación si
 * hace falta y, si el usuario no lo da o tiene el GPS apagado, le explica cómo activarlo.
 */
export function LocateButton({ onLocated, style }: LocateButtonProps) {
  const styles = useStyles();
  const colors = useColors();
  const { problem, isLocating, locate, clearProblem } = useMyLocation();

  const handlePress = async () => {
    const found = await locate();
    if (found) onLocated(found);
  };

  const text = problem ? PROBLEM_TEXT[problem] : null;
  // Desde la web el permiso lo maneja el navegador; no hay una pantalla de ajustes a la que ir.
  const canOpenSettings = Platform.OS !== "web" && problem !== "failed";

  return (
    <>
      <AnimatedPressable
        accessibilityLabel="Ver dónde estoy ahora"
        haptic={false}
        onPress={() => void handlePress()}
        style={[styles.button, style]}
      >
        {isLocating ? (
          <ActivityIndicator size="small" color={colors.text.primary} />
        ) : (
          <Ionicons name="locate" size={22} color={colors.text.primary} />
        )}
      </AnimatedPressable>

      <Dialog
        visible={problem !== null}
        title={text?.title ?? ""}
        description={text?.description}
        cancelLabel="Ahora no"
        onCancel={clearProblem}
        confirmLabel={canOpenSettings ? "Abrir ajustes" : "Entendido"}
        onConfirm={() => {
          clearProblem();
          if (canOpenSettings) void Linking.openSettings();
        }}
      />
    </>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    button: {
      width: 48,
      height: 48,
      borderRadius: radii.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface.primary,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
  }),
);
