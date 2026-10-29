import type { ShoppingListResponse } from "@depaso/validation";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { makeStyles, useColors } from "@/lib/theme";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { Dialog } from "@/components/common/Dialog";
import { ProductThumb } from "@/components/lists/ProductThumb";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/common/Skeleton";
import { useToast } from "@/components/common/Toast";
import { useAuth } from "@/lib/auth/AuthContext";
import { useLists } from "@/lib/lists/ListsContext";
import { useStyles } from "./styles";

/** Detalle de una lista de compra (Fase 9) — agregar/quitar productos, ajustar cantidad. */
export default function ListDetailScreen() {
  const colors = useColors();
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { lists, getList, updateItem, removeItem, removeList, shareList, removeMember } = useLists();
  const { user } = useAuth();
  const { show: showToast } = useToast();
  // Desde Android 15 la app se dibuja bajo la barra de navegación: sin este margen el pie
  // (con los botones de agregar y de IA) queda tapado por el sistema.
  const insets = useSafeAreaInsets();
  const [shareEmail, setShareEmail] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  // Fila que se está actualizando: mientras tanto se ignoran más toques (evita repeticiones).
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // `itemCount` del resumen compartido (`ListsContext`) — cambia cuando `lists/search.tsx`
  // agrega un producto y vuelve acá. Bug real encontrado probando el flujo completo: sin
  // esto, la pantalla mostraba "vacía" después de agregar un producto porque el detalle
  // se pedía una sola vez al montar, sin refetch al volver de buscar (este proyecto evita
  // `useFocusEffect` — no está confirmado accesible desde `expo-router` sin importar
  // `@react-navigation/native` directo, ver `PlacesContext`).
  const summaryItemCount = lists.find((l) => l.id === id)?.itemCount;

  const [list, setList] = useState<ShoppingListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetched = await getList(id);
      setList(fetched);
      setError(null);
    } catch {
      setError("No pudimos cargar esta lista.");
    } finally {
      setIsLoading(false);
    }
  }, [id, getList]);

  useEffect(() => {
    void load();
    // Deliberadamente sin `load` en las deps de abajo — sólo debe re-disparar cuando
    // cambia el conteo real de items, no cada vez que `load` se recrea (sería un loop).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, summaryItemCount]);

  const handleQuantityChange = async (itemId: string, quantity: number) => {
    if (quantity < 1 || busyItemId) return;
    setBusyItemId(itemId);
    try {
      const updated = await updateItem(id, itemId, { quantity });
      setList(updated);
    } catch {
      showToast("No pudimos actualizar la cantidad.", "error");
    } finally {
      setBusyItemId(null);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (busyItemId) return;
    setBusyItemId(itemId);
    try {
      const updated = await removeItem(id, itemId);
      setList(updated);
    } catch {
      showToast("No pudimos quitar el producto.", "error");
    } finally {
      setBusyItemId(null);
    }
  };

  const handleDeleteList = async () => {
    try {
      await removeList(id);
      router.back();
    } catch {
      showToast("No pudimos eliminar la lista.", "error");
    }
  };

  const handleShare = async () => {
    const email = shareEmail.trim();
    if (!email) return;
    setIsSharing(true);
    try {
      const updated = await shareList(id, email);
      setList(updated);
      setShareEmail("");
      showToast("Lista compartida", "success");
    } catch (err) {
      const code = (err as { body?: { error?: string } }).body?.error;
      showToast(
        code === "USER_NOT_FOUND"
          ? "Esa persona todavía no tiene cuenta en DePaso."
          : code === "CANNOT_SHARE_WITH_SELF"
            ? "Esa es tu propia cuenta."
            : "No pudimos compartir la lista.",
        "error"
      );
    } finally {
      setIsSharing(false);
    }
  };

  const handleRemoveMember = async (memberUserId: string) => {
    try {
      await removeMember(id, memberUserId, memberUserId === user?.id);
      if (memberUserId === user?.id) {
        router.back();
      } else {
        await load();
      }
    } catch {
      showToast("No pudimos actualizar quién ve la lista.", "error");
    }
  };

  if (isLoading && !list) {
    return (
      <View style={styles.container}>
        <View style={styles.list}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} width="100%" height={56} borderRadius={12} />
          ))}
        </View>
      </View>
    );
  }

  if (error || !list) {
    return <EmptyState emoji="⚠️" title="Algo salió mal" description={error ?? "Lista no encontrada."} />;
  }

  const openAssistant = () =>
    router.push({ pathname: "/lists/assistant", params: { listId: id, autoStart: "1" } });

  const isOwner = list.role === "OWNER";
  const shareLabel = isOwner
    ? list.members.length === 0
      ? "Compartir lista"
      : `Compartida con ${list.members.length} ${list.members.length === 1 ? "persona" : "personas"}`
    : `Compartida por ${list.ownerName ?? "otra persona"}`;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={styles.headerActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={shareLabel}
                hitSlop={8}
                onPress={() => setShareOpen((open) => !open)}
                style={[styles.headerIcon, shareOpen ? styles.headerIconActive : null]}
              >
                <Ionicons name="people-outline" size={20} color={colors.text.primary} />
              </Pressable>
              {isOwner ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Eliminar lista"
                  hitSlop={8}
                  onPress={() => setConfirmDelete(true)}
                  style={styles.headerIcon}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.state.errorStrong} />
                </Pressable>
              ) : null}
            </View>
          ),
        }}
      />
      {shareOpen ? (
      <View style={styles.sharePanel}>
        {isOwner ? (
          <>
            <Text style={styles.shareTitle}>
              {list.members.length === 0 ? "Compartir esta lista" : "Compartida con"}
            </Text>
            {list.members.map((member) => (
              <View key={member.userId} style={styles.memberRow}>
                <Text style={styles.memberName} numberOfLines={1}>
                  {member.displayName ?? member.email}
                </Text>
                <AnimatedPressable
                  accessibilityLabel={`Dejar de compartir con ${member.email}`}
                  haptic={false}
                  onPress={() => void handleRemoveMember(member.userId)}
                >
                  <Text style={styles.memberRemove}>Quitar</Text>
                </AnimatedPressable>
              </View>
            ))}
            <View style={styles.shareRow}>
              <TextInput
                value={shareEmail}
                onChangeText={setShareEmail}
                placeholder="Email de quien ya usa DePaso"
                placeholderTextColor={colors.text.muted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                style={styles.shareInput}
              />
              <AnimatedPressable
                accessibilityLabel="Compartir lista"
                haptic={false}
                onPress={() => void handleShare()}
                style={[styles.shareButton, isSharing || !shareEmail.trim() ? styles.shareButtonDisabled : null]}
              >
                <Text style={styles.shareButtonLabel}>{isSharing ? "..." : "Compartir"}</Text>
              </AnimatedPressable>
            </View>
          </>
        ) : (
          <View style={styles.memberRow}>
            <Text style={styles.memberName} numberOfLines={1}>
              Compartida por {list.ownerName ?? "otra persona"}
            </Text>
            <AnimatedPressable
              accessibilityLabel="Salir de la lista"
              haptic={false}
              onPress={() => user && void handleRemoveMember(user.id)}
            >
              <Text style={styles.memberRemove}>Salir</Text>
            </AnimatedPressable>
          </View>
        )}
      </View>
      ) : null}

      {list.items.length === 0 ? (
        <EmptyState
          emoji="🛒"
          title="Todavía no hay nada"
          description="Sumá lo que te falta y nosotros buscamos dónde te queda de paso."
          action={
            <AnimatedPressable accessibilityLabel="Armar la lista con IA, hablando" onPress={openAssistant} style={styles.emptyAi}>
              <Ionicons name="sparkles" size={18} color={colors.text.onNavy} />
              <Text style={styles.emptyAiLabel}>Armar con IA</Text>
            </AnimatedPressable>
          }
        />
      ) : (
        <FlatList
          data={list.items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            // Sin animaciones de entrada/salida por fila: en una lista virtualizada, cuando entran
            // varias filas juntas (p. ej. después de armar la lista con IA) fallan en Android.
            <View style={styles.row}>
              <ProductThumb imageUrl={item.imageUrl} size={44} />
              <View style={styles.rowText}>
                <Text style={styles.rowName} numberOfLines={2}>
                  {item.productName}
                </Text>
                {item.brandName ? (
                  <Text style={styles.rowNote} numberOfLines={1}>
                    {item.brandName}
                  </Text>
                ) : null}
                {item.note ? <Text style={styles.rowNote}>{item.note}</Text> : null}
              </View>
              <View style={styles.quantityRow}>
                <AnimatedPressable
                  accessibilityLabel={`Restar uno de ${item.productName}`}
                  haptic={false}
                  onPress={() => void handleQuantityChange(item.id, item.quantity - 1)}
                  style={styles.stepperButton}
                >
                  <Ionicons name="remove" size={18} color={colors.text.primary} />
                </AnimatedPressable>
                {busyItemId === item.id ? (
                  <ActivityIndicator size="small" color={colors.text.primary} style={styles.quantityLoader} />
                ) : (
                  <Text style={styles.quantity}>{item.quantity}</Text>
                )}
                <AnimatedPressable
                  accessibilityLabel={`Sumar uno de ${item.productName}`}
                  haptic={false}
                  onPress={() => void handleQuantityChange(item.id, item.quantity + 1)}
                  style={styles.stepperButton}
                >
                  <Ionicons name="add" size={18} color={colors.text.primary} />
                </AnimatedPressable>
              </View>
              <AnimatedPressable
                accessibilityLabel={`Quitar ${item.productName}`}
                haptic={false}
                onPress={() => void handleRemoveItem(item.id)}
                style={styles.removeButton}
              >
                <Ionicons name="trash-outline" size={18} color={colors.text.secondary} />
              </AnimatedPressable>
            </View>
          )}
        />
      )}

      <View style={[styles.footer, { paddingBottom: Math.max(spacing.lg, insets.bottom + spacing.sm) }]}>
        <View style={styles.addRow}>
          <AnimatedPressable
            accessibilityLabel="Sumar un producto"
            onPress={() => router.push({ pathname: "/lists/search", params: { listId: id } })}
            style={[styles.addButton, styles.addButtonGrow]}
          >
            <Ionicons name="add" size={20} color={colors.text.onNavy} />
            <Text style={styles.addLabel}>Sumar producto</Text>
          </AnimatedPressable>
          <AnimatedPressable
            accessibilityLabel="Armar la lista con IA"
            onPress={openAssistant}
            style={[styles.aiButton, styles.addButtonGrow]}
          >
            <Ionicons name="sparkles" size={18} color={colors.text.primary} />
            <Text style={styles.aiLabel}>Armar con IA</Text>
          </AnimatedPressable>
        </View>
      </View>

      <Dialog
        visible={confirmDelete}
        title="¿Eliminar esta lista?"
        description={`Se borra "${list.name}" con sus ${list.items.length} productos.`}
        confirmLabel="Eliminar"
        destructive
        onConfirm={() => {
          setConfirmDelete(false);
          void handleDeleteList();
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </View>
  );
}
