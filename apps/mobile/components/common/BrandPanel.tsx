import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { useBreakpoint } from "@/lib/responsive/useBreakpoint";
import { makeStyles, useColors } from "@/lib/theme";
import { BrandLogo } from "./BrandLogo";
import { Illustration } from "./Illustration";

/** Lo que DePaso hace por vos, en tres líneas. */
const BENEFITS = [
  { icon: "list-outline", title: "Armá tu lista", text: "Sumá lo que te falta, buscando o hablándole a la IA." },
  { icon: "navigate-outline", title: "Contanos tu recorrido", text: "Por dónde andás hoy, y te armamos la compra de paso." },
  { icon: "pricetag-outline", title: "Pagá menos", text: "Los mejores precios y tus promos, ya descontadas." },
] as const;

/**
 * Mitad izquierda de las pantallas de ingreso en una computadora: el logo, el mensaje de marca,
 * la ilustración y lo que ofrece la app. En el celular no se usa (el formulario ocupa todo).
 */
export function BrandPanel() {
  const styles = useStyles();
  const colors = useColors();
  // la ilustración se achica si la pantalla es baja, para que entren los tres beneficios sin scroll
  const { height } = useBreakpoint();
  const illustrationHeight = Math.max(110, Math.min(300, height - 580));
  return (
    <View style={styles.panel}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BrandLogo variant="wordmark" style={styles.logo} />

        <Text style={styles.title}>Tu compra,{"\n"}en el camino.</Text>
        <Text style={styles.subtitle}>Encontrá los mejores precios en los comercios que te quedan de paso.</Text>

        <Illustration
          source={require("@/assets/images/bienvenida.png")}
          darkSource={require("@/assets/images/bienvenida-dark.png")}
          style={[styles.illustration, { height: illustrationHeight }]}
          resizeMode="contain"
        />

        <View style={styles.benefits}>
          {BENEFITS.map((benefit) => (
            <View key={benefit.title} style={styles.benefit}>
              <View style={styles.benefitIcon}>
                <Ionicons name={benefit.icon} size={20} color={colors.brand.route} />
              </View>
              <View style={styles.benefitText}>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitDetail}>{benefit.text}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    panel: { flex: 1, backgroundColor: colors.surface.primary, borderRightWidth: 1, borderRightColor: colors.border.subtle },
    content: { flexGrow: 1, justifyContent: "center", padding: spacing.xl, gap: spacing.md, maxWidth: 680, width: "100%", alignSelf: "center" },
    logo: { width: 240, height: 64, alignSelf: "flex-start" },
    title: { fontFamily: typography.heroTitle.fontFamily, fontSize: 46, lineHeight: 54, color: colors.text.primary },
    subtitle: { fontFamily: typography.body.fontFamily, fontSize: 18, lineHeight: 27, color: colors.text.secondary, maxWidth: 520 },
    illustration: { width: "100%" },
    benefits: { gap: spacing.md },
    benefit: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    benefitIcon: { width: 44, height: 44, borderRadius: radii.full, alignItems: "center", justifyContent: "center", backgroundColor: colors.tint.blue.bg },
    benefitText: { flex: 1, gap: 2 },
    benefitTitle: { fontFamily: typography.itemTitle.fontFamily, fontSize: 16, color: colors.text.primary },
    benefitDetail: { fontFamily: typography.body.fontFamily, fontSize: 14, lineHeight: 20, color: colors.text.secondary },
  }),
);