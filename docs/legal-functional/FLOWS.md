# Flujos

Fuente: Blueprint Legal & Funcional v1.0. Flujos reconstruidos a partir de las reglas y pantallas
descritas (no son diagramas del documento original, sino su secuencia lógica).

## Flujo de consentimiento y aceptación (p.6, p.19–20)

1. Usuario crea cuenta → acepta T&C (obligatorio) + declara haber leído Política de Privacidad
   (aviso/constancia) → opcionalmente marca "recibir novedades" (desmarcado por defecto).
2. Sistema guarda evidencia de aceptación: versión de documento, fecha, user_id, mecanismo.
3. Usuario llega a la primera optimización → sistema pide permiso de ubicación específico:
   - Si acepta "Permitir mientras uso DePaso" → ubicación usada sólo durante el cálculo, sin
     historial persistente por defecto.
   - Si elige "Ingresar dirección manualmente" → flujo continúa sin geolocalización, sin
     penalización funcional.
   - Si elige "Ahora no" → usuario puede seguir explorando sin optimización basada en ubicación.
4. Antes de mostrar resultados → aviso persistente de precios/ahorros estimados.
5. Si el usuario guarda un lugar (Casa/Trabajo) → persiste hasta que el usuario lo borre. Si es
   lugar temporal → se elimina automáticamente al fin del día/plan salvo acción explícita de
   "Guardar".

Cross-ref UX de las pantallas: [../brand-product/UX-UI.md](../brand-product/UX-UI.md).

## Flujo de reporte de precio y consenso comunitario (p.6–8, p.26)

1. Usuario ve un precio → toca "Reportar precio" → declara buena fe → ingresa monto/sucursal/
   condiciones (promo, tarjeta, club, cantidad mínima) → opcionalmente adjunta foto de evidencia.
2. Sistema valida independencia: rechaza voto duplicado del mismo usuario/dispositivo/IP para el
   mismo producto+sucursal en la misma ventana temporal.
3. Sistema agrupa reportes por product_id + branch_id + ventana temporal.
4. Sistema descarta duplicados/sospechosos y reportes de baja confianza.
5. Sistema calcula mediana ponderada y dispersión de los reportes válidos.
6. Si el consenso supera el umbral (ejemplo MVP: ≥5 reportes independientes en 24h, ≥70% dentro de
   tolerancia) → promueve el precio a "confirmado" y actualiza el precio principal.
7. Si no hay consenso → mantiene precio anterior, marca como "discutido", muestra alternativas.
8. Si se detecta un salto imposible/anómalo → estado "en revisión", excluido de la optimización
   hasta resolución.
9. Todo cambio de precio se registra en audit log (nunca se sobreescribe sin histórico).
10. Usuario cuyo aporte fue moderado puede apelar.

Detalle de reglas: [BUSINESS-RULES.md](BUSINESS-RULES.md).

## Flujo de derechos del titular (acceso / rectificación / supresión) (p.14)

1. Usuario accede a Configuración → Privacidad y datos.
2. Elige acción: Descargar/solicitar datos · Corregir mis datos · Borrar lugares · Eliminar cuenta.
   Alternativamente, contacta `privacidad@[dominio]` o formulario dedicado.
3. Sistema/equipo verifica identidad con método proporcional (sin pedir datos de más).
4. Equipo localiza los datos del usuario en: cuenta, lugares, listas, reportes, evidencia/fotos,
   logs relevantes.
5. Equipo responde dentro del plazo legal (10 días corridos para acceso; 5 días hábiles para
   rectificación/actualización/supresión) y deja constancia.
6. Si corresponde, se propaga la corrección/supresión a encargados/proveedores terceros.
7. Se registra la solicitud y su resultado en un registro interno.

## Flujo de eliminación de cuenta (p.15, p.20)

1. Usuario solicita eliminación desde Configuración o por email.
2. Sistema elimina o anonimiza datos según la tabla de retención y obligaciones aplicables.
3. Excepciones: registros que deban conservarse por obligación legal, necesidad de
   seguridad/defensa de derechos, o que ya estén anonimizados/seudonimizados (ej. histórico de
   precios comunitarios desidentificado).

## Flujo de respuesta a incidentes de seguridad (p.23)

1. **Detectar** — vía alertas, logs o reporte interno/externo.
2. **Contener** — revocar credenciales, aislar servicio, bloquear abuso.
3. **Evaluar** — determinar qué datos, cuántos usuarios, sensibilidad y riesgo.
4. **Corregir** — aplicar parche, restauración, rotar claves, hardening.
5. **Documentar** — línea de tiempo, decisiones, evidencia.
6. **Comunicar** — evaluar obligaciones regulatorias/contractuales y comunicar a afectados si
   corresponde.
7. **Aprender** — postmortem y actualización de controles.

Responsables y canal de escalamiento: NO DEFINIDO (pendiente de asignar antes del lanzamiento).

## Flujo de moderación y apelación (p.8)

1. Reporte de precio o evidencia entra al sistema → controles automáticos (rate limit, detección de
   outliers, geofence opcional).
2. Si pasa los controles → se pondera según reputación del usuario.
3. Si es anómalo → pasa a revisión manual/moderación.
4. Moderación puede ponderar, ocultar, rechazar o corregir el aporte, dejando trazabilidad interna.
5. Usuario afectado puede apelar la decisión de moderación.
6. Suspensión de cuenta sólo por manipulación intencional, fraude, automatización abusiva, acoso o
   contenido ilegal — nunca por discrepar de buena fe.

## NO DEFINIDO

- Diagramas de flujo formales (los flujos aquí son reconstrucción textual de las reglas descritas).
- SLA interno de respuesta a apelaciones de moderación (sólo se garantiza el derecho a apelar, sin
  plazo especificado).
- Canal de escalamiento y responsables nombrados para incidentes de seguridad.
