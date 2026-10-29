import type { AssistantResponse } from "@depaso/validation";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useToast } from "@/components/common/Toast";
import { assistantClient, productsClient } from "@/lib/apiClient";
import { useLists } from "@/lib/lists/ListsContext";
import { transcribeRecording, TranscribeError } from "@/lib/voice/transcribe";
import { useVoiceRecorder } from "@/lib/voice/useVoiceRecorder";
import { ReviewView } from "./components/ReviewView";
import { TypingView } from "./components/TypingView";
import { VoiceView } from "./components/VoiceView";
import { parseErrorMessage, voiceErrorMessage } from "./helpers";
import { useStyles } from "./styles";
import type { Mode, Phase, ReviewItem } from "./types";
import { usePulseRing } from "./usePulseRing";

/**
 * Armar la lista hablando: se toca el micrófono, se dice todo lo que falta, la IA lo separa en
 * productos y por cada uno se elige la marca o "me da igual". También se puede escribir.
 * Si llega con `autoStart=1` (viene del botón de IA de la lista) empieza a grabar enseguida.
 */
export default function ShoppingAssistantScreen() {
  const styles = useStyles();
  const { listId, autoStart } = useLocalSearchParams<{ listId: string; autoStart?: string }>();
  const { addItem } = useLists();
  const { show: showToast } = useToast();

  const [mode, setMode] = useState<Mode>("voice");
  const [phase, setPhase] = useState<Phase>("idle");
  const [text, setText] = useState("");
  const [heard, setHeard] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [micDenied, setMicDenied] = useState(false);
  const [source, setSource] = useState<AssistantResponse["source"]>("ai");
  const [review, setReview] = useState<ReviewItem[] | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const autoStarted = useRef(false);

  const isBusy = phase === "transcribing" || phase === "parsing";
  const isRecording = phase === "recording";
  const pulseStyle = usePulseRing(isRecording);

  // mando el texto a la IA y armo la lista a revisar
  const parseText = useCallback(async (value: string) => {
    setError(undefined);
    setPhase("parsing");
    try {
      const response = await assistantClient.parse({ text: value.trim() });
      setSource(response.source);
      setHeard(value.trim());
      setReview(
        response.items.map((item) => ({
          item,
          quantity: item.quantity,
          brandId: null,
          product: item.candidates[0] ?? null,
          loading: false,
          removed: false,
          picking: false,
        })),
      );
      setMode("review");
    } catch (err) {
      setError(parseErrorMessage(err));
    } finally {
      setPhase("idle");
    }
  }, []);

  // paso la grabación a texto y la mando a parsear
  const handleRecording = useCallback(
    async (uri: string | null) => {
      if (!uri) {
        setPhase("idle");
        setError("No se pudo guardar la grabación. Probá de nuevo.");
        return;
      }
      setPhase("transcribing");
      try {
        const transcript = await transcribeRecording(uri);
        await parseText(transcript);
      } catch (err) {
        setPhase("idle");
        setError(voiceErrorMessage(err));
        if (err instanceof TranscribeError && err.reason === "not_configured") setMode("typing");
      }
    },
    [parseText],
  );

  const recorder = useVoiceRecorder(handleRecording);

  const startRecording = useCallback(async () => {
    setError(undefined);
    setMicDenied(false);
    const result = await recorder.start();
    if (result === "started") {
      setPhase("recording");
    } else if (result === "denied") {
      setMicDenied(true);
      setError("Necesitamos permiso para usar el micrófono.");
    } else {
      setError("No pudimos empezar a grabar. Probá de nuevo o escribilo.");
    }
  }, [recorder]);

  const stopRecording = useCallback(async () => {
    const uri = await recorder.stop();
    await handleRecording(uri);
  }, [recorder, handleRecording]);

  // Viene del botón de IA de la lista: arranca a escuchar sin un toque extra.
  useEffect(() => {
    if (autoStart === "1" && !autoStarted.current) {
      autoStarted.current = true;
      void startRecording();
    }
  }, [autoStart, startRecording]);

  // cambio un producto de la revisión (cantidad, marca, quitar...)
  const update = (id: string, patch: Partial<ReviewItem>) =>
    setReview((current) => current?.map((entry) => (entry.item.id === id ? { ...entry, ...patch } : entry)) ?? null);

  // elijo una marca y busco el producto de esa marca
  const pickBrand = async (entry: ReviewItem, brandId: string | null) => {
    if (entry.brandId === brandId) return;
    if (brandId === null) {
      update(entry.item.id, { brandId: null, product: entry.item.candidates[0] ?? null, loading: false });
      return;
    }
    update(entry.item.id, { brandId, loading: true });
    try {
      const { results } = await productsClient.search(entry.item.term, { type: entry.item.typeId ?? undefined, brandId });
      update(entry.item.id, { product: results[0] ?? null, loading: false });
    } catch {
      update(entry.item.id, { product: null, loading: false });
    }
  };

  const addable = (review ?? []).filter((entry) => !entry.removed && entry.product);

  // agrego a la lista todo lo que se pudo resolver
  const handleAddAll = async () => {
    setIsAdding(true);
    let added = 0;
    for (const entry of addable) {
      try {
        await addItem(listId, { productId: entry.product!.id, quantity: entry.quantity });
        added += 1;
      } catch {
        // Se sigue con el resto: un producto que falla no debe frenar la lista entera.
      }
    }
    setIsAdding(false);
    if (added === 0) {
      showToast("No pudimos agregar los productos. Probá de nuevo.", "error");
      return;
    }
    showToast(`Anotados ${added} ${added === 1 ? "producto" : "productos"}. Que no se te pase.`, "success");
    router.dismissTo({ pathname: "/lists/[id]", params: { id: listId } });
  };

  const voiceTitle = isRecording
    ? "Te escucho…"
    : phase === "transcribing"
      ? "Pasando tu voz a texto…"
      : phase === "parsing"
        ? "Armando tu lista…"
        : "Decime lo que te falta";
  const voiceHint = isRecording
    ? "Tocá el botón cuando termines."
    : isBusy
      ? "Un momento."
      : "Tocá el micrófono y nombrá todo de corrido. Después elegís las marcas.";

  const goTo = (next: Mode) => {
    setError(undefined);
    setMode(next);
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        {mode === "voice" ? (
          <VoiceView
            title={voiceTitle}
            hint={voiceHint}
            level={recorder.level}
            durationMs={recorder.durationMs}
            isRecording={isRecording}
            isBusy={isBusy}
            pulseStyle={pulseStyle}
            error={error}
            micDenied={micDenied}
            onToggleRecording={() => void (isRecording ? stopRecording() : startRecording())}
            onWriteInstead={() => goTo("typing")}
          />
        ) : mode === "typing" ? (
          <TypingView
            text={text}
            onChangeText={(value) => {
              setText(value);
              if (error) setError(undefined);
            }}
            error={error}
            isParsing={phase === "parsing"}
            onSubmit={() => void parseText(text)}
            onSpeakInstead={() => goTo("voice")}
          />
        ) : (
          <ReviewView
            heard={heard}
            source={source}
            review={review ?? []}
            addableCount={addable.length}
            isAdding={isAdding}
            onCorrectText={() => {
              setText(heard ?? "");
              setReview(null);
              goTo("typing");
            }}
            onUpdate={update}
            onPickBrand={(entry, brandId) => void pickBrand(entry, brandId)}
            onAddAll={() => void handleAddAll()}
            onRedo={() => {
              setReview(null);
              setHeard(null);
              goTo("voice");
            }}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
