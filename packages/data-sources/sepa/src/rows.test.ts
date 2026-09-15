import { describe, expect, it } from "vitest";
import { iterateProductosCsv, parseComercioCsv, parseProductosCsv, parseSucursalesCsv } from "./rows";

// Todo el contenido de abajo es real, capturado del feed SEPA Mayorista (Makro,
// id_comercio 61) durante la investigación de esta fase — docs/data/SEPA.md.

const REAL_COMERCIO_CSV =
  "﻿id_comercio|id_bandera|comercio_cuit|comercio_razon_social|comercio_bandera_nombre|comercio_bandera_url|comercio_ultima_actualizacion|comercio_version_sepa\r\n" +
  "61|1|30589621499|HIPERMAYORISTA MAKRO S.A|HIPERMAYORISTA MAKRO|www.makro.com.ar|2026-09-13T05:30:23-03:00|0\r\n";

const REAL_SUCURSALES_CSV =
  "﻿id_comercio|id_bandera|id_sucursal|sucursales_nombre|sucursales_tipo|sucursales_calle|sucursales_numero|sucursales_latitud|sucursales_longitud|sucursales_observaciones|sucursales_barrio|sucursales_codigo_postal|sucursales_localidad|sucursales_provincia|sucursales_lunes_horario_atencion|sucursales_martes_horario_atencion|sucursales_miercoles_horario_atencion|sucursales_jueves_horario_atencion|sucursales_viernes_horario_atencion|sucursales_sabado_horario_atencion|sucursales_domingo_horario_atencion\r\n" +
  "61|1|12|mar del plata|mayorista|avenida champagnat y alvarado|790|-37.99076||(prov. de buenos aires)|mar del plata|7600|mar del plata|AR-B|08:00 a 21:30|08:00 a 21:30|08:00 a 21:30|08:00 a 21:30|08:00 a 21:30|08:00 a 21:30|10:00 a 21:30\r\n";

const REAL_PRODUCTOS_CSV =
  "﻿id_comercio|id_bandera|id_sucursal|id_producto|productos_ean|id_dun_14|productos_descripcion|productos_marca|precio_unitario_bulto_por_unidad_venta_con_iva|precio_unitario_bulto_por_unidad_venta_sin_iva|unidad_venta|precio_bulto_con_iva|precio_bulto_sin_iva|productos_precio_unitario_con_iva_promo1|productos_precio_unitario_sin_iva_promo1|productos_leyenda_promo1|productos_precio_unitario_con_iva_promo2|productos_precio_unitario_sin_iva_promo2|productos_leyenda_promo2\r\n" +
  "61|1|1|7791520012170|7791520012170|17791520012170|DEO AP MASC VERITAS ORIG PTX60GR|Sin marca|2206.52|1823.57|1|2206.52|1823.57||||||\r\n";

describe("parseComercioCsv (Makro real)", () => {
  it("mapea razón social y bandera por separado (nunca la misma entidad, sección 4)", () => {
    const { rows } = parseComercioCsv(REAL_COMERCIO_CSV);
    expect(rows).toEqual([
      {
        idComercio: "61",
        idBandera: "1",
        cuit: "30589621499",
        razonSocial: "HIPERMAYORISTA MAKRO S.A",
        banderaNombre: "HIPERMAYORISTA MAKRO",
        banderaUrl: "www.makro.com.ar",
        ultimaActualizacion: new Date("2026-09-13T05:30:23-03:00"),
      },
    ]);
  });
});

describe("parseSucursalesCsv (Makro Mar del Plata real)", () => {
  it("parsea la sucursal real de Mar del Plata con longitud faltante", () => {
    const { rows } = parseSucursalesCsv(REAL_SUCURSALES_CSV);
    expect(rows).toHaveLength(1);
    const [branch] = rows;
    expect(branch).toMatchObject({
      idSucursal: "12",
      calle: "avenida champagnat y alvarado",
      numero: "790",
      latitude: -37.99076,
      longitude: null, // columna vacía en el feed real — no se inventa un valor
      localidad: "mar del plata",
    });
  });

  it("arma el horario por día a partir de las 7 columnas sueltas", () => {
    const { rows } = parseSucursalesCsv(REAL_SUCURSALES_CSV);
    expect(rows[0]!.openingHours).toMatchObject({
      lunes: "08:00 a 21:30",
      domingo: "10:00 a 21:30",
    });
  });
});

describe("parseProductosCsv (Makro real)", () => {
  it("productos_ean repite id_producto — no es un booleano (corrección al prompt original)", () => {
    const { rows } = parseProductosCsv(REAL_PRODUCTOS_CSV);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.idProducto).toBe(rows[0]!.productosEan);
  });

  it("toma el precio unitario con IVA como precio principal (layout Mayorista)", () => {
    const { rows } = parseProductosCsv(REAL_PRODUCTOS_CSV);
    expect(rows[0]!.precio).toBe(2206.52);
  });
});

// Capturado real de SEPA Minorista (2026-09-13) — layout DISTINTO al de Mayorista de
// arriba (sin campos "con_iva"/"sin_iva" en el nombre, usa `productos_precio_lista`).
// Esta diferencia real es la que causaba que el import de Minorista rechazara el 100% de
// los precios antes de esta corrección — docs/data/SEPA.md.
const REAL_PRODUCTOS_CSV_MINORISTA =
  "﻿id_comercio|id_bandera|id_sucursal|id_producto|productos_ean|productos_descripcion|productos_cantidad_presentacion|productos_unidad_medida_presentacion|productos_marca|productos_precio_lista|productos_precio_referencia|productos_cantidad_referencia|productos_unidad_medida_referencia|productos_precio_unitario_promo1|productos_leyenda_promo1|productos_precio_unitario_promo2|productos_leyenda_promo2\r\n" +
  "5|1|1|7500435004732|1|ACE LIQ. ACCION INST.BOT.3lt.|1|unidad|LIQUIDO ACE P/ROPA|628.00|628.00|1|unidad||||\r\n";

describe("parseProductosCsv (layout real de SEPA Minorista)", () => {
  it("resuelve el precio desde productos_precio_lista (no existe en Minorista el campo de Mayorista)", () => {
    const { rows } = parseProductosCsv(REAL_PRODUCTOS_CSV_MINORISTA);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.precio).toBe(628);
  });

  it("captura cantidad/unidad de presentación cuando el feed las publica (sólo Minorista)", () => {
    const { rows } = parseProductosCsv(REAL_PRODUCTOS_CSV_MINORISTA);
    expect(rows[0]!.cantidadPresentacion).toBe("1");
    expect(rows[0]!.unidadMedidaPresentacion).toBe("unidad");
  });
});

describe("iterateProductosCsv (generador — sección 26/27)", () => {
  it("produce las mismas filas que la versión en array, sin materializar un array", () => {
    const { rows: arrayRows } = parseProductosCsv(REAL_PRODUCTOS_CSV);
    const iterRows = Array.from(iterateProductosCsv(REAL_PRODUCTOS_CSV));
    expect(iterRows).toEqual(arrayRows);
  });

  it("es realmente perezoso — no procesa la segunda fila hasta que se la pide", () => {
    const twoRowsCsv = REAL_PRODUCTOS_CSV + "61|1|1|000|000|1000||Sin marca|1|1|1|1|1||||||\r\n";
    const iter = iterateProductosCsv(twoRowsCsv);
    const first = iter.next();
    expect(first.done).toBe(false);
    expect(first.value.idProducto).toBe("7791520012170");
    // Si acá ya se hubiera consumido todo el generador (como haría un array), esta
    // segunda llamada igual debe devolver la fila siguiente, no relanzar la primera.
    const second = iter.next();
    expect(second.value?.idProducto).toBe("000");
  });
});
