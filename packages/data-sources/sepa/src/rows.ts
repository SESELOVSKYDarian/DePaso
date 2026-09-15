/**
 * Filas tipadas de cada CSV de SEPA. Encabezados confirmados contra el feed real
 * (SEPA Mayorista y Minorista, mismo layout) — docs/data/SEPA.md, no adivinados de la
 * especificación en PDF sin verificar.
 */
import { iteratePipeDelimitedCsv, parsePipeDelimitedCsv } from "./parseCsv";

export interface ComercioRow {
  idComercio: string;
  idBandera: string;
  cuit: string;
  razonSocial: string;
  banderaNombre: string;
  banderaUrl: string | null;
  ultimaActualizacion: Date | null;
}

export interface ParseResult<T> {
  rows: T[];
  skippedLines: number;
}

function toDate(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toFloat(value: string): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function parseComercioCsv(content: string): ParseResult<ComercioRow> {
  const { rows: raw, skippedLines } = parsePipeDelimitedCsv(content);
  const rows = raw
    // Sección 29 — fila sin CUIT o razón social no sirve para nada, se descarta (no se
    // "arregla" inventando un valor).
    .filter((r) => r.id_comercio && r.comercio_cuit)
    .map(
      (r): ComercioRow => ({
        idComercio: r.id_comercio!,
        idBandera: r.id_bandera!,
        cuit: r.comercio_cuit!,
        razonSocial: r.comercio_razon_social!,
        banderaNombre: r.comercio_bandera_nombre || r.comercio_razon_social!,
        banderaUrl: r.comercio_bandera_url || null,
        ultimaActualizacion: toDate(r.comercio_ultima_actualizacion ?? ""),
      })
    );
  return { rows, skippedLines };
}

export interface SucursalRow {
  idComercio: string;
  idBandera: string;
  idSucursal: string;
  nombre: string;
  tipo: string;
  calle: string;
  numero: string;
  latitude: number | null;
  longitude: number | null;
  barrio: string | null;
  codigoPostal: string | null;
  localidad: string;
  provincia: string;
  /** Un valor libre por día, tal como lo publica SEPA (sección 5) — sin estructurar. */
  openingHours: Record<string, string>;
}

const WEEKDAY_FIELDS = [
  ["lunes", "sucursales_lunes_horario_atencion"],
  ["martes", "sucursales_martes_horario_atencion"],
  ["miercoles", "sucursales_miercoles_horario_atencion"],
  ["jueves", "sucursales_jueves_horario_atencion"],
  ["viernes", "sucursales_viernes_horario_atencion"],
  ["sabado", "sucursales_sabado_horario_atencion"],
  ["domingo", "sucursales_domingo_horario_atencion"],
] as const;

export function parseSucursalesCsv(content: string): ParseResult<SucursalRow> {
  const { rows: raw, skippedLines } = parsePipeDelimitedCsv(content);
  const rows = raw
    .filter((r) => r.id_comercio && r.id_sucursal)
    .map((r): SucursalRow => {
      const openingHours: Record<string, string> = {};
      for (const [day, field] of WEEKDAY_FIELDS) {
        if (r[field]) openingHours[day] = r[field]!;
      }
      return {
        idComercio: r.id_comercio!,
        idBandera: r.id_bandera!,
        idSucursal: r.id_sucursal!,
        nombre: r.sucursales_nombre || `Sucursal ${r.id_sucursal}`,
        tipo: r.sucursales_tipo || "",
        calle: r.sucursales_calle || "",
        numero: r.sucursales_numero || "",
        // Sección 5/15 — la longitud viene vacía con frecuencia en el feed real; no se
        // geocodifica acá (sección 42: sólo cuando falten, y eso es responsabilidad del
        // import job, no del parser).
        latitude: toFloat(r.sucursales_latitud ?? ""),
        longitude: toFloat(r.sucursales_longitud ?? ""),
        barrio: r.sucursales_barrio || null,
        codigoPostal: r.sucursales_codigo_postal || null,
        localidad: r.sucursales_localidad || "",
        provincia: r.sucursales_provincia || "",
        openingHours,
      };
    });
  return { rows, skippedLines };
}

/**
 * Layout DISTINTO entre Mayorista y Minorista — corrección real (no supuesta): se asumía
 * el mismo `productos.csv` para ambos feeds (docs/data/SEPA.md original), pero Minorista
 * usa `productos_precio_lista`/`productos_precio_referencia` (sin distinción con/sin IVA
 * en el nombre del campo) donde Mayorista usa
 * `precio_unitario_bulto_por_unidad_venta_con_iva`/`precio_bulto_con_iva`. Confirmado
 * descargando y leyendo el feed real de Minorista — antes de esta corrección, el import
 * de Minorista rechazaba el 100% de los precios (campo esperado no existía en esas filas).
 * `toProductoRow` no asume un layout fijo: toma el primer campo de precio que exista.
 */
function firstNonEmpty(...values: (string | undefined)[]): string | undefined {
  return values.find((v) => v !== undefined && v !== "");
}

export interface ProductoRow {
  idComercio: string;
  idBandera: string;
  idSucursal: string;
  idProducto: string;
  /** Mismo valor que `idProducto` en el feed real — NO es un booleano que indique "es
   * EAN" (corrección al prompt original, sección 6/7 — ver docs/data/SEPA.md). La
   * confirmación real de EAN se hace con `isValidGtinChecksum` en normalize.ts. */
  productosEan: string;
  descripcion: string;
  marca: string;
  unidadVenta: string;
  /** Precio principal a usar — ya resuelto contra el layout real del feed (Mayorista o
   * Minorista), sin que el caller tenga que conocer los nombres de columna. */
  precio: number | null;
  /** `productos_cantidad_presentacion`/`productos_unidad_medida_presentacion` — sólo
   * Minorista los publica (confirmado real); Mayorista no tiene equivalente. Es la
   * cantidad de venta ("1 unidad"), no necesariamente el tamaño físico del producto — no
   * reemplaza el heurístico de `productParsing.ts` sin más muestras reales. */
  cantidadPresentacion: string | null;
  unidadMedidaPresentacion: string | null;
  promo1Precio: number | null;
  promo1Leyenda: string | null;
  promo2Precio: number | null;
  promo2Leyenda: string | null;
}

function toProductoRow(r: Record<string, string>): ProductoRow | null {
  // Sección 29 — sin producto o sin sucursal no hay nada que guardar.
  if (!r.id_producto || !r.id_sucursal) return null;

  const precioRaw = firstNonEmpty(
    r.precio_unitario_bulto_por_unidad_venta_con_iva, // Mayorista
    r.productos_precio_lista, // Minorista
    r.precio_bulto_con_iva, // Mayorista, fallback
    r.productos_precio_referencia // Minorista, fallback
  );
  const promo1Raw = firstNonEmpty(r.productos_precio_unitario_con_iva_promo1, r.productos_precio_unitario_promo1);
  const promo2Raw = firstNonEmpty(r.productos_precio_unitario_con_iva_promo2, r.productos_precio_unitario_promo2);

  return {
    idComercio: r.id_comercio!,
    idBandera: r.id_bandera!,
    idSucursal: r.id_sucursal!,
    idProducto: r.id_producto!,
    productosEan: r.productos_ean || r.id_producto!,
    descripcion: r.productos_descripcion || "",
    marca: r.productos_marca || "",
    unidadVenta: r.unidad_venta || "1",
    precio: toFloat(precioRaw ?? ""),
    cantidadPresentacion: r.productos_cantidad_presentacion || null,
    unidadMedidaPresentacion: r.productos_unidad_medida_presentacion || null,
    promo1Precio: toFloat(promo1Raw ?? ""),
    promo1Leyenda: r.productos_leyenda_promo1 || null,
    promo2Precio: toFloat(promo2Raw ?? ""),
    promo2Leyenda: r.productos_leyenda_promo2 || null,
  };
}

/** Uso: fixtures/tests y `productos.csv` chico (SEPA Mayorista). Materializa todo a un
 * array — para SEPA Minorista (puede ser cientos de MB por comercio) usar
 * `iterateProductosCsv`. */
export function parseProductosCsv(content: string): ParseResult<ProductoRow> {
  const { rows: raw, skippedLines } = parsePipeDelimitedCsv(content);
  const rows = raw.map(toProductoRow).filter((r): r is ProductoRow => r !== null);
  return { rows, skippedLines };
}

/** Generador — nunca materializa un array de todas las filas (ver
 * `iteratePipeDelimitedCsv` en parseCsv.ts, sección 26/27: esto es lo que evita el
 * "JavaScript heap out of memory" real que produjo la versión basada en array contra
 * SEPA Minorista). */
export function* iterateProductosCsv(content: string): Generator<ProductoRow> {
  const { rows } = iteratePipeDelimitedCsv(content);
  for (const raw of rows) {
    const row = toProductoRow(raw);
    if (row) yield row;
  }
}
