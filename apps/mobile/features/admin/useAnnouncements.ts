import type { AnnouncementResponse } from "@depaso/validation";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/common/Toast";
import { activityClient } from "@/lib/apiClient";
import { pickAnnouncementImage, type PreparedImage } from "@/lib/images/prepareAnnouncementImage";

/** Gestión de anuncios para el administrador: publicar (con emoji o imagen), ocultar/mostrar y borrar. */
export function useAnnouncements() {
  const { show: showToast } = useToast();
  const [items, setItems] = useState<AnnouncementResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [emoji, setEmoji] = useState("");
  const [image, setImage] = useState<PreparedImage | null>(null);
  const [showPopup, setShowPopup] = useState(true);
  const [sendPush, setSendPush] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [publishing, setPublishing] = useState(false);
  const [pickingImage, setPickingImage] = useState(false);

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

  const pickImage = async () => {
    setPickingImage(true);
    try {
      const picked = await pickAnnouncementImage();
      if (picked) setImage(picked);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "No pudimos usar esa imagen.", "error");
    } finally {
      setPickingImage(false);
    }
  };

  const publish = async () => {
    if (title.trim().length < 3 || body.trim().length < 3) {
      setError("Escribí un título y un mensaje.");
      return;
    }
    setError(undefined);
    setPublishing(true);
    try {
      const created = await activityClient.admin.create({
        title,
        body,
        showPopup,
        sendPush,
        ...(emoji.trim() ? { emoji: emoji.trim() } : {}),
        ...(image ? { imageData: image.imageData, thumbData: image.thumbData } : {}),
      });
      setItems((current) => [created, ...current]);
      setTitle("");
      setBody("");
      setEmoji("");
      setImage(null);
      setSendPush(false);
      showToast(sendPush ? "Anuncio publicado y enviado al celular de todos." : "Anuncio publicado: ya lo ven todos los usuarios.", "success");
    } catch {
      showToast("No pudimos publicarlo. Probá de nuevo.", "error");
    } finally {
      setPublishing(false);
    }
  };

  // ocultar o volver a mostrar un anuncio sin borrarlo
  const toggle = async (item: AnnouncementResponse) => {
    try {
      const updated = await activityClient.admin.update(item.id, { active: !item.active });
      setItems((current) => current.map((entry) => (entry.id === item.id ? updated : entry)));
    } catch {
      showToast("No pudimos cambiarlo.", "error");
    }
  };

  const remove = async (item: AnnouncementResponse) => {
    try {
      await activityClient.admin.remove(item.id);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      showToast("Anuncio borrado.", "info");
    } catch {
      showToast("No pudimos borrarlo.", "error");
    }
  };

  return {
    items, loading, title, setTitle, body, setBody, emoji, setEmoji, image, setImage, pickImage, pickingImage,
    showPopup, setShowPopup, sendPush, setSendPush, error, publishing, publish, toggle, remove,
  };
}
