# DePaso — Especificación tipográfica del logo

## Marca

**DePaso**  
**Ahorrá en el camino.**

> Nota: la imagen original del logo fue generada visualmente, por lo que no utiliza necesariamente una fuente tipográfica exacta. Las siguientes fuentes son las equivalencias recomendadas para reproducir el logo de forma consistente en Figma, Illustrator, web y otros soportes.

---

## 1. Título — `DePaso`

### Fuente recomendada

**Fredoka Bold**

### Configuración

- **Familia:** Fredoka
- **Peso:** 700 / Bold
- **Tamaño de referencia:** 112 px
- **Line-height:** 100%
- **Letter-spacing / tracking:** -2%
- **Kerning:** Óptico
- **Capitalización:** `DePaso`

### Colores

- `De` → `#1A1341`
- `Paso` → `#6290C3`

### Configuración sugerida en Figma

```text
Font: Fredoka
Weight: Bold 700
Size: 112 px
Line height: 100%
Letter spacing: -2%
```

### Alternativa

Si Fredoka no estuviera disponible, una alternativa cercana sería:

**Nunito ExtraBold**

---

## 2. Subtítulo — `Ahorrá en el camino.`

### Fuente recomendada

**Montserrat SemiBold**

### Configuración

- **Familia:** Montserrat
- **Peso:** 600 / SemiBold
- **Tamaño de referencia:** 34 px
- **Line-height:** 120%
- **Letter-spacing / tracking:** +12%
- **Color:** `#1A1341`
- **Punto final:** `#B7FF1A`

### Configuración sugerida en Figma

```text
Font: Montserrat
Weight: SemiBold 600
Size: 34 px
Line height: 120%
Letter spacing: 12%
```

### CSS de referencia

```css
font-family: "Montserrat", sans-serif;
font-weight: 600;
letter-spacing: 0.12em;
```

---

## 3. Relación entre título y subtítulo

La proporción recomendada es:

```text
DePaso
112 px

Ahorrá en el camino.
34 px
```

El subtítulo representa aproximadamente el **30% del tamaño del título**.

### Recomendación

No hacer el subtítulo mayor al 35% del tamaño del título.

---

## 4. Espaciado entre título y subtítulo

Para un título de aproximadamente 112 px:

```text
Gap recomendado: 12–18 px
Valor base sugerido: 14 px
```

Esto mantiene el bloque visual compacto.

---

## 5. Espaciado entre icono y texto

Entre el isotipo y el bloque tipográfico:

```text
Gap recomendado: 40–48 px
Valor base sugerido: 44 px
```

---

## 6. Tamaño relativo del icono

El icono debería medir aproximadamente:

```text
Altura icono ≈ 1.45 × altura visual de “DePaso”
```

Ejemplo:

```text
DePaso: 112 px
Icono: 180–200 px aprox.
```

---

## 7. Alineación

El isotipo no debería alinearse exactamente al baseline del título.

La composición correcta es centrar verticalmente el bloque completo:

```text
┌──────────┐
│          │
│  ICONO   │     DePaso
│          │     Ahorrá en el camino.
└──────────┘
```

El bloque formado por el título + subtítulo debe quedar centrado verticalmente respecto del isotipo.

---

## 8. Paleta principal del logo

| Uso | Color |
|---|---|
| Navy / principal | `#1A1341` |
| Azul secundario | `#6290C3` |
| Mint | `#C2E7DA` |
| Cream | `#F1FFE2` |
| Lime / acento | `#B7FF1A` |

---

## 9. Especificación oficial recomendada

| Elemento | Configuración |
|---|---|
| Logotipo | Fredoka Bold 700 |
| Tamaño título de referencia | 112 px |
| Tracking título | -2% |
| Line-height título | 100% |
| `De` | `#1A1341` |
| `Paso` | `#6290C3` |
| Tagline | Montserrat SemiBold 600 |
| Tamaño tagline | 34 px |
| Tracking tagline | +12% / `0.12em` |
| Line-height tagline | 120% |
| Color tagline | `#1A1341` |
| Punto final | `#B7FF1A` |
| Gap título/tagline | ~14 px |
| Gap icono/texto | ~44 px |
| Altura icono | 180–200 px aprox. |

---

## 10. Uso recomendado dentro de la marca

### Fredoka

Usarla para:

- Logotipo
- Titulares especiales
- Campañas
- Piezas de branding
- Mensajes destacados muy cortos

No usarla para grandes bloques de texto.

### Montserrat

Usarla para:

- Subtítulos
- Tagline
- UI secundaria
- Botones
- Labels
- Textos de apoyo

Para interfaces muy densas también se puede complementar con **Inter**.

---

## 11. Combinación oficial recomendada

```text
Logo / Branding
Fredoka Bold

Tagline / Supporting text
Montserrat SemiBold
```

Esta combinación conserva el aspecto visual del logo generado y permite construir un sistema de marca consistente para toda la app.
