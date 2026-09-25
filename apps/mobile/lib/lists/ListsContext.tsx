import type {
  ShoppingListInput,
  ShoppingListItemInput,
  ShoppingListItemUpdate,
  ShoppingListResponse,
  ShoppingListSummary,
  ShoppingListUpdate,
} from "@depaso/validation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { listsClient } from "../apiClient";
import { useAuth } from "../auth/AuthContext";

interface ListsContextValue {
  lists: ShoppingListSummary[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createList: (input: ShoppingListInput) => Promise<ShoppingListResponse>;
  updateList: (id: string, input: ShoppingListUpdate) => Promise<ShoppingListResponse>;
  removeList: (id: string) => Promise<void>;
  getList: (id: string) => Promise<ShoppingListResponse>;
  addItem: (listId: string, input: ShoppingListItemInput) => Promise<ShoppingListResponse>;
  updateItem: (listId: string, itemId: string, input: ShoppingListItemUpdate) => Promise<ShoppingListResponse>;
  removeItem: (listId: string, itemId: string) => Promise<ShoppingListResponse>;
  shareList: (listId: string, email: string) => Promise<ShoppingListResponse>;
  removeMember: (listId: string, memberUserId: string, isSelf: boolean) => Promise<void>;
}

const ListsContext = createContext<ListsContextValue | null>(null);

/**
 * Estado compartido de listas de compra (Fase 9) — mismo patrón que `PlacesContext`. Guarda
 * sólo el resumen (`itemCount`) en memoria; el detalle completo de una lista (`items`) se
 * pide bajo demanda con `getList` y no se cachea acá, para no duplicar la fuente de verdad
 * entre esta lista y la pantalla de detalle.
 */
export function ListsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [lists, setLists] = useState<ShoppingListSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { lists: fetched } = await listsClient.list();
      setLists(fetched);
    } catch {
      setError("No pudimos cargar tus listas. Revisá tu conexión.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void refresh();
    } else {
      setLists([]);
    }
  }, [isAuthenticated, refresh]);

  const summarize = useCallback((list: ShoppingListResponse): ShoppingListSummary => ({
    id: list.id,
    name: list.name,
    archivedAt: list.archivedAt,
    createdAt: list.createdAt,
    updatedAt: list.updatedAt,
    role: list.role,
    ownerName: list.ownerName,
    memberCount: list.members.length,
    itemCount: list.items.length,
  }), []);

  const createList = useCallback(async (input: ShoppingListInput) => {
    const created = await listsClient.create(input);
    setLists((prev) => [summarize(created), ...prev]);
    return created;
  }, [summarize]);

  const updateList = useCallback(async (id: string, input: ShoppingListUpdate) => {
    const updated = await listsClient.update(id, input);
    setLists((prev) => prev.map((l) => (l.id === id ? summarize(updated) : l)));
    return updated;
  }, [summarize]);

  const removeList = useCallback(async (id: string) => {
    await listsClient.remove(id);
    setLists((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const getList = useCallback((id: string) => listsClient.get(id), []);

  const addItem = useCallback(async (listId: string, input: ShoppingListItemInput) => {
    const updated = await listsClient.addItem(listId, input);
    setLists((prev) => prev.map((l) => (l.id === listId ? summarize(updated) : l)));
    return updated;
  }, [summarize]);

  const updateItem = useCallback(async (listId: string, itemId: string, input: ShoppingListItemUpdate) => {
    const updated = await listsClient.updateItem(listId, itemId, input);
    setLists((prev) => prev.map((l) => (l.id === listId ? summarize(updated) : l)));
    return updated;
  }, [summarize]);

  const removeItem = useCallback(async (listId: string, itemId: string) => {
    const updated = await listsClient.removeItem(listId, itemId);
    setLists((prev) => prev.map((l) => (l.id === listId ? summarize(updated) : l)));
    return updated;
  }, [summarize]);

  const shareList = useCallback(async (listId: string, email: string) => {
    const updated = await listsClient.share(listId, { email });
    setLists((prev) => prev.map((l) => (l.id === listId ? summarize(updated) : l)));
    return updated;
  }, [summarize]);

  /** El dueño quita a un miembro, o un miembro se quita a sí mismo (sale de la lista). */
  const removeMember = useCallback(async (listId: string, memberUserId: string, isSelf: boolean) => {
    await listsClient.removeMember(listId, memberUserId);
    if (isSelf) {
      setLists((prev) => prev.filter((l) => l.id !== listId));
    } else {
      await refresh();
    }
  }, [refresh]);

  const value = useMemo<ListsContextValue>(
    () => ({ lists, isLoading, error, refresh, createList, updateList, removeList, getList, addItem, updateItem, removeItem, shareList, removeMember }),
    [lists, isLoading, error, refresh, createList, updateList, removeList, getList, addItem, updateItem, removeItem, shareList, removeMember]
  );

  return <ListsContext.Provider value={value}>{children}</ListsContext.Provider>;
}

export function useLists(): ListsContextValue {
  const ctx = useContext(ListsContext);
  if (!ctx) throw new Error("useLists debe usarse dentro de <ListsProvider>");
  return ctx;
}
