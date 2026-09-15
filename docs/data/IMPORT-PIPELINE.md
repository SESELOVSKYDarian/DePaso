# Pipeline de import SEPA

Implementación: `packages/geo` (scope geográfico, puro) + `packages/data-sources/sepa`
(CKAN, descarga, parseo, persistencia). Ver `docs/data/SEPA.md` para la estructura real del
dataset y `docs/development/DECISIONS.md` para las decisiones de diseño.

## Alcance de esta fase

**SEPA Mayorista y Minorista conectados end-to-end contra Postgres real.** Ver
`docs/development/PROGRESS.md` para las corridas reales de ambos.

**Streaming real (sección 26), no sólo "en memoria":** un primer intento de conectar
Minorista con el mismo enfoque de Mayorista ("leer cada comercio entero, parsear todo a un
array") produjo un `JavaScript heap out of memory` real (un solo comercio de Minorista
puede decodificar a cientos de MB de `productos.csv` — confirmado, no hipotético). Se
corrigió con dos cambios de forma, no de volumen de datos:

- `iterateSepaDailyArchive` (generador) en vez de `readSepaDailyArchive` (array) — procesa
  un comercio a la vez; el anterior queda disponible para el recolector de basura antes de
  leer el siguiente.
- `iterateProductosCsv` (generador) en vez de `parseProductosCsv` (array) — nunca
  materializa un array con todas las filas de `productos.csv` de un comercio (puede ser
  nacional, millones de filas); cada fila se filtra contra la whitelist de sucursales de la
  región y se descarta antes de pedir la siguiente.

Ambas funciones "en array" se conservan para tests/fixtures chicos — el import job real usa
sólo las versiones generador.

## Pasos (`runSepaImport`, `packages/data-sources/sepa/src/importJob.ts`)

1. `CkanClient.getLatestResource(packageId, "ZIP")` — nunca una URL fija; se resuelve por
   `last_modified` contra el paquete CKAN real.
2. Descargar el ZIP a memoria, calcular `sha256`.
3. Buscar `DataImportRun` existente por `(source, fileHash)` — si ya se importó ese
   contenido exacto, no se reprocesa (idempotencia real, no por `resourceId`: CKAN reusa
   el mismo id para el mismo día de la semana cada semana).
4. Crear `DataImportRun` (`status: RUNNING`) salvo `--dry-run`.
5. `iterateSepaDailyArchive` — abre el ZIP anidado, un comercio a la vez (ver SEPA.md).
6. Por cada comercio: `comercio.csv` → upsert `StoreCompany` (por CUIT) + `Store` (por
   `companyId`+`id_bandera`, la "bandera" comercial — ej. Cencosud tiene 3: Vea/Disco/Jumbo).
7. `sucursales.csv` → `GeoScopeService.classify(lat, lon, localidad)` contra la
   `MarketRegion` configurada (hoy: Mar del Plata). Sólo las sucursales dentro de scope se
   upsertean como `StoreBranch`; el resto se descarta ANTES de tocar `productos.csv`
   (sección 14 — nunca procesar precios fuera de la región configurada). Coordenadas y
   localidad que se contradicen generan un `BranchDataIssue` (sección 43), no una decisión
   silenciosa.
8. `productos.csv` → `iterateProductosCsv` fila por fila, filtrado por la whitelist de
   sucursales del paso anterior. El precio se resuelve tomando el primer campo que exista
   en la fila (el layout de columnas es distinto entre Mayorista y Minorista — ver
   SEPA.md). Por fila aceptada: EAN validado por checksum GTIN tiene prioridad para
   matchear/crear `Product`+`ProductVariant`; sin EAN confiable, se cae a nombre
   normalizado (riesgo de duplicados documentado, sección 8 del prompt original). Precio
   inválido (nulo/NaN/≤0) se descarta y queda como `ImportAnomaly`, nunca se borra en
   silencio.
9. Precio: si ya existe un `Price` con el mismo `sourceExternalId`
   (`id_comercio|id_bandera|id_sucursal|id_producto`) y el monto cambió, se actualiza **y**
   se registra `PriceHistory` — nunca se sobreescribe sin histórico (BUSINESS-RULES.md p.7).
10. Al terminar: `DataImportRun` pasa a `SUCCESS`/`PARTIAL` con los contadores reales.

## CLI

```bash
pnpm data:sepa:inspect --wholesale   # dry-run real, no escribe nada
pnpm data:sepa:inspect --retail
pnpm data:sepa:import --wholesale    # persiste contra la DB configurada (DATABASE_URL)
pnpm data:sepa:import --retail
pnpm data:sepa:import --retail --dry-run
```

## Limitaciones conocidas (no ocultas)

- **Sin batching de escritura (sección 27 del prompt original)** — cada precio es su
  propio find+create/update secuencial. Con Mayorista (13k precios) tardó ~76s; Minorista
  (~211k precios en Mar del Plata) tarda del orden de 15-20 minutos. Correcto pero lento —
  batching de inserts es el siguiente paso real si se necesita re-importar seguido.
- Matching de producto sin EAN es por nombre normalizado, no semántico — puede crear
  variantes duplicadas para el mismo producto real si la descripción difiere lo suficiente
  entre comercios.
- `unit`/`unitSize` se extraen de texto libre con un heurístico (`productParsing.ts`) —
  Minorista publica `productos_cantidad_presentacion`/`unidad_medida_presentacion` pero en
  la práctica sólo se vio "1 unidad" (la unidad de venta, no el tamaño físico) — no
  reemplaza el heurístico todavía.
