import { ScrollView, Text, TextInput, View } from "react-native";
import { radii } from "@depaso/design-tokens";
import { Button } from "@/components/common/Button";
import { useColors } from "@/lib/theme";
import { useStyles } from "../styles";

interface TypingViewProps {
  text: string;
  onChangeText: (value: string) => void;
  error: string | undefined;
  isParsing: boolean;
  onSubmit: () => void;
  onSpeakInstead: () => void;
}

/** Pantalla de "escribir": un cuadro de texto libre y el botón que arma la lista. */
export function TypingView(props: TypingViewProps) {
  const colors = useColors();
  const styles = useStyles();

  return (
    <>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text accessibilityRole="header" style={styles.title}>
          Escribí lo que te falta
        </Text>
        <Text style={styles.subtitle}>De corrido, como te salga. Después te preguntamos las marcas.</Text>
        <TextInput
          value={props.text}
          onChangeText={props.onChangeText}
          placeholder="Necesito leche, dos gaseosas, yerba y fideos…"
          placeholderTextColor={colors.text.muted}
          multiline
          autoFocus
          textAlignVertical="top"
          maxLength={800}
          accessibilityLabel="Lo que necesitás comprar"
          style={styles.textArea}
        />
        {props.error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {props.error}
          </Text>
        ) : null}
      </ScrollView>
      <View style={styles.footer}>
        <Button
          label={props.isParsing ? "Armando tu lista..." : "Armar mi lista"}
          onPress={props.onSubmit}
          loading={props.isParsing}
          disabled={props.text.trim().length < 2}
          style={{ borderRadius: radii.full }}
        />
        <Button label="Mejor hablarlo" variant="ghost" onPress={props.onSpeakInstead} />
      </View>
    </>
  );
}
