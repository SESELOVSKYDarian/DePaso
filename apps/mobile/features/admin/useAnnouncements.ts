import type { AnnouncementResponse } from "@depaso/validation";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/common/Toast";
import { activityClient } from "@/lib/apiClient";

/** Gestión de novedades para el administrador: ver todas, publicar, ocultar/mostrar y borrar. */
export function useAnnouncements() {
  const { show: showToast } = useToast();
  const [items, setItems] = useState<AnnouncementResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [publishing, setPublishing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { announcements } = await activityClient.admin.list();
      setItems(announcements);
    } catch {
      showToast("No pudimos cargar las novedades.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const publish = async () => {
    if (title.trim().length < 3 || body.trim().length < 3) {
      setError("Escribí un título y un mensaje.");
      return;
    }
    setError(undefined);
    setPublishing(true);
    try {
      const created = await activityClient.admin.create({ title, body });
      setItems((current) => [created, ...current]);
      setTitle("");
      setBody("");
      showToast("Novedad publicada: ya la ven todos los usuarios.", "success");
    } catch {
      showToast("No pudimos publicarla. Probá de nuevo.", "error");
    } finally {
      setPublishing(false);
    }
  };

  // ocultar o volver a mostrar una novedad sin borrarla
  const toggle = async (item: AnnouncementResponse) => {
    try {
      const updated = await activityClient.admin.update(item.id, { active: !item.active });
      setItems((current) => current.map((entry) => (entry.id === item.id ? updated : entry)));
    } catch {
      showToast("No pudimos cambiarla.", "error");
    }
  };

  const remove = async (item: AnnouncementResponse) => {
    try {
      await activityClient.admin.remove(item.id);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      showToast("Novedad borrada.", "info");
    } catch {
      showToast("No pudimos borrarla.", "error");
    }
  };

  return { items, loading, title, setTitle, body, setBody, error, publishing, publish, toggle, remove };
}
