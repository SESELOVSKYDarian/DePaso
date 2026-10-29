import { Ionicons } from "@expo/vector-icons";
import { Children, Fragment, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { makeStyles, useColors } from "@/lib/theme";

type IconName = keyof typeof Ionicons.glyphMap;

interface GroupedListProps {
  /** Título de la sección, encima del bloque. */
  title?: string;
  children: ReactNode;
}

/**
 * Bloque de filas agrupadas (estilo "Ajustes" de iOS/Android): una sola tarjeta con
 * separadores finos en vez de una píldora por fila. Menos ruido, más escaneable.
 */
export function GroupedList({ title, children }: GroupedListProps) {
  const styles = useStyles();
  const rows = Children.toArray(children);
  return (
    <View style={styles.section}>
      {title ? (
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
      ) : null}
      <View style={styles.card}>
        {rows.map((row, index) => (
          <Fragment key={index}>
            {index > 0 ? <View style={styles.divider} /> : null}
            {row}
          </Fragment>
        ))}
      </View>
    </View>
  );
}

interface GroupedRowProps {
  icon?: IconName;
  label: string;
  /** Texto secundario a la derecha (conteo, estado). */
  value?: string;
  onPress?: () => void;
  /** `accent` para acciones de marca (ej. cerrar sesión). */
  tone?: "default" | "accent";
  /** Reemplaza el chevron (ej. un check de selección). */
  trailing?: ReactNode;
  accessibilityLabel?: string;
  accessibilityState?: { selected?: boolean; checked?: boolean };
}

export function GroupedRow({
  icon,
  label,
  value,
  onPress,
  tone = "default",
  trailing,
  accessibilityLabel,
  accessibilityState,
}: GroupedRowProps) {
  const colors = useColors();
  const styles = useStyles();
  const tint = tone === "accent" ? colors.brand.accentDark : colors.text.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={accessibilityState}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
    >
      {icon ? (
        <View style={styles.iconTile}>
          <Ionicons name={icon} size={18} color={tint} />
        </View>
      ) : null}
      <Text style={[styles.label, tone === "accent" ? { color: tint } : null]} numberOfLines={2}>
        {label}
      </Text>
      {value ? (
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {trailing ?? <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />}
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => StyleSheet.create({
  section: {
    gap: spacing.xs,
  },
  title: {
    fontFamily: typography.itemTitle.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.primary,
    paddingHorizontal: spacing.xxs,
  },
  card: {
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radii.xl,
    overflow: "hidden",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.subtle,
    marginLeft: spacing.md + 32 + spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 56,
  },
  rowPressed: {
    backgroundColor: colors.surface.input,
  },
  iconTile: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    backgroundColor: colors.surface.input,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    flex: 1,
    fontFamily: typography.body.fontFamily,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text.primary,
  },
  value: {
    fontFamily: typography.subtitle.fontFamily,
    fontSize: 13,
    color: colors.text.secondary,
    flexShrink: 1,
  },
}));
