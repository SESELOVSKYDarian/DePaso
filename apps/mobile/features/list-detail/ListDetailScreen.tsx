import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { Dialog } from "@/components/common/Dialog";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/common/Skeleton";
import { useColors } from "@/lib/theme";
import { ListFooter } from "./components/ListFooter";
import { ListItemRow } from "./components/ListItemRow";
import { SharePanel } from "./components/SharePanel";
import { useStyles } from "./styles";
import { useShoppingList } from "./useShoppingList";

/** Detalle de una lista de compra: agregar y quitar productos, ajustar cantidad y compartirla. */
export default function ListDetailScreen() {
  const colors = useColors();
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const shopping = useShoppingList(id);
  const [shareOpen, setShareOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { list } = shopping;

  if (shopping.isLoading && !list) {
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

  if (shopping.error || !list) {
    return <EmptyState emoji="⚠️" title="Algo salió mal" description={shopping.error ?? "Lista no encontrada."} />;
  }

  const openAssistant = () => router.push({ pathname: "/lists/assistant", params: { listId: id, autoStart: "1" } });

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
        <SharePanel
          list={list}
          isOwner={isOwner}
          isSharing={shopping.isSharing}
          currentUserId={shopping.currentUserId}
          onShare={shopping.share}
          onRemoveMember={(memberUserId) => void shopping.removeSharedMember(memberUserId)}
        />
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
            <ListItemRow
              item={item}
              isBusy={shopping.busyItemId === item.id}
              onQuantityChange={(quantity) => shopping.changeQuantity(item.id, quantity)}
              onRemove={() => shopping.removeProduct(item.id)}
            />
          )}
        />
      )}

      <ListFooter listId={id} />

      <Dialog
        visible={confirmDelete}
        title="¿Eliminar esta lista?"
        description={`Se borra "${list.name}" con sus ${list.items.length} productos.`}
        confirmLabel="Eliminar"
        destructive
        onConfirm={() => {
          setConfirmDelete(false);
          void shopping.deleteList();
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </View>
  );
}
