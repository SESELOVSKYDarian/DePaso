import type { Feature } from "./FeatureScene";

// las 8 funciones que muestra el video, en orden
export const FEATURES: Feature[] = [
  {
    etiqueta: "Tu día",
    titulo: "Todo empieza en Inicio.",
    detalle: "Tu lista y tu recorrido de hoy, en una sola tarjeta.",
    pantallas: ["home.png"],
  },
  {
    etiqueta: "Listas",
    titulo: "Armá tu lista hablando.",
    detalle: "Decí lo que necesitás y la IA elige producto y marca. Compartila con quien quieras.",
    pantallas: ["voice.png", "voice-review.png"],
  },
  {
    etiqueta: "Recorrido",
    titulo: "Elegí por dónde andás.",
    detalle: "Casa, trabajo o cualquier lugar. Armá la ruta parada por parada.",
    pantallas: ["optimization-setup.png", "route-builder.png"],
  },
  {
    etiqueta: "Top 3",
    titulo: "Tres formas de comprar.",
    detalle: "Más rápido, mejor equilibrio o más económico. Vos elegís cuánto desviarte.",
    pantallas: ["plans.png"],
  },
  {
    etiqueta: "Mapa",
    titulo: "Los comercios, en tu camino.",
    detalle: "Cada parada con su logo. Deslizá para ver el detalle.",
    pantallas: ["route.png", "best-prices.png"],
  },
  {
    etiqueta: "Compra",
    titulo: "Comprá y reportá precios.",
    detalle: "Tildá lo que vas comprando. Si un precio cambió, avisá y ayudás a todos.",
    pantallas: ["purchase.png", "purchase-check.png"],
  },
  {
    etiqueta: "Promos",
    titulo: "Tus promos, ya descontadas.",
    detalle: "Cargá tus billeteras y tarjetas y mirá el precio real.",
    pantallas: ["payments.png"],
  },
  {
    etiqueta: "Actividad",
    titulo: "Enterate en el momento.",
    detalle: "Novedades del equipo y avisos para vos: bajas de precio, ofertas cerca, listas compartidas.",
    pantallas: ["activity.png"],
  },
  {
    etiqueta: "Comercios y admin",
    titulo: "También para quien vende.",
    detalle: "Los comercios cargan sus precios y los administradores publican novedades.",
    pantallas: ["merchant.png", "admin.png"],
  },
];
