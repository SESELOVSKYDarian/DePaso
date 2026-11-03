import type { AdKind, AdResponse, MerchantPriceResponse } from "@depaso/validation";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/common/Toast";
import { adsClient, merchantClient } from "@/lib/apiClient";

export const DURATIONS = [7, 15, 30];

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

  const send = async () => {
    const offered = Number(amount.replace(/\./g, "").replace(",", "."));
    if (title.trim().length < 3) return setError("Escribí un título para tu publicidad.");
    if (kind === "FEATURED_PRODUCT" && !productId) return setError("Elegí qué producto querés destacar.");
    if (!Number.isFinite(offered) || offered <= 0) return setError("Ofrecé un monto mayor a cero.");
    setError(undefined);
    setSending(true);
    try {
      const created = await adsClient.merchant.create({
        kind,
        title,
        durationDays: days,
        offeredAmount: offered,
        ...(message.trim() ? { message } : {}),
        ...(kind === "FEATURED_PRODUCT" && productId ? { productId } : {}),
      });
      setAds((current) => [created, ...current]);
      setTitle("");
      setMessage("");
      setAmount("");
      setProductId(null);
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

  return { ads, products, loading, kind, setKind, title, setTitle, message, setMessage, productId, setProductId, amount, setAmount, days, setDays, error, sending, send, cancel };
}
