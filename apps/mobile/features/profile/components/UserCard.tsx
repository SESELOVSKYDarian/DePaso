import { StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { makeStyles } from "@/lib/theme";

/** Las iniciales para el círculo del perfil: dos letras del nombre o la primera del mail. */
export function initials(name: string | null, email: string): string {
  if (name) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }
  return email[0]?.toUpperCase() ?? "?";
}

/** Tarjeta de arriba del Perfil: círculo con iniciales, nombre y mail. */
export function UserCard({ name, email }: { name: string | null; email: string }) {
  const styles = useStyles();
  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarLabel}>{initials(name, email)}</Text>
      </View>
      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={1}>
          {name ?? "Sin nombre"}
        </Text>
        <Text style={styles.email} numberOfLines={1}>
          {email}
        </Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      backgroundColor: colors.surface.primary,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      borderRadius: radii.xl,
      padding: spacing.md,
    },
    avatar: { width: 52, height: 52, borderRadius: radii.full, backgroundColor: colors.brand.navy, alignItems: "center", justifyContent: "center" },
    avatarLabel: { fontFamily: typography.heroTitle.fontFamily, fontSize: 20, color: colors.text.onNavy },
    text: { flex: 1, gap: 2 },
    name: { fontFamily: typography.heroTitle.fontFamily, fontSize: 19, lineHeight: 24, color: colors.text.primary },
    email: { fontFamily: typography.subtitle.fontFamily, fontSize: 13, lineHeight: 18, color: colors.text.secondary },
  }),
);
