import { Ionicons } from "@expo/vector-icons";
import { useState, type Ref } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { makeStyles, useColors } from "@/lib/theme";

interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  /** Muestra el toggle de mostrar/ocultar (sólo tiene sentido con `secureTextEntry`). */
  isPassword?: boolean;
  /** Referencia al TextInput interno (para pasar el foco al siguiente campo). */
  inputRef?: Ref<TextInput>;
}

export function FormField({
  label,
  error,
  hint,
  isPassword = false,
  secureTextEntry,
  style,
  inputRef,
  ...inputProps
}: FormFieldProps) {
  const colors = useColors();
  const styles = useStyles();
  const [reveal, setReveal] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          style={[styles.input, isPassword ? styles.inputWithIcon : null, error ? styles.inputError : null, style]}
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
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const useStyles = makeStyles((colors) => StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: spacing.xxs,
  },
  inputRow: {
    position: "relative",
    justifyContent: "center",
  },
  input: {
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.input,
    paddingHorizontal: spacing.md,
    fontFamily: typography.subtitle.fontFamily,
    fontSize: 14,
    color: colors.text.primary,
  },
  inputWithIcon: {
    paddingRight: spacing.xl,
  },
  inputError: {
    borderColor: colors.state.error,
  },
  rightIcon: {
    position: "absolute",
    right: spacing.sm,
    padding: spacing.xxs,
  },
  error: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.state.error,
    marginTop: spacing.xxs,
  },
  hint: {
    fontFamily: typography.legal.fontFamily,
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
}));
