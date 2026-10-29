import { Ionicons } from "@expo/vector-icons";
import { useRef, useState, type ComponentRef } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { makeStyles, useColors } from "@/lib/theme";

interface PillInputProps extends TextInputProps {
  icon: keyof typeof Ionicons.glyphMap;
  error?: string;
  /** Muestra el toggle de mostrar/ocultar (sólo tiene sentido con `secureTextEntry`). */
  isPassword?: boolean;
}

/** Input tipo "pill" (sección de diseño de auth) — icono a la izquierda, sin label
 * separado (el placeholder cumple ese rol), radio completo. Distinto de `FormField`
 * (labeled, cuadrado) a propósito: los formularios de auth siguen una referencia visual
 * más suave/redondeada que el resto de la app. */
export function PillInput({ icon, error, isPassword = false, secureTextEntry, style, ...inputProps }: PillInputProps) {
  const colors = useColors();
  const styles = useStyles();
  const [reveal, setReveal] = useState(false);
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);

  return (
    <View style={styles.container}>
      {/* tocar cualquier parte de la píldora (ícono, bordes) lleva el cursor al campo */}
      <Pressable accessible={false} onPress={() => inputRef.current?.focus()} style={[styles.pill, error ? styles.pillError : null]}>
        <Ionicons name={icon} size={18} color={colors.text.muted} style={styles.leftIcon} />
        <TextInput
          ref={inputRef}
          style={[styles.input, style]}
          placeholderTextColor={colors.text.muted}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={isPassword ? !reveal : secureTextEntry}
          {...inputProps}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setReveal((r) => !r)}
            hitSlop={8}
            accessibilityLabel={reveal ? "Ocultar contraseña" : "Mostrar contraseña"}
            style={styles.rightIcon}
          >
            <Ionicons name={reveal ? "eye-off-outline" : "eye-outline"} size={18} color={colors.text.muted} />
          </Pressable>
        ) : null}
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const useStyles = makeStyles((colors) => StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 50,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.primary,
    paddingHorizontal: spacing.md,
  },
  pillError: {
    borderColor: colors.state.error,
  },
  leftIcon: {
    marginRight: spacing.xs,
  },
  rightIcon: {
    padding: spacing.xxs,
  },
  input: {
    flex: 1,
    fontFamily: typography.body.fontFamily,
    fontSize: 15,
    color: colors.text.primary,
    paddingVertical: 0,
    // el campo ocupa todo el alto de la píldora: el área donde se puede tocar es toda
    alignSelf: "stretch",
    minHeight: 48,
  },
  error: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.state.error,
    marginTop: spacing.xxs,
    marginLeft: spacing.md,
  },
}));
