import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { Button } from "@/components/common/Button";
import { Waveform } from "@/components/common/Waveform";
import { useColors } from "@/lib/theme";
import { formatClock } from "../helpers";
import { useStyles } from "../styles";

interface VoiceViewProps {
  title: string;
  hint: string;
  level: number;
  durationMs: number;
  isRecording: boolean;
  isBusy: boolean;
  /** estilo animado del anillo que late mientras se graba */
  pulseStyle: object;
  error: string | undefined;
  micDenied: boolean;
  onToggleRecording: () => void;
  onWriteInstead: () => void;
}

/** Pantalla de "hablar": micrófono grande, onda de voz y el reloj de la grabación. */
export function VoiceView(props: VoiceViewProps) {
  const colors = useColors();
  const styles = useStyles();
  const { isRecording, isBusy } = props;

  return (
    <ScrollView contentContainerStyle={styles.voiceContent} keyboardShouldPersistTaps="handled">
      <Text accessibilityRole="header" style={styles.voiceTitle}>
        {props.title}
      </Text>
      <Text style={styles.voiceHint}>{props.hint}</Text>

      <View style={styles.waveWrap}>
        <Waveform level={props.level} tick={props.durationMs} active={isRecording} />
      </View>

      <View style={styles.micWrap}>
        <Animated.View pointerEvents="none" style={[styles.pulseRing, props.pulseStyle]} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isRecording ? "Terminar de grabar" : "Empezar a grabar"}
          disabled={isBusy}
          onPress={props.onToggleRecording}
          style={({ pressed }) => [styles.micButton, isBusy ? styles.micButtonBusy : null, pressed ? styles.micPressed : null]}
        >
          {isBusy ? (
            <ActivityIndicator color={colors.text.onNavy} />
          ) : (
            <Ionicons name={isRecording ? "stop" : "mic"} size={40} color={colors.text.onNavy} />
          )}
        </Pressable>
      </View>

      <Text style={styles.clock}>{isRecording ? formatClock(props.durationMs) : " "}</Text>

      {props.error ? (
        <View style={styles.errorBox}>
          <Text accessibilityRole="alert" style={styles.error}>
            {props.error}
          </Text>
          {props.micDenied ? (
            <Button label="Abrir ajustes" variant="secondary" onPress={() => void Linking.openSettings()} />
          ) : null}
        </View>
      ) : null}

      <Button label="Prefiero escribir" variant="ghost" disabled={isBusy || isRecording} onPress={props.onWriteInstead} />
    </ScrollView>
  );
}
