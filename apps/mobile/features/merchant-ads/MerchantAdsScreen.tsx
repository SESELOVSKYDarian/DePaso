import { Ionicons } from "@expo/vector-icons";
import { AD_PRICE_PER_DAY, MAX_ACTIVE_ADS } from "@depaso/validation";
import { Image } from "expo-image";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { BackToTopScrollView } from "@/components/common/BackToTop";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { Button } from "@/components/common/Button";
import { FormField } from "@/components/common/FormField";
import { makeStyles, useColors } from "@/lib/theme";
import { AdStatusCard, pesos } from "./AdStatusCard";
import { DURATIONS, useMerchantAds } from "./useMerchantAds";

/**
 * Publicidad del comercio: pedir que un producto aparezca en "Destacados" de Inicio o que una
 * tarjeta con su mensaje se muestre a todos. El comercio ofrece un monto y una duración; el equipo
 * de DePaso lo revisa, lo aprueba (puede acordar otro monto) o lo rechaza con un motivo.
 */
export default function MerchantAdsScreen() {
  const styles = useStyles();
  const colors = useColors();
  const data = useMerchantAds();
  const featured = data.kind === "FEATURED_PRODUCT";

  return (
    <BackToTopScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.intro}>
        Mostrá tu comercio a más gente. Elegí el formato, cuántos días y cuánto ofrecés (nunca menos del precio base por día); lo revisamos y te avisamos. Podés tener hasta {MAX_ACTIVE_ADS} publicidades a la vez.
      </Text>
      <Text style={[styles.slots, data.slotsLeft === 0 ? styles.slotsFull : null]}>
        {data.slotsLeft === 0 ? `Ya usaste tus ${MAX_ACTIVE_ADS} lugares.` : `Te ${data.slotsLeft === 1 ? "queda 1 lugar" : `quedan ${data.slotsLeft} lugares`} de ${MAX_ACTIVE_ADS}.`}
      </Text>

      <View style={styles.kinds}>
        {(
          [
            ["FEATURED_PRODUCT", "star-outline", "Producto destacado", "En Destacados de Inicio"],
            ["BANNER", "megaphone-outline", "Banner abajo", "Un mensaje al pie de Inicio"],
            ["IMAGE", "image-outline", "Imagen", "Una imagen entera en Inicio"],
            ["VIDEO", "videocam-outline", "Video", "Un video en Inicio"],
          ] as const
        ).map(([value, icon, title, sub]) => {
          const selected = data.kind === value;
          return (
            <AnimatedPressable key={value} accessibilityLabel={`${title}, ${pesos(AD_PRICE_PER_DAY[value])} por día`} haptic={false} onPress={() => data.chooseKind(value)} style={[styles.kind, selected ? styles.kindSelected : null]}>
              <Ionicons name={icon} size={22} color={selected ? colors.brand.navy : colors.text.secondary} />
              <Text style={styles.kindTitle}>{title}</Text>
              <Text style={styles.kindSub}>{sub}</Text>
              <Text style={styles.kindPrice}>{pesos(AD_PRICE_PER_DAY[value])} por día</Text>
            </AnimatedPressable>
          );
        })}
      </View>

      <FormField label="Título" value={data.title} onChangeText={data.setTitle} placeholder={featured ? "Ej.: El alfajor más rico del barrio" : "Ej.: Hoy 2x1 en el kiosco"} maxLength={80} />
      <FormField label="Mensaje (opcional)" value={data.message} onChangeText={data.setMessage} placeholder="Una o dos líneas para convencer" multiline maxLength={280} />

      {featured ? (
        <>
          <Text style={styles.label}>¿Qué producto destacás?</Text>
          {data.loading ? <ActivityIndicator color={colors.text.secondary} /> : null}
          {!data.loading && data.products.length === 0 ? <Text style={styles.empty}>Primero cargá productos con precio en “Mis productos y precios”.</Text> : null}
          <View style={styles.products}>
            {data.products.slice(0, 12).map((product) => {
              const selected = data.productId === product.productId;
              return (
                <Pressable
                  key={product.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`Destacar ${product.displayName ?? product.productName}`}
                  onPress={() => data.setProductId(product.productId)}
                  style={[styles.product, selected ? styles.productSelected : null]}
                >
                  <Ionicons name={selected ? "radio-button-on" : "radio-button-off"} size={20} color={selected ? colors.brand.navy : colors.text.tertiary} />
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.displayName ?? product.productName}
                  </Text>
                  <Text style={styles.productPrice}>{pesos(product.price)}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      {data.kind === "IMAGE" ? (
        <>
          <Text style={styles.label}>Tu imagen</Text>
          {data.imageData ? <Image source={{ uri: data.imageData }} accessibilityLabel="Vista previa de tu imagen" style={styles.preview} contentFit="cover" /> : null}
          <View style={styles.row}>
            <Button label={data.imageData ? "Cambiar imagen" : "Subir imagen"} variant="secondary" onPress={() => void data.pickImage()} style={{ flex: 1 }} />
            {data.imageData ? <Button label="Quitar" variant="ghost" onPress={data.clearImage} style={{ flex: 1 }} /> : null}
          </View>
        </>
      ) : null}

      {data.kind === "VIDEO" ? (
        <FormField label="Enlace del video" value={data.videoUrl} onChangeText={data.setVideoUrl} placeholder="https://…/mi-video.mp4" autoCapitalize="none" keyboardType="url" hint="Un enlace https directo a un archivo de video (.mp4)." />
      ) : null}

      <Text style={styles.label}>Cuánto ofrecés</Text>
      <FormField
        label="Monto en pesos"
        value={data.amount}
        onChangeText={data.setAmount}
        placeholder={String(data.baseAmount)}
        keyboardType="numeric"
        hint={`Precio base: ${pesos(data.baseAmount)} por ${data.days} días. Si lo dejás vacío ofrecés eso; podés ofrecer más para que te aprueben antes. El equipo puede proponerte otro monto.`}
      />
      <Text style={styles.label}>Por cuántos días</Text>
      <View style={styles.days}>
        {DURATIONS.map((value) => (
          <AnimatedPressable key={value} accessibilityLabel={`${value} días`} haptic={false} onPress={() => data.setDays(value)} style={[styles.dayChip, data.days === value ? styles.dayChipSelected : null]}>
            <Text style={[styles.dayText, data.days === value ? styles.dayTextSelected : null]}>{value} días</Text>
          </AnimatedPressable>
        ))}
      </View>

      {data.error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {data.error}
        </Text>
      ) : null}
      <Button label={data.sending ? "Enviando…" : "Pedir publicidad"} onPress={() => void data.send()} loading={data.sending} />

      <Text style={styles.section}>Mis pedidos</Text>
      {!data.loading && data.ads.length === 0 ? <Text style={styles.empty}>Todavía no pediste publicidad.</Text> : null}
      {data.ads.map((ad) => (
        <AdStatusCard key={ad.id} ad={ad}>
          {ad.status === "PENDING" ? (
            <AnimatedPressable accessibilityLabel="Cancelar el pedido" haptic={false} onPress={() => void data.cancel(ad)} style={styles.cancel}>
              <Text style={styles.cancelText}>Cancelar pedido</Text>
            </AnimatedPressable>
          ) : null}
        </AdStatusCard>
      ))}
    </BackToTopScrollView>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    container: { flexGrow: 1, backgroundColor: colors.surface.base, padding: spacing.lg, gap: spacing.md },
    intro: { fontFamily: typography.subtitle.fontFamily, fontSize: 14, lineHeight: 20, color: colors.text.secondary },
    slots: { fontFamily: typography.itemTitle.fontFamily, fontSize: 13, color: colors.text.secondary },
    slotsFull: { color: colors.state.errorStrong },
    kinds: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
    kindPrice: { fontFamily: typography.itemTitle.fontFamily, fontSize: 12, color: colors.brand.route, marginTop: 2 },
    preview: { width: "100%", aspectRatio: 4 / 5, maxHeight: 360, borderRadius: radii.xl, backgroundColor: colors.surface.input },
    row: { flexDirection: "row", gap: spacing.sm },
    kind: { flexBasis: "47%", flexGrow: 1, gap: 4, padding: spacing.md, borderRadius: radii.xl, backgroundColor: colors.surface.primary, borderWidth: 1, borderColor: colors.border.subtle },
    kindSelected: { borderColor: colors.brand.navy, borderWidth: 2, backgroundColor: colors.tint.blue.bg },
    kindTitle: { fontFamily: typography.itemTitle.fontFamily, fontSize: 14, color: colors.text.primary },
    kindSub: { fontFamily: typography.caption.fontFamily, fontSize: 12, lineHeight: 16, color: colors.text.secondary },
    label: { fontFamily: typography.itemTitle.fontFamily, fontSize: 14, color: colors.text.primary },
    section: { fontFamily: typography.itemTitle.fontFamily, fontSize: 16, color: colors.text.primary, marginTop: spacing.md },
    empty: { fontFamily: typography.body.fontFamily, fontSize: 14, color: colors.text.secondary },
    products: { gap: spacing.xs },
    product: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: 52, paddingHorizontal: spacing.md, borderRadius: radii.lg, backgroundColor: colors.surface.primary, borderWidth: 1, borderColor: colors.border.subtle },
    productSelected: { borderColor: colors.brand.navy, borderWidth: 2 },
    productName: { flex: 1, fontFamily: typography.body.fontFamily, fontSize: 14, color: colors.text.primary },
    productPrice: { fontFamily: typography.itemTitle.fontFamily, fontSize: 14, color: colors.text.primary },
    days: { flexDirection: "row", gap: spacing.sm },
    dayChip: { flex: 1, minHeight: 46, alignItems: "center", justifyContent: "center", borderRadius: radii.full, backgroundColor: colors.surface.primary, borderWidth: 1, borderColor: colors.border.subtle },
    dayChipSelected: { backgroundColor: colors.brand.navy, borderColor: colors.brand.navy },
    dayText: { fontFamily: typography.itemTitle.fontFamily, fontSize: 14, color: colors.text.primary },
    dayTextSelected: { color: colors.text.onNavy },
    error: { fontFamily: typography.caption.fontFamily, fontSize: 13, color: colors.state.errorStrong },
    cancel: { alignSelf: "flex-start", minHeight: 44, justifyContent: "center", marginTop: 2 },
    cancelText: { fontFamily: typography.itemTitle.fontFamily, fontSize: 14, color: colors.state.errorStrong },
  }),
);
