import type { MerchantRequestResponse } from "@depaso/validation";
import { colors, radii, spacing, typography } from "@depaso/design-tokens";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/Button";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { geocodeClient, merchantClient } from "@/lib/apiClient";
import { useAuth } from "@/lib/auth/AuthContext";

/** Un usuario común pide pasar a rol comercio; un admin lo aprueba o rechaza. */
export default function MerchantRequestScreen() {
  const { show: showToast } = useToast();
  const { refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [current, setCurrent] = useState<MerchantRequestResponse | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<{ businessName?: string; address?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const { request } = await merchantClient.myRequest();
      setCurrent(request);
      if (request?.status === "APPROVED") await refreshUser();
    } catch {
      showToast("No pudimos cargar tu solicitud.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [refreshUser, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = async () => {
    const nextErrors: typeof errors = {};
    if (businessName.trim().length < 2) nextErrors.businessName = "Ingresá el nombre de tu comercio.";
    if (address.trim().length < 3) nextErrors.address = "Ingresá la dirección de tu comercio.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      let coords: { latitude: number; longitude: number };
      try {
        coords = await geocodeClient.forward({ address: address.trim() });
      } catch {
        setErrors({ address: "No pudimos ubicar esa dirección. Probá con calle, número y ciudad." });
        return;
      }
      const { request } = await merchantClient.submitRequest({
        businessName: businessName.trim(),
        address: address.trim(),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      setCurrent(request);
      showToast("Solicitud enviada. Un administrador la va a revisar.", "success");
    } catch {
      showToast("No pudimos enviar la solicitud. Probá de nuevo.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand.navy} />
      </View>
    );
  }

  if (current?.status === "PENDING") {
    return (
      <View style={styles.container}>
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Solicitud en revisión</Text>
          <Text style={styles.statusBody}>
            Pediste ser comercio con el nombre &quot;{current.businessName}&quot;. Un administrador la va a revisar y
            cuando la apruebe tu cuenta pasa a ser de comercio.
          </Text>
        </View>
        <Button label="Actualizar estado" variant="secondary" onPress={() => void load()} />
      </View>
    );
  }

  if (current?.status === "APPROVED") {
    return (
      <View style={styles.container}>
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>¡Tu comercio fue aprobado!</Text>
          <Text style={styles.statusBody}>Ya podés cargar tus productos y precios.</Text>
        </View>
        <Button label="Ir a Mi comercio" onPress={() => router.replace("/merchant")} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {current?.status === "REJECTED" ? (
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Tu solicitud anterior fue rechazada</Text>
          <Text style={styles.statusBody}>
            {current.rejectionReason ? `Motivo: ${current.rejectionReason}. ` : ""}Podés corregir los datos y volver a
            enviarla.
          </Text>
        </View>
      ) : (
        <Text style={styles.intro}>
          Si tenés un comercio y querés publicar tus productos y precios en DePaso, completá estos datos. Un
          administrador revisa la solicitud y, si la aprueba, tu cuenta pasa a ser de comercio.
        </Text>
      )}

      <FormField
        label="Nombre del comercio"
        value={businessName}
        onChangeText={(text) => {
          setBusinessName(text);
          setErrors((e) => ({ ...e, businessName: undefined }));
        }}
        autoCapitalize="words"
        error={errors.businessName}
      />
      <FormField
        label="Dirección"
        value={address}
        onChangeText={(text) => {
          setAddress(text);
          setErrors((e) => ({ ...e, address: undefined }));
        }}
        placeholder="Calle, número, ciudad"
        autoCapitalize="words"
        error={errors.address}
      />
      <FormField label="Teléfono (opcional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <FormField
        label="Comentario para el administrador (opcional)"
        value={note}
        onChangeText={setNote}
        multiline
        autoCapitalize="sentences"
      />

      <Button
        label={isSubmitting ? "Enviando..." : "Enviar solicitud"}
        onPress={() => void handleSubmit()}
        loading={isSubmitting}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.surface.base, padding: spacing.lg, gap: spacing.md },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface.base },
  intro: { fontFamily: typography.body.fontFamily, fontSize: 14, color: colors.text.secondary, lineHeight: 20 },
  statusCard: {
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  statusTitle: { fontFamily: typography.itemTitle.fontFamily, fontSize: 16, color: colors.text.primary },
  statusBody: { fontFamily: typography.body.fontFamily, fontSize: 14, color: colors.text.secondary, lineHeight: 20 },
});
