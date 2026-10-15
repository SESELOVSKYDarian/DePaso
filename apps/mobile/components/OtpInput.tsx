import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { makeStyles } from "@/lib/theme";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Cantidad de dígitos. Se muestran en dos grupos para leerlos de a cuatro. */
  length?: number;
  error?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  accessibilityLabel?: string;
}

/**
 * Código de un solo uso. Es UN input real (no ocho): así funcionan el pegado, el
 * autocompletado del mail/SMS y los gestores de contraseñas. Las casillas son sólo la vista.
 */
export function OtpInput({
  value,
  onChange,
  length = 8,
  error = false,
  disabled = false,
  autoFocus = false,
  accessibilityLabel = "Código de verificación",
}: OtpInputProps) {
  const styles = useStyles();
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const groupSize = length % 4 === 0 ? 4 : length;
  const cells = Array.from({ length }, (_, index) => index);

  return (
    <Pressable
      accessible={false}
      onPress={() => inputRef.current?.focus()}
      disabled={disabled}
      style={styles.wrapper}
    >
      <View style={styles.row} pointerEvents="none">
        {cells.map((index) => {
          const char = value[index] ?? "";
          const isActive = focused && !disabled && index === Math.min(value.length, length - 1);
          return (
            <View
              key={index}
              style={[
                styles.cell,
                index > 0 && index % groupSize === 0 ? styles.groupGap : null,
                isActive ? styles.cellActive : null,
                char ? styles.cellFilled : null,
                error ? styles.cellError : null,
              ]}
            >
              <Text style={styles.digit}>{char}</Text>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => onChange(text.replace(/\D/g, "").slice(0, length))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        editable={!disabled}
        autoFocus={autoFocus}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={length}
        caretHidden
        accessibilityLabel={accessibilityLabel}
        style={styles.hiddenInput}
      />
    </Pressable>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    wrapper: {
      position: "relative",
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: spacing.xs,
    },
    cell: {
      flex: 1,
      height: 56,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      backgroundColor: colors.surface.input,
      alignItems: "center",
      justifyContent: "center",
    },
    groupGap: {
      marginLeft: spacing.sm,
    },
    cellFilled: {
      borderColor: colors.border.strong,
    },
    cellActive: {
      borderColor: colors.text.primary,
      borderWidth: 2,
    },
    cellError: {
      borderColor: colors.state.errorStrong,
      borderWidth: 2,
    },
    digit: {
      fontFamily: typography.heroTitle.fontFamily,
      fontSize: 22,
      color: colors.text.primary,
    },
    // Cubre las casillas y es transparente: recibe el foco, el pegado y el autocompletado.
    hiddenInput: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      opacity: 0.02,
      color: "transparent",
    },
  }),
);
