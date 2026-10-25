import { Ionicons } from "@expo/vector-icons";
import type { ClaimableBranch, MerchantRequestResponse } from "@depaso/validation";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { makeStyles, useColors } from "@/lib/theme";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Button } from "@/components/Button";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { geocodeClient, merchantClient } from "@/lib/apiClient";
import { useAuth } from "@/lib/auth/AuthContext";

/** Un usuario común pide pasar a rol comercio; un admin lo aprueba o rechaza. */
export default function MerchantRequestScreen() {
  const colors = useColors();
  const styles = useStyles();
  const { show: showToast } = useToast();
  const { refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [current, setCurrent] = useState<MerchantRequestResponse | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactErrors, setContactErrors] = useState<{ phone?: string; contactEmail?: string }>({});
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<{ businessName?: string; address?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  // "Mi comercio ya está en DePaso": se busca la sucursal importada y se pide administrarla.
  const [mode, setMode] = useState<"claim" | "new">("claim");
  const [claimQuery, setClaimQuery] = useState("");
  const [claimResults, setClaimResults] = useState<ClaimableBranch[]>([]);
  const [claimed, setClaimed] = useState<ClaimableBranch | null>(null);
  const [isSearchingBranches, setIsSearchingBranches] = useState(false);

  useEffect(() => {
    if (mode !== "claim") return;
    let cancelled = false;
    setIsSearchingBranches(true);
    const timer = setTimeout(() => {
      merchantClient
        .claimableBranches(claimQuery.trim())
        .then(({ branches }) => {
          if (!cancelled) setClaimResults(branches);
        })
        .catch(() => {
          if (!cancelled) setClaimResults([]);
        })
        .finally(() => {
          if (!cancelled) setIsSearchingBranches(false);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [claimQuery, mode]);

  /** Teléfono y correo son obligatorios: sirven para confirmar que la persona trabaja en el comercio. */
  const validateContact = (): boolean => {
    const next: { phone?: string; contactEmail?: string } = {};
    if (phone.replace(/\D/g, "").length < 6) next.phone = "Ingresá un teléfono al que podamos llamarte.";
    if (!/^\S+@\S+\.\S+$/.test(contactEmail.trim())) next.contactEmail = "Ingresá un correo de contacto válido.";
    setContactErrors(next);
    return Object.keys(next).length === 0;
  };

  const submitClaim = async () => {
    if (!claimed || !validateContact()) return;
    setIsSubmitting(true);
    try {
      const { request } = await merchantClient.submitRequest({
        businessName: `${claimed.storeName} ${claimed.name}`.trim().slice(0, 80),
        address: claimed.address,
        latitude: claimed.latitude,
        longitude: claimed.longitude,
        storeBranchId: claimed.id,
        phone: phone.trim(),
        contactEmail: contactEmail.trim(),
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      setCurrent(request);
      showToast("Solicitud enviada. Un administrador la va a revisar.", "success");
    } catch {
      showToast("No pudimos enviar la solicitud. Probá de nuevo.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

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
    const contactOk = validateContact();
    if (Object.keys(nextErrors).length > 0 || !contactOk) return;

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
        phone: phone.trim(),
        contactEmail: contactEmail.trim(),
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

      <View style={styles.tabs}>
        {(["claim", "new"] as const).map((value) => (
          <AnimatedPressable
            key={value}
            accessibilityLabel={value === "claim" ? "Mi comercio ya aparece en DePaso" : "Es un comercio nuevo"}
            haptic={false}
            onPress={() => setMode(value)}
            style={[styles.tab, mode === value ? styles.tabSelected : null]}
          >
            <Text style={[styles.tabLabel, mode === value ? styles.tabLabelSelected : null]}>
              {value === "claim" ? "Ya aparece en DePaso" : "Es nuevo"}
            </Text>
          </AnimatedPressable>
        ))}
      </View>

      {mode === "claim" ? (
        <>
          <Text style={styles.intro}>
            Los supermercados que publican precios en SEPA ya están cargados. Buscá el tuyo y pedí administrarlo: vas a
            poder corregir precios y nombres.
          </Text>
          <FormField
            label="Buscar tu supermercado"
            value={claimQuery}
            onChangeText={(text) => {
              setClaimQuery(text);
              setClaimed(null);
            }}
            placeholder="Nombre o dirección"
          />
          {isSearchingBranches ? <ActivityIndicator color={colors.text.secondary} /> : null}
          {claimResults.map((branch) => {
            const selected = claimed?.id === branch.id;
            return (
              <AnimatedPressable
                key={branch.id}
                accessibilityLabel={`Elegir ${branch.storeName}, ${branch.address}`}
                haptic={false}
                onPress={() => setClaimed(branch)}
                style={[styles.branchRow, selected ? styles.branchRowSelected : null]}
              >
                <Ionicons name="storefront-outline" size={20} color={colors.text.primary} />
                <View style={styles.flex}>
                  <Text style={styles.branchName}>{branch.storeName}</Text>
                  <Text style={styles.branchMeta} numberOfLines={1}>
                    {branch.address} · {branch.priceCount} precios
                  </Text>
                </View>
                {selected ? <Ionicons name="checkmark-circle" size={22} color={colors.text.primary} /> : null}
              </AnimatedPressable>
            );
          })}
          {!isSearchingBranches && claimResults.length === 0 ? (
            <Text style={styles.intro}>No encontramos sucursales libres con eso. Si tu comercio no está, elegí "Es nuevo".</Text>
          ) : null}
          <FormField
            label="Teléfono de contacto"
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              setContactErrors((e) => ({ ...e, phone: undefined }));
            }}
            keyboardType="phone-pad"
            error={contactErrors.phone}
          />
          <FormField
            label="Correo de contacto"
            value={contactEmail}
            onChangeText={(text) => {
              setContactEmail(text);
              setContactErrors((e) => ({ ...e, contactEmail: undefined }));
            }}
            keyboardType="email-address"
            autoComplete="email"
            error={contactErrors.contactEmail}
          />
          <Text style={styles.intro}>
            Te vamos a llamar o escribir para confirmar que trabajás en el comercio antes de aprobarlo. Sin esa
            verificación no se da el alta.
          </Text>
          <Button
            label={isSubmitting ? "Enviando..." : claimed ? `Pedir administrar ${claimed.storeName}` : "Elegí tu sucursal"}
            onPress={() => void submitClaim()}
            loading={isSubmitting}
            disabled={!claimed}
          />
        </>
      ) : (
        <>
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
      <FormField
            label="Teléfono de contacto"
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              setContactErrors((e) => ({ ...e, phone: undefined }));
            }}
            keyboardType="phone-pad"
            error={contactErrors.phone}
          />
          <FormField
            label="Correo de contacto"
            value={contactEmail}
            onChangeText={(text) => {
              setContactEmail(text);
              setContactErrors((e) => ({ ...e, contactEmail: undefined }));
            }}
            keyboardType="email-address"
            autoComplete="email"
            error={contactErrors.contactEmail}
          />
          <Text style={styles.intro}>
            Te vamos a llamar o escribir para confirmar que trabajás en el comercio antes de aprobarlo. Sin esa
            verificación no se da el alta.
          </Text>
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
        </>
      )}
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) => StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.surface.base, padding: spacing.lg, gap: spacing.md },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface.base },
  flex: { flex: 1 },
  tabs: { flexDirection: "row", gap: spacing.sm },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.primary,
  },
  tabSelected: { borderColor: colors.brand.navy, backgroundColor: colors.brand.navy },
  tabLabel: { fontFamily: typography.body.fontFamily, fontSize: 14, color: colors.text.primary },
  tabLabelSelected: { color: colors.text.onNavy, fontWeight: "600" },
  branchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 56,
    padding: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.primary,
  },
  branchRowSelected: { borderColor: colors.text.primary, borderWidth: 2 },
  branchName: { fontFamily: typography.itemTitle.fontFamily, fontSize: 15, color: colors.text.primary },
  branchMeta: { fontFamily: typography.caption.fontFamily, fontSize: 12, color: colors.text.secondary },
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
}));
