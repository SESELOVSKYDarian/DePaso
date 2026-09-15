import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Dialog } from "@/components/Dialog";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { accountExportClient, authClient } from "@/lib/apiClient";
import { useAuth } from "@/lib/auth/AuthContext";
import { usePlaces } from "@/lib/places/PlacesContext";

/**
 * "Configuración → Privacidad y datos" (LEGAL.md p.14, derechos del titular): Descargar/
 * solicitar datos · Corregir mis datos · Borrar lugares · Eliminar cuenta. Todo se ejecuta
 * al toque — a esta escala no hace falta encolar en soporte para cumplir el plazo legal
 * (10 días corridos acceso / 5 días hábiles rectificación-supresión); inmediato siempre
 * cumple el plazo.
 */
export default function PrivacyScreen() {
  const { user, refreshUser, deleteAccount } = useAuth();
  const { places, removePlace } = usePlaces();
  const toast = useToast();

  const [isExporting, setIsExporting] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [isSavingName, setIsSavingName] = useState(false);
  const [confirmClearPlaces, setConfirmClearPlaces] = useState(false);
  const [isClearingPlaces, setIsClearingPlaces] = useState(false);
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await accountExportClient.export();
      await Share.share({ message: JSON.stringify(data, null, 2), title: "Mis datos en DePaso" });
    } catch {
      toast.show("No pudimos generar tu export. Probá de nuevo.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveName = async () => {
    setIsSavingName(true);
    try {
      await authClient.updateProfile({ displayName: displayName.trim() || null });
      await refreshUser();
      setIsEditingName(false);
      toast.show("Datos actualizados.", "success");
    } catch {
      toast.show("No pudimos guardar el cambio. Probá de nuevo.", "error");
    } finally {
      setIsSavingName(false);
    }
  };

  const handleClearPlaces = async () => {
    setConfirmClearPlaces(false);
    setIsClearingPlaces(true);
    try {
      await Promise.all(places.map((p) => removePlace(p.id)));
      toast.show("Se borraron tus lugares guardados.", "success");
    } catch {
      toast.show("No pudimos borrar todos los lugares. Probá de nuevo.", "error");
    } finally {
      setIsClearingPlaces(false);
    }
  };

  const handleDeleteAccount = async () => {
    setConfirmDeleteAccount(false);
    setIsDeletingAccount(true);
    try {
      await deleteAccount();
    } catch {
      toast.show("No pudimos eliminar tu cuenta. Probá de nuevo.", "error");
      setIsDeletingAccount(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Privacidad y datos</Text>
        <Text style={styles.intro}>
          Estos son tus derechos sobre tu información en DePaso. Podés ejercerlos acá directamente o
          escribiendo a privacidad@depaso.app.
        </Text>

        <Row
          icon="download-outline"
          label="Descargar mis datos"
          description="Cuenta, lugares, listas, preferencias y reportes de precio, en un archivo que podés compartir o guardar."
          actionLabel={isExporting ? "Generando..." : "Descargar"}
          onPress={() => void handleExport()}
          loading={isExporting}
        />

        <Row
          icon="create-outline"
          label="Corregir mis datos"
          description="Editá el nombre visible de tu cuenta."
          actionLabel={isEditingName ? "Cerrar" : "Editar"}
          onPress={() => setIsEditingName((v) => !v)}
        />
        {isEditingName ? (
          <View style={styles.editBox}>
            <FormField label="Nombre" value={displayName} onChangeText={setDisplayName} placeholder="Tu nombre" />
            <AnimatedPressable
              accessibilityLabel="Guardar nombre"
              onPress={() => void handleSaveName()}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonLabel}>{isSavingName ? "Guardando..." : "Guardar"}</Text>
            </AnimatedPressable>
          </View>
        ) : null}

        <Row
          icon="trash-outline"
          label="Borrar lugares"
          description={`Elimina los ${places.length} ${places.length === 1 ? "lugar guardado" : "lugares guardados"} de tu cuenta (Casa, Trabajo, etc.).`}
          actionLabel={isClearingPlaces ? "Borrando..." : "Borrar todos"}
          onPress={() => setConfirmClearPlaces(true)}
          loading={isClearingPlaces}
          disabled={places.length === 0}
          destructive
        />

        <Row
          icon="person-remove-outline"
          label="Eliminar cuenta"
          description="Borra tu acceso y anonimiza tu cuenta. No se puede deshacer."
          actionLabel={isDeletingAccount ? "Eliminando..." : "Eliminar cuenta"}
          onPress={() => setConfirmDeleteAccount(true)}
          loading={isDeletingAccount}
          destructive
        />
      </ScrollView>

      <Dialog
        visible={confirmClearPlaces}
        title="¿Borrar todos tus lugares?"
        description="Vas a perder Casa, Trabajo y cualquier otro lugar guardado. Esta acción no se puede deshacer."
        confirmLabel="Borrar todos"
        destructive
        onConfirm={() => void handleClearPlaces()}
        onCancel={() => setConfirmClearPlaces(false)}
      />
      <Dialog
        visible={confirmDeleteAccount}
        title="¿Eliminar tu cuenta?"
        description="Perdés el acceso de inmediato. Tu cuenta queda anonimizada y no se puede recuperar."
        confirmLabel="Eliminar cuenta"
        destructive
        onConfirm={() => void handleDeleteAccount()}
        onCancel={() => setConfirmDeleteAccount(false)}
      />
    </SafeAreaView>
  );
}

function Row({
  icon,
  label,
  description,
  actionLabel,
  onPress,
  loading = false,
  disabled = false,
  destructive = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  actionLabel: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, destructive && styles.rowIconDanger]}>
        <Ionicons name={icon} size={18} color={destructive ? colors.state.error : colors.text.secondary} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowDescription}>{description}</Text>
      </View>
      <AnimatedPressable
        accessibilityLabel={label}
        haptic={false}
        onPress={disabled || loading ? undefined : onPress}
        style={[styles.actionButton, destructive && styles.actionButtonDanger, (disabled || loading) && styles.actionButtonDisabled]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={destructive ? colors.state.error : colors.text.primary} />
        ) : (
          <Text style={[styles.actionLabel, destructive && styles.actionLabelDanger]}>{actionLabel}</Text>
        )}
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.base },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  title: { fontFamily: typography.heroTitle.fontFamily, fontSize: 24, color: colors.text.primary },
  intro: { fontFamily: typography.body.fontFamily, fontSize: 14, lineHeight: 20, color: colors.text.secondary },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.tint.blue.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  rowIconDanger: { backgroundColor: colors.surface.secondary },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { fontFamily: typography.itemTitle.fontFamily, fontSize: 15, color: colors.text.primary },
  rowDescription: { fontFamily: typography.caption.fontFamily, fontSize: 12, lineHeight: 17, color: colors.text.secondary },
  actionButton: {
    minHeight: 36,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonDanger: { borderColor: colors.state.error },
  actionButtonDisabled: { opacity: 0.5 },
  actionLabel: { fontFamily: typography.caption.fontFamily, fontSize: 12, fontWeight: "600", color: colors.text.primary },
  actionLabelDanger: { color: colors.state.error },
  editBox: { gap: spacing.sm, marginTop: -spacing.sm },
  saveButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.brand.navy,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    minHeight: 40,
    justifyContent: "center",
  },
  saveButtonLabel: { fontFamily: typography.buttonLabel.fontFamily, fontSize: 13, color: colors.text.onNavy },
});
