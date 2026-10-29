import type { ProductSearchResult } from "@depaso/validation";
import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { useToast } from "@/components/common/Toast";
import { merchantClient, productsClient } from "@/lib/apiClient";
import { parsePrice } from "./helpers";

export type FormMode = "catalog" | "new";

/**
 * Lo que hace el formulario de precios del comercio. Tiene tres usos: editar o dar de baja un
 * precio existente (`priceId`), publicar un producto que ya está en el catálogo (buscándolo) o
 * crear un producto nuevo con su primer precio.
 */
export function useMerchantPriceForm() {
  const params = useLocalSearchParams<{ priceId?: string; name?: string; price?: string; displayName?: string }>();
  const { show: showToast } = useToast();
  const isEditing = Boolean(params.priceId);

  const [mode, setMode] = useState<FormMode>("catalog");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // precio (común a los tres usos)
  const [priceText, setPriceText] = useState(params.price ?? "");
  const [priceError, setPriceError] = useState<string | undefined>();
  const [displayName, setDisplayName] = useState(params.displayName ?? "");

  // buscar en el catálogo
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // producto nuevo
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [brandName, setBrandName] = useState("");
  const [unit, setUnit] = useState("");
  const [unitSizeText, setUnitSizeText] = useState("");
  const [newError, setNewError] = useState<string | undefined>();

  // busca en el catálogo con una pausa de 300 ms para no pedir en cada letra
  const search = (text: string) => {
    setQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!text.trim()) {
      setResults([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      try {
        const { results: found } = await productsClient.search(text.trim());
        setResults(found);
      } catch {
        setResults([]);
      }
    }, 300);
  };

  const pickVariant = (id: string, label: string) => {
    setSelectedVariantId(id);
    setSelectedLabel(label);
  };

  // corre una acción del servidor: avisa, y si salió bien vuelve atrás
  const run = async (action: () => Promise<unknown>, successMessage: string) => {
    setIsSubmitting(true);
    try {
      await action();
      showToast(successMessage, "success");
      router.back();
    } catch {
      showToast("No pudimos guardar. Probá de nuevo.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const save = async () => {
    const price = parsePrice(priceText);
    if (price === null) {
      setPriceError("Ingresá un precio válido mayor a 0.");
      return;
    }
    setPriceError(undefined);

    // editar un precio que ya existe
    if (isEditing && params.priceId) {
      const priceId = params.priceId;
      await run(() => merchantClient.prices.update(priceId, price, displayName.trim()), "Guardado");
      return;
    }

    // publicar un producto del catálogo
    if (mode === "catalog") {
      if (!selectedVariantId) {
        showToast("Elegí un producto de la lista.", "info");
        return;
      }
      const productVariantId = selectedVariantId;
      await run(() => merchantClient.prices.set({ productVariantId, price }), "Producto publicado");
      return;
    }

    // crear un producto nuevo
    const unitSize = parsePrice(unitSizeText);
    if (name.trim().length < 2 || category.trim().length < 2 || !unit.trim() || unitSize === null) {
      setNewError("Completá nombre, categoría, unidad (ej. kg, l, u) y tamaño.");
      return;
    }
    setNewError(undefined);
    await run(
      () =>
        merchantClient.createProduct({
          name: name.trim(),
          category: category.trim(),
          ...(brandName.trim() ? { brandName: brandName.trim() } : {}),
          unit: unit.trim(),
          unitSize,
          price,
        }),
      "Producto creado y publicado",
    );
  };

  const remove = async () => {
    const priceId = params.priceId;
    if (!priceId) return;
    await run(() => merchantClient.prices.remove(priceId), "Producto dado de baja");
  };

  return {
    isEditing,
    editingName: params.name,
    mode, setMode,
    isSubmitting,
    priceText, priceError, displayName, setDisplayName,
    changePrice: (text: string) => {
      setPriceText(text);
      setPriceError(undefined);
    },
    catalog: { query, search, results, selectedVariantId, selectedLabel, pickVariant },
    fresh: { name, setName, category, setCategory, brandName, setBrandName, unit, setUnit, unitSizeText, setUnitSizeText, error: newError },
    save,
    remove,
  };
}
