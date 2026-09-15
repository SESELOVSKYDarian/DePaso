import { createHash } from "node:crypto";

export interface DownloadedResource {
  buffer: Buffer;
  sha256: string;
}

/** Descarga un recurso CKAN a memoria y calcula su hash — sección 28 (idempotencia): el
 * `fileHash` es lo que realmente detecta "¿este contenido ya se importó?", no la URL (que
 * puede rotar) ni el `resourceId` solo (CKAN reusa IDs de recurso para el mismo slot de día
 * de la semana, confirmado contra el feed real — mismo `id`, contenido nuevo cada semana). */
export async function downloadResource(url: string): Promise<DownloadedResource> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Descarga de ${url} -> HTTP ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const sha256 = createHash("sha256").update(buffer).digest("hex");
  return { buffer, sha256 };
}
