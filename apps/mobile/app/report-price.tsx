import { ApiError } from "@depaso/api-client";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Checkbox } from "@/components/Checkbox";
import { FormField } from "@/components/FormField";
import { priceReportsClient } from "@/lib/apiClient";
import { useToast } from "@/components/Toast";

/**
 * "Usuario ve un precio → toca 'Reportar precio'" (FLOWS.md p.6-8, paso 1). Se llega acá
 * desde donde el precio realmente se muestra (Top 3 y Modo compra) — nunca es una pantalla
 * suelta sin origen. El backend corre el resto del flujo (independencia, consenso,
 * anti-fraude) al recibir el reporte.
 */
export default function ReportPriceScreen() {
  const { productVariantId, storeBranchId, productName, storeName, currentPrice } = useLocalSearchParams<{
    productVariantId: string;
    storeBranchId: string;
    productName: string;
    storeName?: string;
    currentPrice?: string;
  }>();
  const toast = useToast();

  const [price, setPrice] = useState(currentPrice ?? "");
  const [requiresPromotion, setRequiresPromotion] = useState(false);
  const [promotionNote, setPromotionNote] = useState("");
  const [goodFaith, setGoodFaith] = useState(false);
  const [priceError, setPriceError] = useState<string>();
  const [promotionError, setPromotionError] = useState<string>();
  const [goodFaithError, setGoodFaithError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const amount = Number(price.replace(",", "."));
    let hasError = false;
    if (!price.trim() || !Number.isFinite(amount) || amount <= 0) {
      setPriceError("Ingresá el precio que viste.");
      hasError = true;
    } else {
      setPriceError(undefined);
    }
    if (requiresPromotion && !promotionNote.trim()) {
      setPromotionError("Contá brevemente la condición (tarjeta, club, cantidad mínima...).");
      hasError = true;
    } else {
      setPromotionError(undefined);
    }
    if (!goodFaith) {
      setGoodFaithError("Confirmá que el reporte es de buena fe para poder enviarlo.");
      hasError = true;
    } else {
      setGoodFaithError(undefined);
    }
    if (hasError || !productVariantId || !storeBranchId) return;

    setFormError(undefined);
    setIsSubmitting(true);
    try {
      await priceReportsClient.submit({
        productVariantId,
        storeBranchId,
        reportedPrice: amount,
        requiresPromotion,
        ...(requiresPromotion ? { promotionNote: promotionNote.trim() } : {}),
        goodFaithDeclared: true,
      });
      toast.show("Gracias — tu reporte ayuda a mejorar el precio de todos.", "success");
      router.back();
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setFormError("Ya reportaste varios precios en la última hora — probá de nuevo más tarde.");
      } else {
        setFormError("No pudimos enviar tu reporte. Probá de nuevo.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>{productName ?? "Este producto"}</Text>
          {storeName ? <Text style={styles.subtitle}>{storeName}</Text> : null}
        </View>
        <Text style={styles.intro}>
          Contanos el precio real que viste — ayuda a que el precio quede confirmado o marcado
          como discutido para el resto de la comunidad.
        </Text>

        <FormField
          label="Precio que viste"
          value={price}
          onChangeText={setPrice}
          placeholder="0"
          keyboardType="decimal-pad"
          error={priceError}
        />

        <Checkbox
          checked={requiresPromotion}
          onToggle={setRequiresPromotion}
          accessibilityLabel="Este precio requiere una promoción o condición"
        >
          <Text style={styles.checkboxLabel}>Requiere promo, tarjeta, club o cantidad mínima</Text>
        </Checkbox>
        {requiresPromotion ? (
          <FormField
            label="Condición"
            value={promotionNote}
            onChangeText={setPromotionNote}
            placeholder="Ej: 20% con Banco X los martes"
            error={promotionError}
          />
        ) : null}

        <Checkbox checked={goodFaith} onToggle={setGoodFaith} accessibilityLabel="Declaro que reporto de buena fe" error={goodFaithError}>
          <Text style={styles.checkboxLabel}>Declaro que este es el precio real que vi, reportado de buena fe.</Text>
        </Checkbox>

        {formError ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {formError}
          </Text>
        ) : null}

        <AnimatedPressable
          accessibilityLabel="Enviar reporte de precio"
          onPress={() => void handleSubmit()}
          style={styles.submitButton}
        >
          <Text style={styles.submitLabel}>{isSubmitting ? "Enviando..." : "Enviar reporte"}</Text>
        </AnimatedPressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.base },
  content: { padding: spacing.lg, gap: spacing.md },
  header: { gap: spacing.xxs },
  title: { fontFamily: typography.heroTitle.fontFamily, fontSize: 20, color: colors.text.primary },
  subtitle: { fontFamily: typography.caption.fontFamily, fontSize: 13, color: colors.text.secondary },
  intro: { fontFamily: typography.body.fontFamily, fontSize: 14, lineHeight: 20, color: colors.text.secondary },
  checkboxLabel: { fontFamily: typography.bodyRegular.fontFamily, fontSize: 14, color: colors.text.primary, flex: 1 },
  error: { fontFamily: typography.body.fontFamily, fontSize: 14, color: colors.state.error },
  submitButton: {
    backgroundColor: colors.brand.navy,
    borderRadius: radii.lg,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    marginTop: spacing.sm,
  },
  submitLabel: { fontFamily: typography.title.fontFamily, fontWeight: "600", fontSize: 16, color: colors.text.onNavy },
});
