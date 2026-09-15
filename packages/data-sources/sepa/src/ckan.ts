/**
 * Cliente CKAN desacoplado (sección 2 del master prompt SEPA). Nunca hardcodear la URL
 * física de un ZIP diario — se resuelve por metadata (`last_modified`) contra el paquete
 * CKAN. Confirmado contra el dominio real `datos.produccion.gob.ar` (docs/data/SEPA.md).
 */

const CKAN_BASE_URL = "https://datos.produccion.gob.ar/api/3/action";

export interface CkanResource {
  id: string;
  name: string;
  format: string;
  url: string;
  lastModified: string;
  size: number;
  description: string;
}

export interface CkanPackage {
  id: string;
  name: string;
  title: string;
  resources: CkanResource[];
}

interface CkanApiResource {
  id: string;
  name: string;
  format: string;
  url: string;
  last_modified: string | null;
  created: string | null;
  size: number | null;
  description: string | null;
}

interface CkanApiPackage {
  id: string;
  name: string;
  title: string;
  resources: CkanApiResource[];
}

interface CkanApiResponse<T> {
  success: boolean;
  result: T;
  error?: { message: string };
}

export class CkanError extends Error {}

export interface CkanClient {
  getPackage(packageId: string): Promise<CkanPackage>;
  getResources(packageId: string): Promise<CkanResource[]>;
  /** El recurso más reciente por `last_modified`/`created` — nunca asumir que un nombre
   * fijo (ej. "Domingo") es siempre "hoy": los recursos rotan por día de la semana. */
  getLatestResource(packageId: string, formatFilter?: string): Promise<CkanResource>;
}

function toResource(r: CkanApiResource): CkanResource {
  return {
    id: r.id,
    name: r.name,
    format: r.format,
    url: r.url,
    lastModified: r.last_modified ?? r.created ?? "",
    size: r.size ?? 0,
    description: r.description ?? "",
  };
}

export function createCkanClient(baseUrl: string = CKAN_BASE_URL): CkanClient {
  async function getPackage(packageId: string): Promise<CkanPackage> {
    const response = await fetch(`${baseUrl}/package_show?id=${encodeURIComponent(packageId)}`);
    if (!response.ok) {
      throw new CkanError(`CKAN package_show(${packageId}) -> HTTP ${response.status}`);
    }
    const json = (await response.json()) as CkanApiResponse<CkanApiPackage>;
    if (!json.success) {
      throw new CkanError(`CKAN package_show(${packageId}) failed: ${json.error?.message ?? "unknown"}`);
    }
    return {
      id: json.result.id,
      name: json.result.name,
      title: json.result.title,
      resources: json.result.resources.map(toResource),
    };
  }

  async function getResources(packageId: string): Promise<CkanResource[]> {
    const pkg = await getPackage(packageId);
    return pkg.resources;
  }

  async function getLatestResource(packageId: string, formatFilter = "ZIP"): Promise<CkanResource> {
    const resources = await getResources(packageId);
    const candidates = resources.filter((r) => r.format.toUpperCase() === formatFilter.toUpperCase());
    if (candidates.length === 0) {
      throw new CkanError(`No hay recursos de formato ${formatFilter} en el paquete ${packageId}`);
    }
    return candidates.reduce((latest, current) =>
      new Date(current.lastModified).getTime() > new Date(latest.lastModified).getTime() ? current : latest
    );
  }

  return { getPackage, getResources, getLatestResource };
}

/** IDs de paquete confirmados contra el portal real (docs/data/SEPA.md) — no inventados,
 * resueltos vía `package_search` durante la investigación de esta fase. */
export const SEPA_PACKAGE_IDS = {
  MINORISTA: "sepa-precios",
  MAYORISTA: "precios-claros-sepa-mayoristas",
} as const;
