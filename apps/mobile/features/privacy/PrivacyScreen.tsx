import { useState } from "react";
import { ActivityIndicator, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { Dialog } from "@/components/common/Dialog";
import { FormField } from "@/components/common/FormField";
import { useToast } from "@/components/common/Toast";
import { accountExportClient, authClient } from "@/lib/apiClient";
import { useAuth } from "@/lib/auth/AuthContext";
import { usePlaces } from "@/lib/places/PlacesContext";
import { useStyles } from "./styles";
import { Row } from "./components/Row";

/**
 * "Configuración → Privacidad y datos" (LEGAL.md p.14, derechos del titular): Descargar/
 * solicitar datos · Corregir mis datos · Borrar lugares · Eliminar cuenta. Todo se ejecuta
 * al toque — a esta escala no hace falta encolar en soporte para cumplir el plazo legal
 * (10 días corridos acceso / 5 días hábiles rectificación-supresión); inmediato siempre
 * cumple el plazo.
 */
export default function PrivacyScreen() {
  const styles = useStyles();
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

  // descarga todos los datos del usuario y los comparte como archivo
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

  // guarda el nombre visible de la cuenta
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

  // borra todos los lugares guardados (el diálogo ya pidió confirmación)
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

  // elimina la cuenta; al terminar, la app vuelve al inicio de sesión
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
