import type { BrandLogo } from "@depaso/validation";

/** Saca tildes y símbolos, y deja un espacio a cada lado, para comparar palabras enteras. */
function plain(name: string): string {
  const text = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return ` ${text} `;
}

/**
 * Busca el logo de un comercio por su nombre. Compara palabras enteras: "Coto Hipermercado"
 * es Coto, pero "Avea" no es Vea. Si coinciden varios gana el alias más largo.
 */
export function findBrandLogo(logos: BrandLogo[], storeName: string): BrandLogo | null {
  const name = plain(storeName);
  let best: { logo: BrandLogo; length: number } | null = null;
  for (const logo of logos) {
    for (const alias of logo.aliases) {
      if (name.includes(plain(alias)) && (!best || alias.length > best.length)) best = { logo, length: alias.length };
    }
  }
  return best?.logo ?? null;
}
