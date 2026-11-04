import { AD_DURATIONS, AD_PRICE_PER_DAY, MAX_ACTIVE_ADS, minAdAmount, type AdKind, type AdPrices, type AdResponse, type MerchantPriceResponse } from "@depaso/validation";
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
  // precio base por día que fijó el administrador (hasta que llega, los de fábrica)
  const [prices, setPrices] = useState<AdPrices>(AD_PRICE_PER_DAY);
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
      const [mine, catalog, basePrices] = await Promise.all([adsClient.merchant.list(), merchantClient.prices.list({}), adsClient.prices()]);
      setAds(mine.ads);
      setProducts(catalog.prices);
      setPrices(basePrices);
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
  const used = ads.filter((ad) => ad.status === "PENDING" || ad.status === "COUNTER" || ad.active).length;
  const slotsLeft = Math.max(0, MAX_ACTIVE_ADS - used);
  // el precio base del formato elegido por los días elegidos; si no escribe nada, ofrece eso
  const baseAmount = minAdAmount(kind, days, prices);

  const chooseKind = (next: AdKind) => {
    setKind(next);
    setError(undefined);
  };

  const pickImage = async () => {
    try {
      const picked = await pickAnnouncementImage(kind === "BANNER" ? [16, 9] : [4, 5]);
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
        ...((kind === "IMAGE" || kind === "BANNER") && imageData ? { imageData } : {}),
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
    } catch (reason) {
      // el servidor puede haber cambiado el precio base mientras tanto
      const tooLow = reason instanceof Error && /AMOUNT_TOO_LOW/.test(reason.message);
      showToast(tooLow ? "El precio base cambió. Actualizá la pantalla y revisá el monto." : "No pudimos enviar el pedido. Probá de nuevo.", "error");
    } finally {
      setSending(false);
    }
  };

  // respuesta a la contraoferta del equipo: aceptar, rechazar o proponer otro monto
  const reply = async (ad: AdResponse, answer: "ACCEPT" | "DECLINE" | "PROPOSE", amountText?: string) => {
    const amount = amountText ? Number(amountText.replace(/\./g, "").replace(",", ".")) : undefined;
    const minimum = minAdAmount(ad.kind, ad.durationDays, prices);
    if (answer === "PROPOSE" && (!amount || !Number.isFinite(amount) || amount < minimum)) {
      showToast(`El monto mínimo para ${ad.durationDays} días es $${minimum.toLocaleString("es-AR")}.`, "error");
      return false;
    }
    try {
      const updated = await adsClient.merchant.reply(ad.id, { reply: answer, ...(amount ? { amount } : {}) });
      setAds((current) => current.map((entry) => (entry.id === ad.id ? updated : entry)));
      showToast(answer === "ACCEPT" ? "Aceptaste: tu publicidad ya se muestra." : answer === "DECLINE" ? "Rechazaste la propuesta." : "Enviamos tu propuesta al equipo.", "success");
      return true;
    } catch {
      showToast("No pudimos enviar tu respuesta. Probá de nuevo.", "error");
      return false;
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
    ads, products, prices, loading, kind, chooseKind, title, setTitle, message, setMessage, productId, setProductId,
    imageData, pickImage, clearImage: () => setImageData(null), videoUrl, setVideoUrl,
    amount, setAmount, days, setDays, baseAmount, slotsLeft, error, sending, send, cancel, reply,
  };
}
