import type { ShoppingListResponse } from "@depaso/validation";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/common/Toast";
import { useAuth } from "@/lib/auth/AuthContext";
import { useLists } from "@/lib/lists/ListsContext";

/**
 * Estado y acciones de una lista abierta: la carga, cambiar cantidades, quitar productos,
 * eliminarla, compartirla y quitar a alguien que la ve.
 */
export function useShoppingList(id: string) {
  const { lists, getList, updateItem, removeItem, removeList, shareList, removeMember } = useLists();
  const { user } = useAuth();
  const { show: showToast } = useToast();

  const [list, setList] = useState<ShoppingListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  // Fila que se está actualizando: mientras tanto se ignoran más toques (evita repeticiones).
  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  // `itemCount` del resumen compartido (`ListsContext`): cambia cuando la búsqueda agrega un
  // producto y vuelve acá. Sin esto la pantalla mostraba "vacía" después de agregar, porque el
  // detalle se pedía una sola vez al montar.
  const summaryItemCount = lists.find((l) => l.id === id)?.itemCount;

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setList(await getList(id));
      setError(null);
    } catch {
      setError("No pudimos cargar esta lista.");
    } finally {
      setIsLoading(false);
    }
  }, [id, getList]);

  useEffect(() => {
    void load();
    // Deliberadamente sin `load` en las deps: sólo debe re-disparar cuando cambia el conteo
    // real de items, no cada vez que `load` se recrea (sería un loop).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, summaryItemCount]);

  // corre una acción sobre un producto y actualiza la lista con la respuesta
  const runOnItem = async (itemId: string, action: () => Promise<ShoppingListResponse>, failMessage: string) => {
    if (busyItemId) return;
    setBusyItemId(itemId);
    try {
      setList(await action());
    } catch {
      showToast(failMessage, "error");
    } finally {
      setBusyItemId(null);
    }
  };

  const changeQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    void runOnItem(itemId, () => updateItem(id, itemId, { quantity }), "No pudimos actualizar la cantidad.");
  };

  const removeProduct = (itemId: string) => {
    void runOnItem(itemId, () => removeItem(id, itemId), "No pudimos quitar el producto.");
  };

  const deleteList = async () => {
    try {
      await removeList(id);
      router.back();
    } catch {
      showToast("No pudimos eliminar la lista.", "error");
    }
  };

  /** Comparte por email. Devuelve `true` si se pudo (para limpiar el campo). */
  const share = async (email: string) => {
    if (!email) return false;
    setIsSharing(true);
    try {
      setList(await shareList(id, email));
      showToast("Lista compartida", "success");
      return true;
    } catch (err) {
      const code = (err as { body?: { error?: string } }).body?.error;
      showToast(
        code === "USER_NOT_FOUND"
          ? "Esa persona todavía no tiene cuenta en DePaso."
          : code === "CANNOT_SHARE_WITH_SELF"
            ? "Esa es tu propia cuenta."
            : "No pudimos compartir la lista.",
        "error",
      );
      return false;
    } finally {
      setIsSharing(false);
    }
  };

  const removeSharedMember = async (memberUserId: string) => {
    try {
      await removeMember(id, memberUserId, memberUserId === user?.id);
      if (memberUserId === user?.id) router.back();
      else await load();
    } catch {
      showToast("No pudimos actualizar quién ve la lista.", "error");
    }
  };

  return { list, isLoading, error, isSharing, busyItemId, currentUserId: user?.id, changeQuantity, removeProduct, deleteList, share, removeSharedMember };
}
