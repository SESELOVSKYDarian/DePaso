# Reglas de negocio

Fuente: Blueprint Legal & Funcional v1.0.

## Motor de decisión — reglas de exposición (cross-ref producto)

El score no se expone como número técnico; se traduce a costo, desvío, tiempo y paradas. Detalle
completo del score conceptual y modos: [../brand-product/PRODUCT.md](../brand-product/PRODUCT.md).
**Restricción obligatoria:** las restricciones marcadas "obligatorio" por el usuario se aplican
**antes** del ranking, no como penalización posterior.

## Sistema comunitario de precios — modelo de confianza (p.6)

| Estado | Cuándo | UI |
|---|---|---|
| Informado | Fuente oficial/tienda o reporte único confiable | Monto + fuente + actualización |
| Confirmado | Varios reportes independientes coinciden | "Confirmado por X reportes" |
| Discutido | Hay reportes alternativos sin consenso | Mantener monto + "otros reportan distinto" |
| En revisión | Anomalía, salto extremo o ataque | No usar para optimización o bajar confianza |
| Vencido | Superó umbral de antigüedad | "Puede estar desactualizado" |

**Principio obligatorio:** nunca presentar el precio como garantía. Mostrar sucursal, fuente,
fecha/hora, estado de confianza y una advertencia breve de variación. (p.6)

## Regla de consenso propuesta (p.7)

No se recomienda una regla fija tipo "3 usuarios ganan". Debe combinar cantidad, independencia,
recencia, confianza del reportante y dispersión de valores. **La cifra exacta se calibra con datos
reales** — lo siguiente es un ejemplo de partida, no un valor cerrado:

> Ejemplo inicial de MVP: actualizar automáticamente si existen ≥5 reportes independientes en 24h,
> al menos 70% cae dentro de ±1%/tolerancia del mismo precio, y la mediana ponderada supera un
> umbral de confianza. Si no, mantener "precio discutido".

**Pseudológica de actualización (p.7):**
1. Agrupar por product_id + branch_id + ventana temporal.
2. Descartar duplicados/sospechosos y reportes de baja confianza.
3. Calcular mediana ponderada y dispersión.
4. Si consenso ≥ umbral: promover precio comunitario.
5. Si hay conflicto: conservar precio anterior + mostrar alternativos.
6. Si hay evidencia fuerte (ticket/góndola) y fuente más reciente: elevar confianza.
7. Guardar audit log de cada cambio — **nunca sobreescribir sin histórico**.

**Reglas de independencia (obligatorias):**
- Una cuenta no puede votar varias veces el mismo producto/sucursal en la misma ventana temporal.
- No contar cuentas creadas en masa con igual dispositivo/IP como independientes.
- No publicar el trust score exacto (evita gaming); sí permitir apelación/moderación.

## Anti-fraude y moderación (p.8)

| Control | Objetivo |
|---|---|
| Rate limits | Evitar carga masiva y vandalismo |
| Reputación ponderada | Más peso a historial consistente, sin crear élites permanentes |
| Geofence opcional | Confirmar reporte cerca del comercio sin guardar tracking |
| Evidencia | Ticket/góndola aumenta confianza; nunca obligatoria para uso normal |
| Detección de outliers | Enviar saltos imposibles a revisión |
| Auditoría | Conservar quién/qué cambió, acceso restringido |
| Apelación | Permitir objetar moderación del propio aporte |

**Criterio de moderación (obligatorio):** neutral y explicable. Suspender por manipulación
intencional, fraude, automatización abusiva, acoso o contenido ilegal — **no** por discrepar de un
precio si el reporte fue de buena fe.

## Cómo mostrar precios sin convertirlos en garantía (p.9)

Componentes obligatorios de cada precio mostrado: Monto, Sucursal, Fuente, Recencia ("Actualizado
hace 2h"), Confianza ("6 reportes coinciden"), Disputa si existe ("2 usuarios reportaron $3.590"),
Aviso ("Puede variar. Verificá el precio final en el comercio.").

**Microcopy legal obligatorio:** "Los precios y ahorros son estimaciones informativas y pueden variar
por sucursal, stock, promociones, medios de pago o actualizaciones. Verificá el precio final en el
comercio."

**Frases prohibidas:** "Precio garantizado" · "Siempre el más barato" · "100% verificado" (si depende
de terceros) · "Ahorrás $X sí o sí".

## Promociones, bancos y ahorro neto (p.10)

Sólo aplicar promociones cuando se cumplen sus condiciones (medio de pago, banco, fidelidad, día,
tope, productos alcanzados). **Restricción obligatoria:** mostrar ahorro bruto sin esas condiciones
puede resultar engañoso (Ley 24.240).

| Dato | Cómo manejarlo |
|---|---|
| Banco/tarjeta | Guardar sólo elegibilidad/preferencia; **no** número completo de tarjeta |
| Tope reintegro | Incluirlo en el cálculo |
| Día de promo | Validar contra fecha del plan |
| Cuotas/condiciones | Mostrar resumen + link a fuente |
| Promoción dudosa | No aplicar automáticamente; mostrar como alternativa |

## Patrocinios, afiliados y conflictos de interés (p.17)

| Permitido | No recomendado |
|---|---|
| Card separada "Patrocinado" | Alterar Top 3 sin avisar |
| Comisión por click claramente revelada | Ocultar relación comercial |
| Oferta destacada fuera del score | Subir score por pago |
| Explicar criterios de ranking | Afirmar neutralidad si existe pay-to-rank |

**Regla obligatoria:** si DePaso monetiza con supermercados o publicidad, el ranking orgánico debe
mantenerse independiente — un comercio no puede comprar el primer puesto.

## Normas de la comunidad de precios (p.26)

1. Reportar el precio realmente visto y la sucursal correcta.
2. Indicar si el precio requiere promoción, tarjeta, club o cantidad mínima.
3. No votar para favorecer o perjudicar a un comercio.
4. No usar múltiples cuentas, bots ni grupos coordinados.
5. Si se adjunta foto, evitar datos personales de terceros y datos completos de pago.
6. Reportes pueden ser ponderados, ocultados o enviados a revisión si son anómalos.
7. Reportar distinto a otros no es infracción — el problema es la manipulación deliberada.
8. DePaso puede mostrar varios precios cuando no hay consenso suficiente.
9. La comunidad ayuda a mejorar la información; el comercio conserva el precio final aplicable al
   momento de la compra.

## NO DEFINIDO

- Umbral numérico definitivo de consenso (el ejemplo del MVP es punto de partida, a calibrar con
  datos reales).
- Ventana temporal exacta para "vencido" / desactualizado.
- Fórmula exacta del trust score / reputación ponderada.
- Modelo de comisión por click o esquema de monetización con patrocinios (sólo principios, no
  términos comerciales).
