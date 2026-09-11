# Índice de documentación — DePaso

Base de conocimiento compacta generada a partir de los dos documentos de referencia del proyecto:

- `pdf/DePaso_Brand_Product_Book_v1.pdf` — Brand & Product Book v1.0
- `pdf/DePaso_Blueprint_Legal_Funcional_v1.pdf` — Blueprint Legal & Funcional v1.0

Cada archivo referencia número de página del PDF original entre paréntesis (p.N). Donde el PDF no
define algo, se marca explícitamente como **NO DEFINIDO**. Esta documentación no reemplaza los
PDFs originales para asesoramiento legal/marcario — son la fuente autoritativa para eso.

## ¿Qué archivo consultar?

| Si tu pregunta es sobre... | Andá a |
|---|---|
| Qué es DePaso, propuesta de valor, estado general | [brand-product/SUMMARY.md](brand-product/SUMMARY.md) |
| Propósito, misión, tono de voz, naming/riesgo marcario, colores, tipografía, logo | [brand-product/BRAND.md](brand-product/BRAND.md) |
| Problema que resuelve, benchmark, JTBD, flujo de producto, motor de decisión, métricas | [brand-product/PRODUCT.md](brand-product/PRODUCT.md) |
| Pantallas clave, principios de UI, cómo se ve la app | [brand-product/UX-UI.md](brand-product/UX-UI.md) |
| Qué está decidido, qué es recomendación y qué falta resolver (marca/roadmap) | [brand-product/DECISIONS.md](brand-product/DECISIONS.md) |
| Mapa de riesgos legales, marco jurídico general, regla madre | [legal-functional/SUMMARY.md](legal-functional/SUMMARY.md) |
| Reglas del motor de precios comunitario, anti-fraude, promociones, patrocinios | [legal-functional/BUSINESS-RULES.md](legal-functional/BUSINESS-RULES.md) |
| Privacidad, datos personales, seguridad, derechos del titular, checklist pre-lanzamiento | [legal-functional/LEGAL.md](legal-functional/LEGAL.md) |
| Qué debe implementarse sí o sí en pantallas/copy (obligatorio vs. recomendado) | [legal-functional/FUNCTIONAL.md](legal-functional/FUNCTIONAL.md) |
| Cómo funciona paso a paso: consentimiento, reporte de precio, derechos del titular, incidentes | [legal-functional/FLOWS.md](legal-functional/FLOWS.md) |

## Preguntas cruzadas frecuentes

- **"¿Puedo usar el nombre DePaso ya?"** → [brand-product/BRAND.md](brand-product/BRAND.md) (Naming)
  + [legal-functional/LEGAL.md](legal-functional/LEGAL.md) (Riesgo marcario). Riesgo ALTO hasta
  clearance.
- **"¿Qué necesito para pedir ubicación al usuario?"** →
  [legal-functional/LEGAL.md](legal-functional/LEGAL.md) (Privacidad por diseño) +
  [legal-functional/FUNCTIONAL.md](legal-functional/FUNCTIONAL.md) (pantalla de aceptación).
- **"¿Cómo se calcula y muestra el Top 3?"** →
  [brand-product/PRODUCT.md](brand-product/PRODUCT.md) (Motor de decisión) +
  [legal-functional/BUSINESS-RULES.md](legal-functional/BUSINESS-RULES.md) (cómo mostrar precios).
- **"¿Qué falta antes de lanzar?"** → [legal-functional/LEGAL.md](legal-functional/LEGAL.md)
  (Checklist pre-lanzamiento) + [brand-product/DECISIONS.md](brand-product/DECISIONS.md) (Roadmap).

## Estado del proyecto (a la fecha de estos documentos, 10 sep 2026)

Fase de definición de marca/producto y borradores legales. Nombre "DePaso" es working name
pendiente de clearance marcario. Ámbito de lanzamiento: sólo Mar del Plata, Argentina. No hay
código ni implementación todavía — esta base de conocimiento es insumo para las etapas siguientes.
