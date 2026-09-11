# Producto

Fuente: Brand & Product Book v1.0.

## Idea rectora (p.2)

La unidad de valor no es "el precio más bajo"; es "la decisión que realmente te conviene hoy".

- Lanzamiento geográfico: **sólo Mar del Plata** (limita complejidad de catálogo, sucursales,
  moderación y datos) — obligatorio para MVP.
- Promesa: ahorrar dinero sin obligar a recorrer media ciudad.
- Diferencial: optimización por desvío sobre trayectos reales, lugares del día y preferencias de
  marca/comercio.
- Salida principal: **Top 3 de planes** — equilibrado, más rápido, máximo ahorro — con explicación
  simple del porqué.
- Confianza: cada precio muestra fuente, frescura y nivel de validación; la comunidad puede
  corregirlo sin ocultar incertidumbre.
- Privacidad: ubicación bajo demanda, minimización de datos, sin tracking continuo por defecto.

## Problema y oportunidad (p.3)

Un comparador tradicional sólo responde qué comercio tiene el menor precio, ignorando que el
usuario vive dentro de restricciones reales (rutina, preferencias, tiempo).

| Situación | Comparador clásico | Respuesta DePaso |
|---|---|---|
| Local $1.000 más barato pero a 8 km | Lo rankea primero | Puede descartarlo si el desvío real no compensa |
| Usuario pasa por otro súper al salir del trabajo | No conoce el recorrido | Lo considera casi costo de traslado cero |
| Sólo compra una marca de yerba | Muestra sustitutos | Respeta "obligatorio / preferido / cualquiera" |
| Carne siempre en la misma carnicería | Optimiza sólo cadenas | Fija el comercio y optimiza el resto alrededor |
| Precio desactualizado | Puede mostrarlo igual | Expone fuente, antigüedad y reportes comunitarios |

**Oportunidad de categoría:** crear la categoría mental "optimización de compra en camino": precio +
desvío + tiempo + preferencia (no competir sólo por catálogo).

## Benchmark competitivo (p.4)

| Referencia | Fortalezas | Hueco para DePaso |
|---|---|---|
| Precios Claros | 30 comercios cercanos, comparación de productos/listas, cambio de ubicación | No prioriza recorridos personales ni preferencias complejas |
| Comprando.ar | Cruza Precios Claros + tiendas online + comunidad; fuente visible | Excelente en datos; DePaso debe subir un nivel: "qué hacer hoy" |
| ShopSavvy | Comparación multi-retailer, stock, historial, alertas, top 3, barcode | Adaptar transparencia/ranking a compras locales y rutas |
| Flipp | Ofertas, folletos, lista orientada a ahorro | Inspiración en simplicidad, no en optimización por desvío |

Mapa de posicionamiento (conceptual, no medición de mercado): DePaso se ubica como único
"Asistente contextual" (alto en plan/decisión inteligente + alto en contexto personal/recorrido); el
resto de referencias son "sólo información" con bajo contexto personal.

## Audiencias y JTBD (p.6)

**JTBD primario:** "Cuando voy a hacer una compra, quiero saber dónde me conviene comprar los
productos que necesito considerando por dónde voy a pasar, para ahorrar sin agregar un viaje
absurdo."

| Perfil | Necesidad | Diseño que lo sirve |
|---|---|---|
| Trabajador/a con rutina | Compra al volver del trabajo | Contexto "Trabajo → Casa" y desvío incremental |
| Estudiante / joven móvil | Cambia de recorrido según el día | Lugares temporales y ubicación actual |
| Familia / compra grande | Controlar gasto total | Top 3, listas recurrentes, máximo de paradas |
| Usuario marquista | No quiere sustituciones | Reglas por producto: obligatorio / preferido / cualquiera |
| Usuario ahorrador | Tolera más paradas por diferencia grande | Modo "Máximo ahorro" y ahorro neto |

**Anti-persona inicial (restricción obligatoria del MVP):** no optimizar para turismo, compras fuera
de Mar del Plata, delivery, compras B2B ni logística profesional. Son expansiones posibles pero
diluyen el producto inicial.

## Arquitectura de producto y flujo principal (p.7)

**Flujo central (6 pasos):** Lista (qué necesito comprar) → Contexto de hoy (¿por dónde vas a andar?)
→ Preferencias (marcas y comercios) → Optimización (precio + desvío + tiempo) → Top 3 (equilibrado /
rápido / barato) → Ruta (paradas + lista por comercio).

**Pregunta diferencial del producto:** "¿Por dónde vas a andar hoy?" — DePaso optimiza el desvío
respecto del trayecto real, no la distancia desde la casa.

| Tipo de lugar | Persistencia | Ejemplo |
|---|---|---|
| Guardado | Hasta que el usuario lo borre | Casa, Trabajo, Gimnasio |
| Temporal | Sólo el día / sesión | Turno médico, trámite, visita |
| Ubicación actual | Efímera | "Estoy saliendo ahora" |
| Punto obligatorio | Sólo para el plan | Carnicería donde siempre compra carne |

Cross-ref privacidad de estos tipos de lugar: [../legal-functional/LEGAL.md](../legal-functional/LEGAL.md).

## Motor de decisión (p.8)

El motor puede ser sofisticado internamente, pero la salida debe ser comprensible: el score **no se
expone como número técnico**, se traduce a costo, desvío, tiempo y cantidad de paradas.

**Score conceptual:** precio normalizado + costo/desvío + tiempo + paradas + penalizaciones por
romper preferencias. Las restricciones obligatorias (ej. "obligatorio" en preferencia de producto) se
aplican **antes** del ranking.

| Modo | Qué privilegia | Mensaje esperado |
|---|---|---|
| Equilibrado | Precio + desvío + pocas paradas | "Esta es la que más te conviene." |
| Más rápido | Tiempo y paradas | "Pagás $X más, pero terminás 18 min antes." |
| Máximo ahorro | Precio neto | "Ahorrás $X, con 2 paradas extra." |

**Variables futuras (no MVP):** promociones bancarias sólo si el usuario confirma elegibilidad;
combustible/vehículo configurable sin guardar datos innecesarios; horario del comercio y posible
espera; stock y probabilidad de disponibilidad; historial de precio para detectar ofertas reales.

## Métricas de producto y marca (p.16)

| Métrica | Qué valida |
|---|---|
| % de listas que llegan a "Elegir plan" | Valor percibido del algoritmo |
| % de planes elegidos entre Top 3 | Claridad de ranking |
| Ahorro neto estimado mediano | Valor económico real |
| Desvío mediano aceptado | Tolerancia real del usuario |
| Correcciones de precio aceptadas | Salud comunitaria |
| Usuarios que guardan lugares | Valor del contexto |
| Repetición semanal/mensual | Hábito |
| Tasa de "precio incorrecto" | Calidad de datos y confianza |

## NO DEFINIDO

- Umbrales exactos de "desvío que compensa" (queda a criterio del motor de score, sin fórmula
  numérica cerrada en el documento).
- Fecha de lanzamiento por fase del roadmap (ver [DECISIONS.md](DECISIONS.md)).
- Proveedor de mapas definitivo (blueprint legal menciona Google Maps Routes como referencia, no
  como decisión cerrada).
