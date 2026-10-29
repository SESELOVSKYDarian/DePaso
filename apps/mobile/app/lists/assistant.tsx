import { Ionicons } from "@expo/vector-icons";
import { ApiError } from "@depaso/api-client";
import type { AssistantItem, AssistantResponse, ProductSearchResult } from "@depaso/validation";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { Button } from "@/components/common/Button";
import { useToast } from "@/components/common/Toast";
import { assistantClient, productsClient } from "@/lib/apiClient";
import { useLists } from "@/lib/lists/ListsContext";
import { makeStyles, useColors } from "@/lib/theme";
import { transcribeRecording, TranscribeError } from "@/lib/voice/transcribe";
import { useVoiceRecorder } from "@/lib/voice/useVoiceRecorder";
import { Waveform } from "@/components/common/Waveform";

interface ReviewItem {
  item: AssistantItem;
  quantity: number;
  /** `null` = "me da igual la marca". */
  brandId: string | null;
  product: ProductSearchResult | null;
  loading: boolean;
  removed: boolean;
  /** Mostrando el buscador para elegir otro producto. */
  picking: boolean;
}

type Mode = "voice" | "typing" | "review";
type Phase = "idle" | "recording" | "transcribing" | "parsing";

/** Buscador chico para cambiar el producto elegido, o buscarlo a mano si no se encontró. */
function ProductPicker({
  initialQuery,
  typeId,
  onPick,
  onClose,
}: {
  initialQuery: string;
  typeId: string | null;
  onPick: (product: ProductSearchResult) => void;
  onClose: () => void;
}) {
  const colors = useColors();
  const styles = useStyles();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<ProductSearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) {
      setResults(null);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(() => {
      productsClient
        .search(value, typeId && value === initialQuery ? { type: typeId } : {})
        .then((response) => {
          if (!cancelled) setResults(response.results.slice(0, 6));
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, typeId, initialQuery]);

  return (
    <View style={styles.picker}>
      <View style={styles.pickerInputRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar producto o marca"
          placeholderTextColor={colors.text.muted}
          autoFocus
          returnKeyType="search"
          accessibilityLabel="Buscar producto"
          style={styles.pickerInput}
        />
        <Pressable accessibilityLabel="Cerrar búsqueda" hitSlop={10} onPress={onClose}>
          <Text style={styles.remove}>Cerrar</Text>
        </Pressable>
      </View>
      {searching ? <ActivityIndicator size="small" color={colors.text.secondary} /> : null}
      {results && results.length === 0 && !searching ? (
        <Text style={styles.resultMissing}>No encontramos nada con eso. Probá con otra palabra.</Text>
      ) : null}
      {(results ?? []).map((product) => (
        <Pressable
          key={product.id}
          accessibilityRole="button"
          accessibilityLabel={`Elegir ${product.name}`}
          onPress={() => onPick(product)}
          style={({ pressed }) => [styles.pickerRow, pressed ? styles.micPressed : null]}
        >
          <Text style={styles.resultName} numberOfLines={2}>
            {product.name}
          </Text>
          {product.brandName ? <Text style={styles.resultText}>{product.brandName}</Text> : null}
        </Pressable>
      ))}
    </View>
  );
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatClock(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function parseErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const code = (error.body as { error?: string } | null)?.error;
    if (code === "RATE_LIMITED") return "Pediste muchas listas seguidas. Probá de nuevo en unos minutos.";
    if (code === "NOTHING_UNDERSTOOD") return "No entendimos qué necesitás. Probá nombrando los productos.";
    return `No pudimos armar tu lista (error ${error.status}). Probá de nuevo.`;
  }
  return "No pudimos conectar. Revisá tu conexión e intentá de nuevo.";
}

function voiceErrorMessage(error: unknown): string {
  if (error instanceof TranscribeError) {
    if (error.reason === "not_configured") return "La voz todavía no está activada en el servidor. Podés escribirlo.";
    if (error.reason === "rate_limited") return "Hiciste muchos pedidos seguidos. Probá de nuevo en unos minutos.";
    if (error.reason === "too_large") return "El audio quedó muy largo. Probá con una lista más corta.";

    const detail = error.detail ?? "";
    const code = detail ? ` (código: ${detail})` : "";
    if (detail === "empty_transcript") return "No te escuchamos. Hablá más cerca del micrófono y probá de nuevo.";
    if (detail === "upstream_401" || detail === "upstream_403") {
      return `El servicio de voz rechazó la clave. Escribilo por ahora${code}.`;
    }
    if (detail === "upstream_429") return `El servicio de voz está saturado. Probá en un minuto${code}.`;
    if (detail.startsWith("no_connection") || detail === "network") {
      return `No pudimos conectar con el servidor. Revisá tu conexión${code}.`;
    }
    if (detail.startsWith("file_read")) {
      return `No pudimos leer la grabación. Probá de nuevo${code}.`;
    }
    return `No pudimos entender el audio. Probá de nuevo o escribilo${code}.`;
  }
  return "No pudimos entender el audio. Probá de nuevo o escribilo.";
}

/**
 * Armar la lista hablando: se toca el micrófono, se dice todo lo que falta, la IA lo separa en
 * productos y por cada uno se elige la marca o "me da igual". También se puede escribir.
 * Si llega con `autoStart=1` (viene del botón de IA de la lista) empieza a grabar enseguida.
 */
export default function ShoppingAssistantScreen() {
  const colors = useColors();
  const styles = useStyles();
  const reducedMotion = useReducedMotion();
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

  const pulse = useSharedValue(0);
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.35 * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * 0.55 }],
  }));

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
        const message = voiceErrorMessage(err);
        setError(message);
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

  // Anillo que late mientras se graba (quieto si el sistema pide reducir movimiento).
  useEffect(() => {
    if (phase === "recording" && !reducedMotion) {
      pulse.value = 0;
      pulse.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.out(Easing.quad) }), -1, false);
    } else {
      cancelAnimation(pulse);
      pulse.value = 0;
    }
  }, [phase, reducedMotion, pulse]);

  const update = (id: string, patch: Partial<ReviewItem>) =>
    setReview((current) => current?.map((entry) => (entry.item.id === id ? { ...entry, ...patch } : entry)) ?? null);

  const pickBrand = async (entry: ReviewItem, brandId: string | null) => {
    if (entry.brandId === brandId) return;
    if (brandId === null) {
      update(entry.item.id, { brandId: null, product: entry.item.candidates[0] ?? null, loading: false });
      return;
    }
    update(entry.item.id, { brandId, loading: true });
    try {
      const { results } = await productsClient.search(entry.item.term, {
        type: entry.item.typeId ?? undefined,
        brandId,
      });
      update(entry.item.id, { product: results[0] ?? null, loading: false });
    } catch {
      update(entry.item.id, { product: null, loading: false });
    }
  };

  const addable = (review ?? []).filter((entry) => !entry.removed && entry.product);

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

  const isBusy = phase === "transcribing" || phase === "parsing";
  const isRecording = phase === "recording";

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

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        {mode === "voice" ? (
          <ScrollView contentContainerStyle={styles.voiceContent} keyboardShouldPersistTaps="handled">
            <Text accessibilityRole="header" style={styles.voiceTitle}>
              {voiceTitle}
            </Text>
            <Text style={styles.voiceHint}>{voiceHint}</Text>

            <View style={styles.waveWrap}>
              <Waveform level={recorder.level} tick={recorder.durationMs} active={isRecording} />
            </View>

            <View style={styles.micWrap}>
              <Animated.View pointerEvents="none" style={[styles.pulseRing, pulseStyle]} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={isRecording ? "Terminar de grabar" : "Empezar a grabar"}
                disabled={isBusy}
                onPress={() => void (isRecording ? stopRecording() : startRecording())}
                style={({ pressed }) => [styles.micButton, isBusy ? styles.micButtonBusy : null, pressed ? styles.micPressed : null]}
              >
                {isBusy ? (
                  <ActivityIndicator color={colors.text.onNavy} />
                ) : (
                  <Ionicons name={isRecording ? "stop" : "mic"} size={40} color={colors.text.onNavy} />
                )}
              </Pressable>
            </View>

            <Text style={styles.clock}>{isRecording ? formatClock(recorder.durationMs) : " "}</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text accessibilityRole="alert" style={styles.error}>
                  {error}
                </Text>
                {micDenied ? (
                  <Button label="Abrir ajustes" variant="secondary" onPress={() => void Linking.openSettings()} />
                ) : null}
              </View>
            ) : null}

            <Button
              label="Prefiero escribir"
              variant="ghost"
              disabled={isBusy || isRecording}
              onPress={() => {
                setError(undefined);
                setMode("typing");
              }}
            />
          </ScrollView>
        ) : mode === "typing" ? (
          <>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
              <Text accessibilityRole="header" style={styles.title}>
                Escribí lo que te falta
              </Text>
              <Text style={styles.subtitle}>De corrido, como te salga. Después te preguntamos las marcas.</Text>
              <TextInput
                value={text}
                onChangeText={(value) => {
                  setText(value);
                  if (error) setError(undefined);
                }}
                placeholder="Necesito leche, dos gaseosas, yerba y fideos…"
                placeholderTextColor={colors.text.muted}
                multiline
                autoFocus
                textAlignVertical="top"
                maxLength={800}
                accessibilityLabel="Lo que necesitás comprar"
                style={styles.textArea}
              />
              {error ? (
                <Text accessibilityRole="alert" style={styles.error}>
                  {error}
                </Text>
              ) : null}
            </ScrollView>
            <View style={styles.footer}>
              <Button
                label={phase === "parsing" ? "Armando tu lista..." : "Armar mi lista"}
                onPress={() => void parseText(text)}
                loading={phase === "parsing"}
                disabled={text.trim().length < 2}
                style={{ borderRadius: radii.full }}
              />
              <Button
                label="Mejor hablarlo"
                variant="ghost"
                onPress={() => {
                  setError(undefined);
                  setMode("voice");
                }}
              />
            </View>
          </>
        ) : (
          <>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
              <Text accessibilityRole="header" style={styles.title}>
                Esto entendimos
              </Text>
              {heard ? (
                <View style={styles.heardBox}>
                  <View style={styles.heardHeader}>
                    <Text style={styles.heardLabel}>Dijiste</Text>
                    <Pressable
                      accessibilityLabel="Corregir lo que dijiste"
                      hitSlop={10}
                      onPress={() => {
                        setText(heard);
                        setReview(null);
                        setError(undefined);
                        setMode("typing");
                      }}
                    >
                      <Text style={styles.remove}>Corregir</Text>
                    </Pressable>
                  </View>
                  <Text style={styles.heardText}>{heard}</Text>
                </View>
              ) : null}
              <Text style={styles.subtitle}>
                {source === "fallback"
                  ? "Lo armamos en modo básico: revisá bien cada producto."
                  : "Elegí la marca de cada uno, o dejá “Me da igual”."}
              </Text>

              {(review ?? []).map((entry) =>
                entry.removed ? null : (
                  <View key={entry.item.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle} numberOfLines={2}>
                        {capitalize(entry.item.term)}
                      </Text>
                      <View style={styles.stepper}>
                        <Pressable
                          accessibilityLabel={`Restar uno a ${entry.item.term}`}
                          hitSlop={8}
                          onPress={() => update(entry.item.id, { quantity: Math.max(1, entry.quantity - 1) })}
                          style={styles.stepperButton}
                        >
                          <Ionicons name="remove" size={18} color={colors.text.primary} />
                        </Pressable>
                        <Text style={styles.quantity}>{entry.quantity}</Text>
                        <Pressable
                          accessibilityLabel={`Sumar uno a ${entry.item.term}`}
                          hitSlop={8}
                          onPress={() => update(entry.item.id, { quantity: Math.min(99, entry.quantity + 1) })}
                          style={styles.stepperButton}
                        >
                          <Ionicons name="add" size={18} color={colors.text.primary} />
                        </Pressable>
                      </View>
                    </View>

                    {entry.item.brands.length > 0 ? (
                      <>
                        <Text style={styles.question}>¿De qué marca?</Text>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.chipRow}
                          keyboardShouldPersistTaps="handled"
                        >
                          {[{ id: null as string | null, name: "Me da igual" }, ...entry.item.brands].map((brand) => {
                            const selected = entry.brandId === brand.id;
                            return (
                              <AnimatedPressable
                                key={brand.id ?? "any"}
                                accessibilityLabel={brand.name}
                                haptic={false}
                                onPress={() => void pickBrand(entry, brand.id)}
                                style={[styles.chip, selected ? styles.chipSelected : null]}
                              >
                                <Text style={[styles.chipLabel, selected ? styles.chipLabelSelected : null]}>
                                  {brand.name}
                                </Text>
                              </AnimatedPressable>
                            );
                          })}
                        </ScrollView>
                      </>
                    ) : null}

                    <View style={styles.result}>
                      {entry.loading ? (
                        <ActivityIndicator size="small" color={colors.text.secondary} />
                      ) : entry.product ? (
                        <Text style={styles.resultText} numberOfLines={2}>
                          Se agrega: <Text style={styles.resultName}>{entry.product.name}</Text>
                          {entry.product.brandName ? ` · ${entry.product.brandName}` : ""}
                        </Text>
                      ) : (
                        <Text style={styles.resultMissing}>No encontramos este producto.</Text>
                      )}
                      <View style={styles.resultActions}>
                        <Pressable
                          accessibilityLabel={entry.product ? `Cambiar ${entry.item.term}` : `Buscar ${entry.item.term} a mano`}
                          hitSlop={10}
                          onPress={() => update(entry.item.id, { picking: !entry.picking })}
                        >
                          <Text style={styles.remove}>{entry.product ? "Cambiar" : "Buscar"}</Text>
                        </Pressable>
                        <Pressable
                          accessibilityLabel={`Quitar ${entry.item.term}`}
                          hitSlop={10}
                          onPress={() => update(entry.item.id, { removed: true })}
                        >
                          <Text style={styles.remove}>Quitar</Text>
                        </Pressable>
                      </View>
                    </View>

                    {entry.picking ? (
                      <ProductPicker
                        initialQuery={entry.item.term}
                        typeId={entry.item.typeId}
                        onClose={() => update(entry.item.id, { picking: false })}
                        onPick={(product) => update(entry.item.id, { product, picking: false, loading: false })}
                      />
                    ) : null}
                  </View>
                ),
              )}
            </ScrollView>
            <View style={styles.footer}>
              <Button
                label={
                  isAdding
                    ? "Agregando..."
                    : addable.length === 0
                      ? "No hay nada para agregar"
                      : `Agregar ${addable.length} ${addable.length === 1 ? "producto" : "productos"}`
                }
                onPress={() => void handleAddAll()}
                loading={isAdding}
                disabled={addable.length === 0}
                style={{ borderRadius: radii.full }}
              />
              <Button
                label="Volver a decirlo"
                variant="ghost"
                onPress={() => {
                  setReview(null);
                  setHeard(null);
                  setError(undefined);
                  setMode("voice");
                }}
              />
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const MIC_SIZE = 112;

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    container: {
      flex: 1,
      backgroundColor: colors.surface.base,
    },
    content: {
      padding: spacing.lg,
      gap: spacing.md,
    },
    voiceContent: {
      flexGrow: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.lg,
      gap: spacing.md,
    },
    voiceTitle: {
      fontFamily: typography.heroTitle.fontFamily,
      fontSize: 28,
      lineHeight: 34,
      color: colors.text.primary,
      textAlign: "center",
    },
    voiceHint: {
      fontFamily: typography.subtitle.fontFamily,
      fontSize: 15,
      lineHeight: 22,
      color: colors.text.secondary,
      textAlign: "center",
      maxWidth: 300,
    },
    waveWrap: {
      alignSelf: "stretch",
      alignItems: "center",
      marginTop: spacing.md,
    },
    micWrap: {
      width: MIC_SIZE * 1.8,
      height: MIC_SIZE * 1.8,
      alignItems: "center",
      justifyContent: "center",
      marginVertical: spacing.md,
    },
    pulseRing: {
      position: "absolute",
      width: MIC_SIZE,
      height: MIC_SIZE,
      borderRadius: MIC_SIZE / 2,
      backgroundColor: colors.brand.navy,
    },
    micButton: {
      width: MIC_SIZE,
      height: MIC_SIZE,
      borderRadius: MIC_SIZE / 2,
      backgroundColor: colors.brand.navy,
      alignItems: "center",
      justifyContent: "center",
    },
    micButtonBusy: {
      opacity: 0.7,
    },
    micPressed: {
      transform: [{ scale: 0.96 }],
    },
    clock: {
      fontFamily: typography.heroTitle.fontFamily,
      fontSize: 22,
      color: colors.text.primary,
      minHeight: 28,
    },
    errorBox: {
      alignItems: "center",
      gap: spacing.xs,
    },
    title: {
      fontFamily: typography.heroTitle.fontFamily,
      fontSize: 26,
      lineHeight: 32,
      color: colors.text.primary,
    },
    subtitle: {
      fontFamily: typography.subtitle.fontFamily,
      fontSize: 15,
      lineHeight: 22,
      color: colors.text.secondary,
    },
    heardBox: {
      backgroundColor: colors.surface.input,
      borderRadius: radii.lg,
      padding: spacing.md,
      gap: 2,
    },
    heardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    resultActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    picker: {
      gap: spacing.xs,
      paddingTop: spacing.xs,
    },
    pickerInputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    pickerInput: {
      flex: 1,
      minHeight: 44,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      backgroundColor: colors.surface.input,
      paddingHorizontal: spacing.md,
      fontFamily: typography.subtitle.fontFamily,
      fontSize: 15,
      color: colors.text.primary,
    },
    pickerRow: {
      borderRadius: radii.lg,
      backgroundColor: colors.surface.base,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: 2,
    },
    heardLabel: {
      fontFamily: typography.caption.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
    },
    heardText: {
      fontFamily: typography.subtitle.fontFamily,
      fontSize: 15,
      lineHeight: 22,
      color: colors.text.primary,
    },
    textArea: {
      minHeight: 160,
      marginTop: spacing.sm,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      backgroundColor: colors.surface.input,
      padding: spacing.md,
      fontFamily: typography.subtitle.fontFamily,
      fontSize: 16,
      lineHeight: 24,
      color: colors.text.primary,
    },
    error: {
      fontFamily: typography.caption.fontFamily,
      fontSize: 13,
      lineHeight: 18,
      color: colors.state.errorStrong,
      textAlign: "center",
    },
    footer: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
      gap: spacing.xs,
    },
    card: {
      backgroundColor: colors.surface.primary,
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      padding: spacing.md,
      gap: spacing.sm,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    cardTitle: {
      flex: 1,
      fontFamily: typography.itemTitle.fontFamily,
      fontSize: 18,
      lineHeight: 24,
      color: colors.text.primary,
    },
    stepper: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    stepperButton: {
      width: 36,
      height: 36,
      borderRadius: radii.full,
      backgroundColor: colors.surface.input,
      alignItems: "center",
      justifyContent: "center",
    },
    quantity: {
      minWidth: 24,
      textAlign: "center",
      fontFamily: typography.itemTitle.fontFamily,
      fontSize: 16,
      color: colors.text.primary,
    },
    question: {
      fontFamily: typography.caption.fontFamily,
      fontSize: 13,
      color: colors.text.secondary,
    },
    chipRow: {
      gap: spacing.xs,
    },
    chip: {
      minHeight: 40,
      paddingHorizontal: spacing.md,
      borderRadius: radii.full,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      backgroundColor: colors.surface.base,
      alignItems: "center",
      justifyContent: "center",
    },
    chipSelected: {
      backgroundColor: colors.brand.navy,
      borderColor: colors.brand.navy,
    },
    chipLabel: {
      fontFamily: typography.body.fontFamily,
      fontSize: 14,
      color: colors.text.primary,
    },
    chipLabelSelected: {
      color: colors.text.onNavy,
    },
    result: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
      minHeight: 28,
    },
    resultText: {
      flex: 1,
      fontFamily: typography.subtitle.fontFamily,
      fontSize: 14,
      lineHeight: 20,
      color: colors.text.secondary,
    },
    resultName: {
      fontFamily: typography.itemTitle.fontFamily,
      color: colors.text.primary,
    },
    resultMissing: {
      flex: 1,
      fontFamily: typography.subtitle.fontFamily,
      fontSize: 14,
      color: colors.state.errorStrong,
    },
    remove: {
      fontFamily: typography.body.fontFamily,
      fontSize: 14,
      color: colors.text.secondary,
      textDecorationLine: "underline",
    },
  }),
);
