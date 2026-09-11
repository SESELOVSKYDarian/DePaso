import * as Location from "expo-location";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "./AnimatedPressable";
import { consentClient } from "@/lib/apiClient";

export type LocationConsentResult = "granted" | "manual" | "later";

interface LocationConsentModalProps {
  visible: boolean;
  onClose: (result: LocationConsentResult) => void;
}

/**
 * Modal de permiso de ubicación — copy y botones exactos de
 * docs/legal-functional/FUNCTIONAL.md ("Al usar ubicación por primera vez"). Se muestra
 * antes del primer cálculo de ruta (Fase 7+), no en el registro — es un consentimiento
 * específico y separado del de T&C/Privacidad (sección 30-31).
 */
export function LocationConsentModal({ visible, onClose }: LocationConsentModalProps) {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleAllow = async () => {
    setIsRequesting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      await consentClient.submit({ type: "LOCATION", accepted: status === "granted" });
      onClose(status === "granted" ? "granted" : "later");
    } finally {
      setIsRequesting(false);
    }
  };

  const handleManual = () => {
    onClose("manual");
  };

  const handleLater = async () => {
    await consentClient.submit({ type: "LOCATION", accepted: false }).catch(() => {
      // Best-effort: si falla el registro del consentimiento no bloqueamos al usuario.
    });
    onClose("later");
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleManual}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Usar tu ubicación</Text>
          <Text style={styles.body}>
            La usamos para calcular rutas, desvíos y comercios cercanos. No necesitamos
            seguirte todo el día. Podés revocar el permiso o ingresar lugares
            manualmente.
          </Text>

          <AnimatedPressable
            accessibilityLabel="Permitir mientras uso DePaso"
            onPress={() => void handleAllow()}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryLabel}>
              {isRequesting ? "Pidiendo permiso..." : "Permitir mientras uso DePaso"}
            </Text>
          </AnimatedPressable>

          <AnimatedPressable
            accessibilityLabel="Ingresar dirección manualmente"
            haptic={false}
            onPress={handleManual}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryLabel}>Ingresar dirección manualmente</Text>
          </AnimatedPressable>

          <Pressable
            accessibilityLabel="Ahora no"
            onPress={() => void handleLater()}
            style={styles.laterButton}
            hitSlop={8}
          >
            <Text style={styles.laterLabel}>Ahora no</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(26, 19, 65, 0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface.primary,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    fontFamily: typography.title.fontFamily,
    fontWeight: "600",
    fontSize: 20,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  body: {
    fontFamily: typography.bodyRegular.fontFamily,
    fontSize: 15,
    lineHeight: 21,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.brand.navy,
    borderRadius: radii.lg,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  primaryLabel: {
    fontFamily: typography.title.fontFamily,
    fontWeight: "600",
    fontSize: 16,
    color: colors.text.onNavy,
  },
  secondaryButton: {
    marginTop: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border.strong,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  secondaryLabel: {
    fontFamily: typography.body.fontFamily,
    fontWeight: "600",
    fontSize: 15,
    color: colors.text.primary,
  },
  laterButton: {
    marginTop: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  laterLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: colors.text.muted,
  },
});
