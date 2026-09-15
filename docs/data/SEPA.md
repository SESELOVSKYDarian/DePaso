# SEPA — estructura real del dataset

Fuente: investigación real contra el portal (2026-09-13), no la especificación asumida sin
verificar. Ver `docs/development/DECISIONS.md` para las decisiones tomadas a partir de esto.

## Paquetes CKAN

Dominio: `datos.produccion.gob.ar`, API CKAN estándar (`package_show`, `package_search`).

| Feed | Package ID | Tamaño/día | Confirmado |
|---|---|---|---|
| SEPA Minorista | `sepa-precios` | ~325-337MB | Sí — `package_show` real |
| SEPA Mayorista | `precios-claros-sepa-mayoristas` | ~8-15MB | Sí — resuelto vía `package_search` |

Cada paquete publica **7 recursos ZIP, uno por día de la semana** (`Lunes`...`Domingo`), más
un XLSX de códigos provinciales y un PDF de metadata (Anexo II Res. 678/2020 minorista /
Res. 448 mayorista). **El recurso rota de contenido cada semana pero reusa el mismo
`resourceId`** para el mismo día — confirmado real (no asumido): por eso la idempotencia
(`DataImportRun`) se calcula por `fileHash`, no por `resourceId` (ver DECISIONS.md).

## Estructura del ZIP — corrección al supuesto original

El master prompt original asumía `comercio.csv`/`sucursales.csv`/`productos.csv` sueltos
dentro del ZIP del día. **Real:** el ZIP del día contiene un **ZIP anidado por
`id_comercio`** (ej. `sepa_1_comercio-sepa-9_2026-09-13_09-05-11.zip`), y recién adentro de
ESE ZIP están los 3 CSV. Confirmado descargando y abriendo el feed real, mismo layout en
Minorista y Mayorista. Un ZIP anidado puede venir de **0 bytes** (comercio sin datos ese
día, confirmado real en Minorista) — hay que tolerarlo, no asumir que siempre es un ZIP
válido.

Delimitador `|` (pipe), UTF-8 con BOM, CRLF — esto sí coincidía con el supuesto original.
Los archivos reales suelen traer una línea de pie sin el mismo número de columnas
("Última actualización: ...") que el parser descarta en vez de romper.

## Encabezados reales — `comercio.csv`/`sucursales.csv` idénticos, `productos.csv` NO

**`comercio.csv`** — una fila por `(id_comercio, id_bandera)`, no por comercio (idéntico en
ambos feeds):
```
id_comercio|id_bandera|comercio_cuit|comercio_razon_social|comercio_bandera_nombre|comercio_bandera_url|comercio_ultima_actualizacion|comercio_version_sepa
```

**`sucursales.csv`** (idéntico en ambos feeds):
```
id_comercio|id_bandera|id_sucursal|sucursales_nombre|sucursales_tipo|sucursales_calle|sucursales_numero|sucursales_latitud|sucursales_longitud|sucursales_observaciones|sucursales_barrio|sucursales_codigo_postal|sucursales_localidad|sucursales_provincia|sucursales_{lunes..domingo}_horario_atencion
```
`sucursales_longitud` viene vacía con frecuencia (confirmado real, no hipotético) —
`sucursales_localidad` viene con casing inconsistente ("Mar del Plata" / "MAR DEL PLATA" /
"Mar Del Plata").

**`productos.csv` — corrección real importante: el layout es DISTINTO entre feeds.** La
primera pasada de esta investigación (con SEPA Mayorista) asumió que ambos feeds
compartían el mismo layout de `productos.csv` — **falso**, confirmado al conectar
Minorista: el import rechazó el 100% de los precios porque las columnas de precio no
existen con ese nombre en Minorista.

**Mayorista:**
```
id_comercio|id_bandera|id_sucursal|id_producto|productos_ean|id_dun_14|productos_descripcion|productos_marca|precio_unitario_bulto_por_unidad_venta_con_iva|precio_unitario_bulto_por_unidad_venta_sin_iva|unidad_venta|precio_bulto_con_iva|precio_bulto_sin_iva|productos_precio_unitario_con_iva_promo1|productos_precio_unitario_sin_iva_promo1|productos_leyenda_promo1|productos_precio_unitario_con_iva_promo2|productos_precio_unitario_sin_iva_promo2|productos_leyenda_promo2
```

**Minorista:**
```
id_comercio|id_bandera|id_sucursal|id_producto|productos_ean|productos_descripcion|productos_cantidad_presentacion|productos_unidad_medida_presentacion|productos_marca|productos_precio_lista|productos_precio_referencia|productos_cantidad_referencia|productos_unidad_medida_referencia|productos_precio_unitario_promo1|productos_leyenda_promo1|productos_precio_unitario_promo2|productos_leyenda_promo2
```

Diferencias reales: Minorista no tiene `id_dun_14`; el precio principal se llama
`productos_precio_lista` (no `precio_unitario_bulto_por_unidad_venta_con_iva`); los promos
no distinguen con/sin IVA en el nombre del campo; y Minorista **sí publica**
`productos_cantidad_presentacion`/`productos_unidad_medida_presentacion` (Mayorista no) —
aunque en la práctica suele venir como "1 unidad" (la unidad de venta, no necesariamente el
tamaño físico del producto — sección 8, se sigue sin reemplazar el heurístico de
`productParsing.ts` sin más muestras).

`toProductoRow` (`packages/data-sources/sepa/src/rows.ts`) no asume un layout fijo: toma el
primer campo de precio que exista en la fila, cualquiera sea el feed.

**Corrección importante (ambos feeds):** `productos_ean` NO es un indicador booleano de "es
EAN real" (como asumía el prompt original) — en el feed real repite el mismo valor que
`id_producto` sea o no un GTIN válido. La confirmación real de EAN se hace validando el
dígito verificador (checksum GTIN-8/12/13/14), implementado en
`packages/data-sources/sepa/src/normalize.ts` (`isValidGtinChecksum`).

Categoría de producto: ninguno de los dos feeds la publica — `category` queda como
placeholder `"Sin categorizar (SEPA)"` hasta que un admin reclasifique a mano.

## Comercios confirmados en Mar del Plata (2026-09-13, dato real, no seed)

Validado contra el feed vivo, Mayorista y Minorista — ver `docs/development/PROGRESS.md`
para las corridas completas:

**Minorista (53 sucursales en 9 banderas):**

| Bandera | Sucursales MDP |
|---|---|
| Toledo | 23 (de 31 nacionales — coincide con "prioridad alta" del prompt) |
| Supermercados DIA | 9 |
| Disco (Cencosud, bandera 2) | 5 |
| Carrefour Express (INC S.A., bandera 3) | 5 |
| Cooperativa Obrera Limitada de Consumo y Vivienda | 4 |
| Vea (Cencosud, bandera 1) | 3 |
| Carrefour Market (INC S.A., bandera 2) | 2 |
| COTO CICSA | 1 (sucursal 238, Av. Jorge Newbery 4750 — match exacto con el seed; sucursal 242 "Puerto" NO está en el feed hoy) |
| Hipermercado Carrefour (INC S.A., bandera 1) | 1 |

**Mayorista (3 sucursales):** HIPERMAYORISTA MAKRO S.A. (Av. Champagnat y Alvarado — match
exacto con el seed), Maxiconsumo, Mayorista Yaguar — 1 sucursal cada uno.

## NO DEFINIDO / brechas conocidas

- Categoría de producto: ninguno de los dos feeds la publica — placeholder, no
  clasificación real.
- Matching de producto sin EAN válido: por nombre normalizado, con riesgo de duplicados
  (el prompt original ya anticipaba esto en su sección 8).
- Vital, El Gauchito, Hergo (mayoristas mencionados en el prompt original) no aparecieron
  en el feed de 6 comercios mayoristas de la corrida real — no se inventaron, quedan
  pendientes de la próxima corrida (el feed puede variar día a día).
- Jumbo (Cencosud) no tiene sucursal en Mar del Plata en el feed actual — sólo Vea/Disco.
- `productos_cantidad_presentacion`/`productos_unidad_medida_presentacion` (Minorista) se
  capturan pero no reemplazan el heurístico de extracción de unidad/cantidad — sólo se vio
  "1 unidad" en las muestras reales, no aporta el tamaño físico del producto todavía.
