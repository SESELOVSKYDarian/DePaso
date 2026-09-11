# UX / UI

Fuente: Brand & Product Book v1.0, sección "Principios de UI y pantallas clave" (p.14) y secciones
visuales relacionadas.

## Principios de UI y pantallas clave (p.14)

### Home
La home **no es un catálogo**. Debe empezar por "¿Qué necesitás comprar?" y permitir recuperar
listas recurrentes. El mapa aparece cuando ayuda a decidir, no como decoración permanente.

### Pantalla de contexto
Pregunta central: **"¿Por dónde vas a andar hoy?"**. Mostrar chips de lugares guardados + "+ Agregar
lugar de hoy". Debe ser fácil elegir combinaciones tipo Trabajo → Casa, Casa → Centro → Casa, o
ubicación actual.

### Resultados
Tres tarjetas con jerarquía de decisión (Top 3: equilibrado / más rápido / máximo ahorro). Cada una
muestra: total estimado, ahorro, desvío, minutos adicionales, paradas, productos no disponibles y
confianza de datos.

### Plan elegido
Mapa + orden de paradas + checklist por comercio. El usuario puede cambiar una parada y recalcular
sin rehacer la lista.

### Precio (ficha de detalle)
Monto, sucursal, fuente, actualización, historial breve, botón "Reportar precio". La incertidumbre se
visualiza como parte del diseño (no se oculta). Ver modelo de estados de confianza en
[../legal-functional/BUSINESS-RULES.md](../legal-functional/BUSINESS-RULES.md).

## Tipografía aplicada a UI (p.13)

| Nivel | Uso | Peso / tamaño |
|---|---|---|
| Display | Hero / ahorro principal | 600–700, números tabulares si es posible |
| Title | Secciones | 600, compacto |
| Body | Listas y explicación | 400–500, 16px mobile |
| Caption | Fuente / actualización | 400, alto contraste suficiente |

## Iconografía (p.13)

- Trazos redondeados y simples.
- Mapa/pin sólo donde agrega significado (no decoración).
- Un ícono de "desvío" propio puede ser más distintivo que un carrito genérico.
- **Regla de accesibilidad obligatoria:** estados de precio combinan ícono + texto, nunca sólo color.

## Territorio visual aplicado (p.11–12)

Dirección "Camino inteligente": azul noche (#1A1341) + azul ruta (#6290C3) + menta (#C2E7DA) +
acento lima (#B7FF1A) reservado exclusivamente para ahorro/mejor opción. Fondo de app en niebla
(#F7FAF8). Evitar saturación de íconos carrito/bolsa/pin; el mapa debe sentirse parte del producto.
Detalle completo de tokens y contraste: [BRAND.md](BRAND.md).

**Restricción de accesibilidad:** #6290C3 (azul ruta) no debe usarse como texto pequeño sobre blanco
(contraste ≈3.3:1) — reservarlo para íconos, rutas, bordes o texto grande.

## Test de logo / marca en producto (p.14)

El logo debe funcionar en: (1) ícono de app, (2) marcador de mapa, (3) favicon, (4) fondo
claro/oscuro, (5) impresión monocroma.

## Fotografía (p.13)

Priorizar vida cotidiana real de Mar del Plata (trayectos, compras, barrios, bolsas, auto/bici/a pie).
Evitar stock genérico de supermercado. La app en sí debería apoyarse más en mapa/producto que en
fotografía.

## Copy de UI (referencias directas del documento)

- Aviso persistente antes de resultados (legal, ver
  [../legal-functional/FUNCTIONAL.md](../legal-functional/FUNCTIONAL.md)): "Precios y ahorros
  estimados. Pueden variar; verificá el valor final en el comercio."
- Tono general de copy: ver tabla "No decir / Sí decir" en [BRAND.md](BRAND.md).

## NO DEFINIDO

- Wireframes o mockups de alta fidelidad (el documento describe principios, no pantallas
  diseñadas).
- Especificación de breakpoints/responsive más allá de "16px mobile" para Body.
- Sistema de componentes (design system) formal.
- Prototipo Figma (mencionado como entregable de Fase 3 del roadmap, no incluido en este
  documento — ver [DECISIONS.md](DECISIONS.md)).
