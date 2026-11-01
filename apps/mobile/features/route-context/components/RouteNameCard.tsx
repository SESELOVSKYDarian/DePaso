import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { Button } from "@/components/common/Button";
import { FormField } from "@/components/common/FormField";
import { makeStyles, useColors } from "@/lib/theme";

interface RouteNameCardProps {
  stopCount: number;
  /** nombre con el que ya está guardada esta misma ruta (si lo está) */
  savedName: string | null;
  /** lo que se está escribiendo (`null` = todavía nada) */
  name: string | null;
  isSaving: boolean;
  onChangeName: (value: string) => void;
  onSave: () => void;
}

/**
 * Arriba de "Armar ruta": el nombre de la ruta, siempre a la vista. Si esta misma ruta ya está
 * guardada lo dice y no vuelve a pedir el nombre; si no, se escribe y se guarda ahí mismo.
 */
export function RouteNameCard({ stopCount, savedName, name, isSaving, onChangeName, onSave }: RouteNameCardProps) {
  const styles = useStyles();
  const colors = useColors();

  if (savedName) {
    return (
      <View style={[styles.card, styles.saved]}>
        <Ionicons name="checkmark-circle" size={22} color={colors.brand.accentDark} />
        <View style={styles.savedText}>
          <Text style={styles.savedLabel}>RUTA GUARDADA</Text>
          <Text style={styles.savedName} numberOfLines={1}>
            {savedName}
          </Text>
        </View>
      </View>
    );
  }

  const canSave = stopCount >= 2 && Boolean(name?.trim());

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Ponele nombre a tu ruta</Text>
      <FormField
        label="Nombre de la ruta"
        value={name ?? ""}
        onChangeText={onChangeName}
        placeholder="Ej.: Trabajo → Casa, Ruta del sábado"
      />
      <Button
        label={isSaving ? "Guardando…" : "Guardar ruta"}
        variant="secondary"
        onPress={onSave}
        loading={isSaving}
        disabled={!canSave}
      />
      {stopCount < 2 ? <Text style={styles.hint}>Sumá al menos dos paradas para poder guardarla.</Text> : null}
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    card: {
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radii.xl,
      backgroundColor: colors.surface.primary,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    title: { fontFamily: typography.itemTitle.fontFamily, fontSize: 16, color: colors.text.primary },
    hint: { fontFamily: typography.caption.fontFamily, fontSize: 12, color: colors.text.secondary },
    saved: { flexDirection: "row", alignItems: "center", backgroundColor: colors.tint.green.bg, borderColor: colors.tint.green.border },
    savedText: { flex: 1 },
    savedLabel: { fontFamily: typography.caption.fontFamily, fontSize: 11, letterSpacing: 1, color: colors.brand.accentDark },
    savedName: { fontFamily: typography.itemTitle.fontFamily, fontSize: 16, color: colors.text.primary },
  }),
);
