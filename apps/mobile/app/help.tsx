import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { GroupedList, GroupedRow } from "@/components/GroupedList";
import { makeStyles, useColors } from "@/lib/theme";

const FAQ: { question: string; answer: string }[] = [
  {
    question: "¿Cómo armo mi mejor compra?",
    answer:
      "Armá una lista con lo que te falta, contanos por dónde andás hoy y tocá \"Encontrar mi mejor compra\" en Inicio. Comparamos precios y te mostramos tres planes: el más barato, el más rápido y el más equilibrado.",
  },
  {
    question: "¿De dónde salen los precios?",
    answer:
      "Del catálogo público de precios de comercios (SEPA), de los comercios que cargan los suyos y de reportes de la comunidad. Pueden no estar al día: por eso te avisamos cuándo se actualizó cada uno.",
  },
  {
    question: "Un precio está mal, ¿qué hago?",
    answer:
      "Cuando estés en modo compra, tocá \"Reportar\" al lado del precio y contanos cuánto lo viste. Así mejora para todos.",
  },
  {
    question: "¿Cómo comparto una lista?",
    answer:
      "Abrí la lista y, en \"Compartir\", escribí el email de alguien que ya use DePaso. Esa persona la ve y puede sumar o quitar productos.",
  },
  {
    question: "¿Cómo sumo las promos de mi banco o billetera?",
    answer:
      "En Perfil → Métodos de pago elegí los que usás. Descontamos sus promos válidas cuando armamos tu Top 3.",
  },
  {
    question: "¿Cómo borro mis datos o mi cuenta?",
    answer: "En Perfil → Privacidad y datos podés descargar tu información, borrar tus lugares o eliminar la cuenta.",
  },
];

/** Centro de ayuda: preguntas frecuentes y acceso a los textos legales. */
export default function HelpScreen() {
  const styles = useStyles();
  const colors = useColors();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.intro}>Lo que más nos preguntan. Si no está acá, probablemente lo veas en Privacidad y datos.</Text>

      <View style={styles.card}>
        {FAQ.map((item, index) => {
          const expanded = open === index;
          return (
            <View key={item.question} style={index > 0 ? styles.separated : null}>
              <AnimatedPressable
                accessibilityLabel={item.question}
                haptic={false}
                onPress={() => setOpen(expanded ? null : index)}
                style={styles.question}
              >
                <Text style={styles.questionText}>{item.question}</Text>
                <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color={colors.text.tertiary} />
              </AnimatedPressable>
              {expanded ? <Text style={styles.answer}>{item.answer}</Text> : null}
            </View>
          );
        })}
      </View>

      <GroupedList title="Textos legales">
        <GroupedRow icon="document-text-outline" label="Términos y Condiciones" onPress={() => router.push("/legal/terms")} />
        <GroupedRow icon="shield-checkmark-outline" label="Política de Privacidad" onPress={() => router.push("/legal/privacy")} />
        <GroupedRow icon="people-outline" label="Normas de la comunidad" onPress={() => router.push("/legal/community")} />
      </GroupedList>
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      backgroundColor: colors.surface.base,
      padding: spacing.lg,
      gap: spacing.lg,
    },
    intro: {
      fontFamily: typography.subtitle.fontFamily,
      fontSize: 14,
      lineHeight: 20,
      color: colors.text.secondary,
    },
    card: {
      backgroundColor: colors.surface.primary,
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      overflow: "hidden",
    },
    separated: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border.subtle,
    },
    question: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
      minHeight: 56,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    questionText: {
      flex: 1,
      fontFamily: typography.itemTitle.fontFamily,
      fontSize: 15,
      lineHeight: 20,
      color: colors.text.primary,
    },
    answer: {
      fontFamily: typography.subtitle.fontFamily,
      fontSize: 14,
      lineHeight: 20,
      color: colors.text.secondary,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
    },
  }),
);
