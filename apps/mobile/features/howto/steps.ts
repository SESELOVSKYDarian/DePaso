import type { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

export type HowToStep = {
  icon: ComponentProps<typeof Ionicons>["name"];
  title: string;
  text: string;
};

// el uso de DePaso en cinco pasos (el detalle completo está en el manual en PDF)
export const HOW_TO_STEPS: HowToStep[] = [
  {
    icon: "list-outline",
    title: "Armá tu lista",
    text: "En Listas tocá + y sumá productos buscando, filtrando o hablándole a la IA.",
  },
  {
    icon: "navigate-outline",
    title: "Elegí tu recorrido",
    text: "Contanos de dónde salís y adónde vas hoy. Queda guardado hasta las 00:00.",
  },
  {
    icon: "sparkles-outline",
    title: "Mirá tu Top 3",
    text: "Tocá Iniciar mi recorrido: más rápido, mejor equilibrio o más económico, con tus promos ya descontadas.",
  },
  {
    icon: "cart-outline",
    title: "Comprá de paso",
    text: "Seguí el mapa, tildá lo que vas comprando y reportá si un precio cambió.",
  },
  {
    icon: "notifications-outline",
    title: "Enterate en Actividad",
    text: "Novedades de DePaso, bajas de precio y ofertas cerca de tu camino.",
  },
];
