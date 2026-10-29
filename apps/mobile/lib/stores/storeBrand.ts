/** Colores de referencia de las cadenas grandes. Si no se reconoce el comercio, queda un gris neutro. */
export interface StoreBrand {
  /** Fondo del ícono. */
  background: string;
  /** Color de las letras: blanco u oscuro según qué tan claro sea el fondo. */
  text: string;
  /** Letras que se dibujan (1 o 2). */
  initials: string;
}

interface KnownBrand {
  /** Palabras que identifican la cadena (sin tildes, en minúscula). */
  match: string[];
  background: string;
  text: string;
  initials: string;
}

const LIGHT = "#FFFFFF";
const DARK = "#1A1A1A";

const KNOWN_BRANDS: KnownBrand[] = [
  { match: ["coto"], background: "#E30613", text: LIGHT, initials: "C" },
  { match: ["carrefour"], background: "#004E9F", text: LIGHT, initials: "Cf" },
  { match: ["jumbo"], background: "#00A04A", text: LIGHT, initials: "J" },
  { match: ["disco"], background: "#D71920", text: LIGHT, initials: "D" },
  { match: ["vea"], background: "#F26B21", text: LIGHT, initials: "V" },
  { match: ["dia"], background: "#E30613", text: LIGHT, initials: "Dia" },
  { match: ["la anonima"], background: "#C8102E", text: LIGHT, initials: "LA" },
  { match: ["changomas", "chango mas", "walmart"], background: "#FFC220", text: DARK, initials: "Ch" },
  { match: ["makro"], background: "#003DA5", text: LIGHT, initials: "M" },
  { match: ["maxiconsumo"], background: "#0B7A3B", text: LIGHT, initials: "Mx" },
  { match: ["libertad"], background: "#E2231A", text: LIGHT, initials: "L" },
  { match: ["shell"], background: "#FFD500", text: DARK, initials: "S" },
  { match: ["ypf"], background: "#0033A0", text: LIGHT, initials: "YPF" },
  { match: ["axion"], background: "#E4002B", text: LIGHT, initials: "Ax" },
  { match: ["puma"], background: "#D40000", text: LIGHT, initials: "P" },
];

const NEUTRAL = { background: "#3A3A3C", text: LIGHT };

/** Saca tildes y símbolos para comparar nombres sin vueltas. */
function plain(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Letras del fallback: las iniciales de las dos primeras palabras. */
function fallbackInitials(name: string): string {
  const words = plain(name).split(" ").filter(Boolean);
  const letters = words.slice(0, 2).map((word) => word[0]!.toUpperCase());
  return letters.join("") || "?";
}

/** Marca (color + letras) de un comercio a partir de su nombre. */
export function storeBrand(storeName: string): StoreBrand {
  const name = ` ${plain(storeName)} `;
  const known = KNOWN_BRANDS.find((brand) => brand.match.some((word) => name.includes(` ${plain(word)} `)));
  if (known) return { background: known.background, text: known.text, initials: known.initials };
  return { ...NEUTRAL, initials: fallbackInitials(storeName) };
}
