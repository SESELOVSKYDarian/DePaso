# Requisitos funcionales

Fuente: Blueprint Legal & Funcional v1.0. Requisitos derivados de las reglas legales, clasificados
por obligatoriedad.

## Pantalla de aceptación — requisitos obligatorios (p.19–20)

**Al crear cuenta:**
- Checkbox obligatorio: "Acepto los Términos y Condiciones de DePaso."
- Link visible: "Conocé cómo tratamos tus datos en la Política de Privacidad."
- Checkbox opcional, **desmarcado por defecto**: "Quiero recibir novedades y promociones."

**Al usar ubicación por primera vez** (modal/pantalla dedicada):
- Copy: "Usar tu ubicación — La usamos para calcular rutas, desvíos y comercios cercanos. No
  necesitamos seguirte todo el día. Podés revocar el permiso o ingresar lugares manualmente."
- Botones obligatorios: "Permitir mientras uso DePaso" · "Ingresar dirección manualmente" ·
  "Ahora no".
- **Requisito duro:** la opción de dirección manual debe existir sin penalizar al usuario que la
  elige.

**Antes de mostrar resultados:**
- Aviso compacto y **persistente** en pantalla: "Precios y ahorros estimados. Pueden variar; verificá
  el valor final en el comercio."

## Requisitos de la ficha de precio (obligatorio)

Cada precio mostrado debe incluir: monto, sucursal, fuente, fecha/hora de actualización, nivel de
confianza (estado: informado / confirmado / discutido / en revisión / vencido), y — si aplica —
alternativas en disputa. Ver estados completos en
[BUSINESS-RULES.md](BUSINESS-RULES.md).

## Requisitos de contenido generado por usuario (evidencia)

- Botón "Reportar precio" con copy: "¿Viste otro precio? Contanos cuánto figura en esta sucursal. Tu
  aporte puede ayudar a corregir la información. No publiques datos personales de otras personas."
- Checkbox/declaración de buena fe al reportar: "Declaro que este reporte es de buena fe y refleja lo
  observado."
- **Obligatorio:** bloquear o advertir sobre imágenes con rostros, datos bancarios completos, DNI u
  otra información sensible no necesaria antes de aceptar una foto de evidencia.
- Evidencia es privada por defecto (no se publica como red social de tickets).

## Requisitos de ruta y navegación (obligatorio)

- Mostrar aviso: "Las rutas y tiempos son estimativos. Respetá señales, normas de tránsito y
  condiciones del camino. No uses el teléfono mientras conducís."
- Ofrecer acción "iniciá la navegación antes de manejar" con salida a navegación externa.
- No incentivar interacción con la app mientras se conduce (diseño de interacción, no sólo copy).
- Recalcular automáticamente si un comercio cierra o cambia acceso.

## Requisitos de configuración / privacidad (obligatorio)

Ruta de UX: Configuración → Privacidad y datos, con las siguientes acciones disponibles:
- Descargar / solicitar mis datos.
- Corregir mis datos.
- Borrar lugares guardados.
- Eliminar cuenta.

Plazos de respuesta a cumplir: 10 días corridos (acceso), 5 días hábiles
(rectificación/actualización/supresión).

## Requisitos de edad (obligatorio para MVP)

Declaración en registro: "Para crear una cuenta declarás tener 18 años o más." No se implementa
verificación adicional de edad en el MVP (sólo declaración).

## Requisitos de auditoría y trazabilidad (obligatorio, interno)

- Registrar versión de T&C/Política de Privacidad aceptada, fecha, user_id y mecanismo de
  consentimiento por cada usuario.
- Audit log de cada cambio de precio comunitario — nunca sobreescribir sin histórico.
- Logs de acceso interno con RBAC — soporte no ve ubicaciones por defecto.
- Registro de solicitudes de derechos del titular (acceso/rectificación/supresión) y su resultado.

## Requisitos de patrocinios (si se implementa monetización — condicional)

- Card visualmente separada con etiqueta "Patrocinado".
- Prohibido: alterar el Top 3 sin avisar, ocultar relación comercial, subir score por pago, afirmar
  neutralidad si existe pay-to-rank.

## NO DEFINIDO

- Mecanismo técnico de verificación de identidad para responder solicitudes de derechos del
  titular ("método proporcional" mencionado sin especificar cómo).
- Especificación de UI para el modal de ubicación más allá del copy y los tres botones.
- Flujo de recuperación de cuenta / MFA para usuarios finales (MFA sólo mencionado para
  administradores).
- Especificación de rate limits (valores numéricos) para reportes de precio.
