import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

type IconName = ComponentProps<typeof Ionicons>["name"];

/** Palabras del nombre → ícono. El primero que coincide gana, así que van de lo más puntual a lo más general. */
const RULES: { icon: IconName; words: string[] }[] = [
  { icon: "paw-outline", words: ["perro", "gato", "alimento balanceado", "mascota"] },
  { icon: "beer-outline", words: ["cerveza", "lager", "stout", "ipa"] },
  { icon: "wine-outline", words: ["vino", "malbec", "espumante", "champagne", "fernet", "whisky", "vodka", "gin"] },
  { icon: "cafe-outline", words: ["cafe", "te ", "yerba", "mate", "infusion", "cacao", "chocolatada"] },
  { icon: "water-outline", words: ["agua", "gaseosa", "jugo", "soda", "bebida", "cola", "leche", "yogur", "yogurt", "bebible"] },
  { icon: "egg-outline", words: ["huevo", "queso", "manteca", "crema", "dulce de leche"] },
  { icon: "fish-outline", words: ["atun", "caballa", "sardina", "pescado", "merluza"] },
  { icon: "pizza-outline", words: ["pizza", "empanada", "tapa", "pan ", "galletita", "galleta", "tostada", "fideos", "pasta", "harina", "arroz"] },
  { icon: "nutrition-outline", words: ["fruta", "verdura", "manzana", "banana", "tomate", "papa", "cebolla", "mermelada", "lenteja", "garbanzo"] },
  { icon: "ice-cream-outline", words: ["helado", "alfajor", "chocolate", "golosina", "caramelo", "postre", "budin"] },
  { icon: "fast-food-outline", words: ["carne", "pollo", "hamburguesa", "milanesa", "salchicha", "jamon", "fiambre", "salame", "cerdo"] },
  { icon: "flask-outline", words: ["lavandina", "detergente", "limpiador", "desinfectante", "jabon liquido", "suavizante", "limpia"] },
  { icon: "sparkles-outline", words: ["shampoo", "acondicionador", "jabon", "desodorante", "dentifrico", "crema dental", "papel higienico", "toalla", "panal", "algodon"] },
  { icon: "restaurant-outline", words: ["aceite", "vinagre", "sal ", "azucar", "edulcorante", "mayonesa", "ketchup", "mostaza", "salsa", "caldo", "sopa", "conserva"] },
];

/** Saca tildes y pasa a minúsculas para comparar sin vueltas. */
function plain(text: string): string {
  return ` ${text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()} `;
}

/** Ícono que representa el tipo de producto cuando no hay foto. */
export function productIcon(name: string | null | undefined): IconName {
  if (!name) return "basket-outline";
  const text = plain(name);
  const rule = RULES.find((candidate) => candidate.words.some((word) => text.includes(word.endsWith(" ") ? ` ${word}` : word)));
  return rule?.icon ?? "basket-outline";
}
