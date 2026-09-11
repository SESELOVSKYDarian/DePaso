# Legal

Fuente: Blueprint Legal & Funcional v1.0. **No sustituye asesoramiento jurídico profesional.**

## Marco jurídico relevante en Argentina (p.3)

| Norma / autoridad | Impacto en DePaso |
|---|---|
| Ley 25.326 + AAIP | Cuenta, domicilio, lugares guardados, geolocalización, preferencias, derechos del titular |
| Resolución AAIP 47/2018 | Medidas técnicas/organizativas de seguridad recomendadas |
| Guía AAIP sobre geolocalización | Consentimiento, calidad, finalidad, revocación, eliminación, evaluación de impacto |
| Ley 24.240 (Defensa del Consumidor) | Información cierta, clara y detallada; límites a disclaimers |
| CCyC arts. 984–989 | Cláusulas claras; ambigüedad contra predisponente; cláusulas abusivas pueden tenerse por no escritas |
| INPI + Niza | Riesgo marcario; elegir productos/servicios y clases correctas |

**Nota:** la AAIP mantiene activo un proyecto de actualización de la ley de datos personales —
revisar cambios antes del lanzamiento. (p.3)

## Riesgo marcario (cross-ref producto)

Ver detalle completo en [../brand-product/BRAND.md](../brand-product/BRAND.md) sección Naming.
Resumen: riesgo ALTO hasta clearance (búsqueda fonética + análisis clases 9/35/39/42 + dictamen
profesional). No invertir en registro/ads finales antes de eso.

## Privacidad por diseño para ubicación (p.4)

La AAIP considera dato personal toda información sobre ubicación y desplazamientos.

**Recomendación fuerte (no obligación legal explícita, pero criterio de diseño del documento):** no
pedir "ubicación siempre" en el MVP. Pedir "mientras usás la app" o dirección manual. No guardar
coordenadas históricas de cada movimiento.

- Guardar lugares por etiqueta (Casa/Trabajo) sólo si el usuario lo decide.
- Lugares temporales: borrar al terminar el día o al finalizar el plan, salvo que el usuario pulse
  "Guardar".
- Para verificar un reporte de precio por cercanía, considerar guardar sólo "presencia
  verificada=true" + timestamp, **no** coordenadas crudas.
- Realizar una **evaluación de impacto de privacidad (DPIA)** previa al lanzamiento — recomendada
  expresamente por AAIP para geolocalización.

## Inventario de datos y minimización (p.5)

| Dato | ¿Necesario? | Retención propuesta | Notas |
|---|---|---|---|
| Email / login | Sí | Mientras exista la cuenta | Evitar DNI salvo necesidad futura real |
| Nombre visible | Opcional | Cuenta | Puede permitirse alias |
| Casa / Trabajo | Opcional | Hasta borrado | Dirección cifrada en reposo |
| Lugar temporal de hoy | Opcional | Fin del día / sesión | No convertir en lugar guardado sin acción explícita |
| GPS actual | Sólo durante cálculo | Transitorio | No conservar historial por defecto |
| Lista de compra | Sí (para función) | Usuario decide / historial limitado | Ofrecer modo sin historial |
| Preferencias de marcas | Opcional | Hasta borrado | No inferir automáticamente como regla dura |
| Reporte de precio | Sí (si participa) | Histórico del precio | Desvincular identidad pública |
| Foto de ticket/góndola | Opcional | Corto plazo | Redactar datos personales del ticket |
| Logs de seguridad | Sí | Plazo técnico limitado | Acceso restringido |

Los plazos son **propuestas de producto, no plazos legales universales** — deben documentarse y
ajustarse a finalidad real, obligaciones contables/contractuales y proveedor de infraestructura.

## Arquitectura de consentimiento (p.6)

No conviene un único checkbox "Acepto todo". La política de privacidad informa; los consentimientos
que requieren autorización deben ser específicos y revocables. AAIP exige informar finalidad,
destinatarios, responsable, obligatoriedad y derechos.

| Momento | Texto / acción | Tipo |
|---|---|---|
| Registro | "Acepto los Términos y Condiciones." | Obligatorio para crear cuenta |
| Registro | "Declaro haber leído la Política de Privacidad." | Aviso/constancia, no reemplaza consentimientos específicos |
| Primera optimización | "Permitir ubicación mientras uso DePaso para calcular rutas y desvíos." | Consentimiento/permiso específico |
| Alternativa | "Ingresar dirección manualmente." | Debe existir sin castigo indebido |
| Marketing | "Quiero recibir novedades y promociones." | Opcional, desmarcado por defecto |
| Reportar precio | "Declaro que este reporte es de buena fe..." | Regla de comunidad |

**Obligatorio:** guardar evidencia de aceptación — versión de T&C/privacidad, fecha, user_id,
mecanismo de consentimiento. Pedir nueva aceptación si cambian de forma material.

## Rutas, mapas y seguridad del usuario (p.11)

DePaso puede usar un proveedor de mapas (ej. Google Routes, mencionado como referencia) para
cálculo de ruta y orden de paradas.

- No incentivar interacción con la app mientras se conduce.
- Mostrar "iniciá la navegación antes de manejar" y permitir abrir navegación externa.
- Respetar warnings del proveedor de mapas para caminata/bici/moto cuando correspondan.
- No prometer tiempos exactos; mostrar estimación + hora de cálculo.
- Recalcular si un comercio cierra o cambia acceso.

**Aviso obligatorio:** "Las rutas y tiempos son estimativos. Respetá señales, normas de tránsito y
condiciones del camino. No uses el teléfono mientras conducís."

## Seguridad de información (p.12)

| Control mínimo | Implementación sugerida |
|---|---|
| Cifrado en tránsito | TLS en toda API |
| Cifrado en reposo | Base/disco cifrado; secretos en secret manager |
| Autenticación | Hash fuerte de contraseñas o proveedor robusto; MFA para administradores |
| Autorización | RBAC — soporte no ve ubicaciones por defecto |
| Logs | No loguear coordenadas completas, tokens ni imágenes de tickets |
| Backups | Cifrados, con restauración probada |
| Vulnerabilidades | Dependabot/SCA + actualizaciones + pentest previo a escala |
| Acceso interno | Principio de mínimo privilegio; auditoría |
| Entornos | No copiar producción a desarrollo sin anonimización |

Base legal: Ley 25.326 exige medidas técnicas/organizativas; Resolución AAIP 47/2018 detalla medidas
recomendadas.

## Terceros y transferencias internacionales (p.13)

La AAIP considera transferencia internacional los flujos hacia proveedores en otros países.

| Proveedor | Datos | Finalidad | País/transferencia | Contrato/DPA |
|---|---|---|---|---|
| Maps | Puntos de ruta/ubicación | Ruteo | NO DEFINIDO | Revisar términos |
| Hosting | Cuenta, lugares, listas | Infraestructura | NO DEFINIDO | DPA + subprocesadores |
| Analytics | Eventos minimizados | Producto | NO DEFINIDO | Desactivar precisión innecesaria |
| Email/push | Email/token push | Notificaciones | NO DEFINIDO | DPA |
| Error tracking | Errores técnicos | Estabilidad | NO DEFINIDO | Scrubbing de PII |

**Pendiente obligatorio antes del lanzamiento:** completar con proveedores reales, países,
mecanismos de transferencia y enlaces a políticas.

## Derechos del titular y operación interna (p.14)

Derechos: conocer, acceder, rectificar, actualizar, suprimir. Plazos informados por AAIP: **10 días
corridos** para responder acceso; **5 días hábiles** para rectificación/actualización/supresión en
los supuestos indicados.

Proceso: (1) canal visible `privacidad@[dominio]` + formulario en Configuración → (2) verificar
identidad de forma proporcional → (3) localizar datos en cuenta/lugares/listas/reportes/evidencia/
logs → (4) responder dentro de plazo y dejar constancia → (5) propagar corrección/supresión a
encargados → (6) mantener registro de solicitudes y resultado.

**UX recomendado:** Configuración → Privacidad y datos → Descargar/solicitar datos · Corregir mis
datos · Borrar lugares · Eliminar cuenta.

## Retención, borrado y lugares temporales (p.15)

| Categoría | Política recomendada |
|---|---|
| Lugar temporal | Eliminar automáticamente al fin del día/plan salvo "Guardar" |
| GPS de cálculo | No persistir después del cálculo, salvo necesidad técnica muy breve |
| Lugar guardado | Hasta borrado por usuario o cierre de cuenta |
| Historial de optimizaciones | Desactivable; retención limitada |
| Foto evidencia | Borrar una vez resuelta/moderada y pasado plazo de disputa |
| Precio comunitario | Conservar histórico desidentificado/seudonimizado |
| Cuenta borrada | Eliminar o anonimizar según tabla de retención y obligaciones |

Principio general: "guardar lo mínimo durante el menor tiempo útil". AAIP: los datos deben
destruirse cuando dejan de ser necesarios para la finalidad.

## Tickets, fotos y contenido generado por usuarios (p.16)

Una foto de ticket puede incluir nombre, últimos dígitos de tarjeta, datos de fidelidad, horario y
ubicación.

- Advertir al usuario; detectar/redactar información personal antes de almacenar o publicar si es
  técnicamente viable.
- Fotos de evidencia son **privadas** para validación — no crear red social de tickets por defecto.
- Bloquear imágenes con rostros, datos bancarios completos, DNI u otra información sensible no
  necesaria.
- Licencia de contenido **limitada**: sólo la necesaria para operar/moderar/verificar el aporte — no
  licencia perpetua/irrevocable/mundial más amplia de lo necesario.

## Edad y alcance del MVP (p.18)

**Decisión recomendada:** MVP dirigido a mayores de 18 años (simplifica tratamiento de datos y
consentimientos). Si se admiten menores en el futuro, revisar específicamente consentimiento,
lenguaje, geolocalización y protección reforzada.

Texto MVP: "Para crear una cuenta declarás tener 18 años o más."

## Incidentes y respuesta operacional (p.23)

| Fase | Acciones |
|---|---|
| Detectar | Alertas, logs, reporte interno/externo |
| Contener | Revocar credenciales, aislar servicio, bloquear abuso |
| Evaluar | Qué datos, cuántos usuarios, sensibilidad, riesgo |
| Corregir | Parche, restauración, claves nuevas, hardening |
| Documentar | Línea de tiempo, decisiones, evidencia |
| Comunicar | Evaluar obligaciones regulatorias/contractuales y comunicación a afectados |
| Aprender | Postmortem y actualización de controles |

Base: Resolución AAIP 47/2018 recomienda procesos específicos para incidentes de seguridad. Debe
asignarse responsables y canal de escalamiento antes del lanzamiento.

## Borradores de documentos legales (resumen — texto completo en PDF)

### Términos y Condiciones (25 cláusulas, PDF p.20–23)

Plantilla con campos `[ENTRE CORCHETES]` pendientes de completar (razón social, CUIT, domicilio,
emails). Cláusulas clave: Objeto (herramienta informativa, DePaso no es vendedor) · Precios y
disponibilidad (informativos, precio final lo determina el comercio) · Fuentes y nivel de confianza ·
Ahorro estimado (no garantía) · Promociones condicionadas · Rutas estimativas de terceros · Edad 18+
· Aportes comunitarios de buena fe · Moderación y trazabilidad · Evidencia con licencia limitada ·
Conductas prohibidas · Suspensión proporcional · Publicidad/patrocinios identificados y sin alterar
ranking encubierto · Propiedad intelectual de DePaso · Modificaciones con reaceptación si son
materiales · Baja de cuenta · Responsabilidad sin excluir derechos irrenunciables del consumidor ·
Ley aplicable Argentina.

### Política de Privacidad (19 cláusulas, PDF p.24–25)

Plantilla con campos pendientes de completar (responsable, proveedores, países, plazos, canales).
Cláusulas clave: alcance y datos tratados (sin DNI ni tarjeta completa para función principal) ·
geolocalización "mientras se usa la app" sin tracking continuo por defecto · lugares temporales
autoeliminables · finalidades del tratamiento · base de consentimiento libre/expreso/informado ·
datos comunitarios desidentificables · evidencia visual con redacción de PII · destinatarios y
encargados (inventario pendiente) · transferencias internacionales (mecanismos a evaluar) ·
seguridad proporcional al riesgo · retención según tabla · derechos del titular con plazos legales ·
eliminación de cuenta · marketing opcional y no condicionante · AAIP como autoridad de control.

## Checklist pre-lanzamiento (p.28)

- [ ] Clearance de "DePaso": búsqueda idéntica + fonética + análisis de clases/descripciones.
- [ ] Definir razón social/titular, CUIT, domicilio legal, correos de soporte/privacidad.
- [ ] Completar Términos y Política con datos reales y revisión legal.
- [ ] Definir y documentar consentimiento de ubicación + revocación + alternativa manual.
- [ ] Realizar evaluación de impacto de privacidad (DPIA) para geolocalización.
- [ ] Evaluar/realizar inscripción de responsable y bases ante Registro Nacional, según alcance.
- [ ] Inventario de datos y tabla de retención implementada técnicamente.
- [ ] Inventario de proveedores, DPA, subprocesadores y transferencias internacionales.
- [ ] Proceso de acceso/rectificación/supresión probado con tickets de soporte.
- [ ] Seguridad: RBAC, cifrado, logs sin PII, backups, vulnerabilidades, plan de incidentes.
- [ ] Precio: fuente, sucursal, timestamp, confianza y aviso visible en todas las pantallas.
- [ ] Motor comunitario con histórico, anti-Sybil y moderación.
- [ ] Sin "garantizado", "siempre más barato" ni pay-to-rank oculto.
- [ ] Warnings de ruta y no interacción mientras conduce.
- [ ] Flujo de borrar cuenta y lugares visible y funcional.

## NO DEFINIDO

- Razón social, CUIT, domicilio legal, emails de contacto (campos `[ENTRE CORCHETES]` en T&C y
  Política de Privacidad).
- Proveedores reales de hosting, maps, analytics, email/push, error tracking, sus países y DPAs.
- Plazos legales exactos aplicables más allá de los citados (10 días corridos acceso / 5 días
  hábiles rectificación-supresión).
- Inscripción ante el Registro Nacional de Bases de Datos Personales (marcada como "evaluar/
  realizar", no confirmada).
- Resultado de la evaluación de impacto de privacidad (DPIA) — sólo recomendada, no realizada.
- Estado del proyecto de reforma de la Ley de Datos Personales (AAIP) al momento del lanzamiento.

## Fuentes citadas en el documento (p.29)

Ley 24.240, Código Civil y Comercial (Ley 26.994), portal AAIP (datos personales, derechos,
obligaciones, trámites Registro Nacional, geolocalización, Resolución 47/2018, patrones engañosos,
proyecto de reforma), Google Maps Routes (optimización de waypoints, uso y facturación), INPI
(búsqueda y clasificación de marcas), WIPO/Niza clases 9, 35, 39, 42 (2026). Consulta de fuentes:
10/09/2026 — revalidar antes del lanzamiento.
