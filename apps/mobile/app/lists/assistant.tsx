import { Ionicons } from "@expo/vector-icons";
import { ApiError } from "@depaso/api-client";
import type { AssistantItem, AssistantResponse, ProductSearchResult } from "@depaso/validation";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Button } from "@/components/Button";
import { useToast } from "@/components/Toast";
import { assistantClient, productsClient } from "@/lib/apiClient";
import { useLists } from "@/lib/lists/ListsContext";
import { makeStyles, useColors } from "@/lib/theme";

interface ReviewItem {
  item: AssistantItem;
  quantity: number;
  /** `null` = "me da igual la marca". */
  brandId: string | null;
  product: ProductSearchResult | null;
  loading: boolean;
  removed: boolean;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const code = (error.body as { error?: string } | null)?.error;
    if (code === "RATE_LIMITED") return "Pediste muchas listas seguidas. Probá de nuevo en unos minutos.";
    if (code === "NOTHING_UNDERSTOOD") return "No entendimos qué necesitás. Probá nombrando los productos.";
  }
  return "No pudimos armar tu lista. Revisá tu conexión e intentá de nuevo.";
}

/**
 * Armar la lista de una: se escribe (o se dicta con el micrófono del teclado) todo lo que
 * hace falta, la IA lo separa en productos y por cada uno se elige la marca o "me da igual".
 */
export default function ShoppingAssistantScreen() {
  const colors = useColors();
  const styles = useStyles();
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const { addItem } = useLists();
  const { show: showToast } = useToast();

  const [text, setText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [source, setSource] = useState<AssistantResponse["source"]>("ai");
  const [review, setReview] = useState<ReviewItem[] | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleParse = async () => {
    setError(undefined);
    setIsParsing(true);
    try {
      const response = await assistantClient.parse({ text: text.trim() });
      setSource(response.source);
      setReview(
        response.items.map((item) => ({
          item,
          quantity: item.quantity,
          brandId: null,
          product: item.candidates[0] ?? null,
          loading: false,
          removed: false,
        })),
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsParsing(false);
    }
  };

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

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        {review === null ? (
          <>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
              <Text accessibilityRole="header" style={styles.title}>
                Contanos todo lo que te falta
              </Text>
              <Text style={styles.subtitle}>
                Escribilo o dictalo de corrido. Después te preguntamos las marcas.
              </Text>

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

              <View style={styles.hint}>
                <Ionicons name="mic-outline" size={18} color={colors.text.secondary} />
                <Text style={styles.hintText}>Para dictar, tocá el micrófono de tu teclado.</Text>
              </View>

              {error ? (
                <Text accessibilityRole="alert" style={styles.error}>
                  {error}
                </Text>
              ) : null}
            </ScrollView>
            <View style={styles.footer}>
              <Button
                label={isParsing ? "Armando tu lista..." : "Armar mi lista"}
                onPress={() => void handleParse()}
                loading={isParsing}
                disabled={text.trim().length < 2}
                style={{ borderRadius: radii.full }}
              />
            </View>
          </>
        ) : (
          <>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
              <Text accessibilityRole="header" style={styles.title}>
                Esto entendimos
              </Text>
              <Text style={styles.subtitle}>
                {source === "fallback"
                  ? "Lo armamos en modo básico: revisá bien cada producto."
                  : "Elegí la marca de cada uno, o dejá “Me da igual”."}
              </Text>

              {review.map((entry) =>
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
                      <Pressable
                        accessibilityLabel={`Quitar ${entry.item.term}`}
                        hitSlop={10}
                        onPress={() => update(entry.item.id, { removed: true })}
                      >
                        <Text style={styles.remove}>Quitar</Text>
                      </Pressable>
                    </View>
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
              <Button label="Volver a escribir" variant="ghost" onPress={() => setReview(null)} />
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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
    hint: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    hintText: {
      fontFamily: typography.caption.fontFamily,
      fontSize: 13,
      color: colors.text.secondary,
    },
    error: {
      fontFamily: typography.caption.fontFamily,
      fontSize: 13,
      lineHeight: 18,
      color: colors.state.errorStrong,
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
