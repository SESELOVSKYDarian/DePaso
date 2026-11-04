import { AD_DURATIONS, MAX_ACTIVE_ADS, minAdAmount, type AdKind, type AdResponse, type MerchantPriceResponse } from "@depaso/validation";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/common/Toast";
import { adsClient, merchantClient } from "@/lib/apiClient";
import { pickAnnouncementImage } from "@/lib/images/prepareAnnouncementImage";

export const DURATIONS = AD_DURATIONS;

/** Pedir publicidad: qué se publicita, cuánto se ofrece y por cuántos días; y ver cómo van los pedidos. */
export function useMerchantAds() {
  const { show: showToast } = useToast();
  const [ads, setAds] = useState<AdResponse[]>([]);
  const [products, setProducts] = useState<MerchantPriceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState<AdKind>("FEATURED_PRODUCT");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [productId, setProductId] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [amount, setAmount] = useState("");
  const [days, setDays] = useState(15);
  const [error, setError] = useState<string | undefined>();
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const [mine, prices] = await Promise.all([adsClient.merchant.list(), merchantClient.prices.list({})]);
      setAds(mine.ads);
      setProducts(prices.prices);
    } catch {
      showToast("No pudimos cargar tu publicidad.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  // cuántas publicidades ocupan lugar: las que esperan respuesta y las que siguen vigentes
  const used = ads.filter((ad) => ad.status === "PENDING" || ad.active).length;
  const slotsLeft = Math.max(0, MAX_ACTIVE_ADS - used);
  // el precio base del formato elegido por los días elegidos; si no escribe nada, ofrece eso
  const baseAmount = minAdAmount(kind, days);

  const chooseKind = (next: AdKind) => {
    setKind(next);
    setError(undefined);
  };

  const pickImage = async () => {
    try {
      const picked = await pickAnnouncementImage([4, 5]);
      if (picked) setImageData(picked.imageData);
    } catch (reason) {
      showToast(reason instanceof Error ? reason.message : "No pudimos usar esa imagen.", "error");
    }
  };

  const send = async () => {
    const typed = amount.trim() ? Number(amount.replace(/\./g, "").replace(",", ".")) : baseAmount;
    if (slotsLeft === 0) return setError(`Ya tenés ${MAX_ACTIVE_ADS} publicidades. Esperá a que termine o se resuelva alguna.`);
    if (title.trim().length < 3) return setError("Escribí un título para tu publicidad.");
    if (kind === "FEATURED_PRODUCT" && !productId) return setError("Elegí qué producto querés destacar.");
    if (kind === "IMAGE" && !imageData) return setError("Subí la imagen de tu publicidad.");
    if (kind === "VIDEO" && !/^https:\/\//i.test(videoUrl.trim())) return setError("Pegá el enlace https de tu video (un archivo .mp4).");
    if (!Number.isFinite(typed) || typed < baseAmount) return setError(`El monto mínimo para ${days} días es $${baseAmount.toLocaleString("es-AR")}.`);
    setError(undefined);
    setSending(true);
    try {
      const created = await adsClient.merchant.create({
        kind,
        title,
        durationDays: days,
        offeredAmount: typed,
        ...(message.trim() ? { message } : {}),
        ...(kind === "FEATURED_PRODUCT" && productId ? { productId } : {}),
        ...(kind === "IMAGE" && imageData ? { imageData } : {}),
        ...(kind === "VIDEO" ? { videoUrl: videoUrl.trim() } : {}),
      });
      setAds((current) => [created, ...current]);
      setTitle("");
      setMessage("");
      setAmount("");
      setProductId(null);
      setImageData(null);
      setVideoUrl("");
      showToast("Pedido enviado. Te avisamos cuando lo revisemos.", "success");
    } catch {
      showToast("No pudimos enviar el pedido. Probá de nuevo.", "error");
    } finally {
      setSending(false);
    }
  };

  const cancel = async (ad: AdResponse) => {
    try {
      await adsClient.merchant.cancel(ad.id);
      setAds((current) => current.map((entry) => (entry.id === ad.id ? { ...entry, status: "CANCELLED", active: false } : entry)));
      showToast("Pedido cancelado.", "info");
    } catch {
      showToast("No pudimos cancelarlo.", "error");
    }
  };

  return {
    ads, products, loading, kind, chooseKind, title, setTitle, message, setMessage, productId, setProductId,
    imageData, pickImage, clearImage: () => setImageData(null), videoUrl, setVideoUrl,
    amount, setAmount, days, setDays, baseAmount, slotsLeft, error, sending, send, cancel,
  };
}
