# DePaso — resumen de la app (para pedir el diseño)

Pegá este documento completo a la IA de diseño. Está pensado para que entienda qué es la app, para quién es, qué pantallas tiene y qué restricciones hay.

---

## 1. En una frase

**DePaso te dice dónde comprar lo de tu lista por el camino que ya hacés**, mostrando el comercio más barato de tu recorrido y cuánto te desviás para pasar. El nombre es un juego de palabras: *de paso* = "ya que pasás por ahí".

## 2. El problema

En Argentina los precios cambian cada semana y varían mucho entre cadenas. Hoy la gente o compra en el súper de siempre (y paga de más) o recorre varios comercios (y pierde tiempo y nafta). Nadie compara **precio + desvío + descuentos de tarjeta** al mismo tiempo.

## 3. Cómo funciona (el flujo principal)

1. **Armás tu lista de compras**: buscás productos por nombre, o le escribís a un asistente de IA ("leche, fideos, detergente") y la arma sola.
2. **Elegís tu recorrido de hoy**: tus paradas del día (casa → trabajo → escuela), desde lugares guardados, la ubicación actual o buscando en el mapa como en Google Maps ("Técnica 5", "Shell"). El recorrido se guarda todo el día y se reinicia a las 00:00. También se pueden guardar recorridos con nombre para repetirlos otro día.
3. **Iniciás el recorrido**: la app calcula tres opciones de compra:
   - **Sin desvíos**: solo comercios que ya quedan sobre tu camino.
   - **Intermedio**: aceptás desviarte unas cuadras para ahorrar más.
   - **Hipereconómico**: lo más barato aunque haya que desviarse más.
   Cada opción muestra el total, cuánto ahorrás, cuántas paradas, cuántos minutos y cuadras extra, y qué productos faltan.
4. **Mapa del recorrido**: tu camino, los comercios que quedan de paso (ordenados por cuánto te sacan del camino) y las paradas de compra.
5. **Modo compra**: lista tildable por comercio mientras comprás.

## 4. Qué la hace distinta

- **Descuentos por medio de pago**: el usuario carga sus tarjetas y billeteras (Visa, Mastercard, Mercado Pago, MODO, Cuenta DNI, Naranja X, etc.) y la app descuenta del total las promos reales de cada cadena según el día y el tope.
- **Precios reales**: salen del dataset oficial SEPA (precios de supermercados argentinos) y de reportes de la comunidad. Siempre se informa de dónde sale cada precio y qué tan confiable es.
- **Desvío en cuadras**, no en kilómetros: "a 3 cuadras de tu camino".
- **Ofertas de hoy** y productos "Barato hoy" en la pantalla de inicio.

## 5. Usuarios y roles

| Rol | Qué hace |
| --- | --- |
| **Usuario** | Arma listas, elige recorrido, compara, reporta precios, carga medios de pago. |
| **Comercio** | Pide administrar su sucursal (la valida un admin) y carga/actualiza sus precios. |
| **Admin** | Aprueba pedidos de comercios, gestiona usuarios, comercios, sucursales y precios. |

Registro con email y contraseña (con verificación) o con Google, Facebook/Meta y Discord.

## 6. Pantallas

**Entrada**: bienvenida (onboarding), ingresar, registrarse (email, consentimientos, código de verificación), olvidé mi contraseña, nueva contraseña. Después del registro hay un setup corto: ubicación, lugares frecuentes (casa/trabajo), cuánto desvío aceptás.

**Barra principal (5 pestañas)**:
- **Inicio**: saludo, **un único botón "Iniciar mi recorrido"** (sin guías ni pasos); cuando hay lista y recorrido pasa a ser un tablero con la lista, cuánto saldría y la ruta. Debajo: rutas guardadas, "Barato hoy", cambios de precio (subió/bajó), "Ofertas de hoy" con las promos de tus medios de pago, "Recomendados".
- **Listas**: mis listas de compras (se pueden compartir con otras personas), detalle de lista, buscar producto, asistente de IA.
- **Mapa**: el recorrido, comercios de paso, buscador de lugares, botón "dónde estoy", paradas de compra.
- **Actividad**: precios reportados por la comunidad y los que reportaste vos (producto, comercio, precio, cuándo).
- **Perfil**: datos, lugares guardados, medios de pago, preferencias (productos y comercios favoritos), apariencia (claro/oscuro), notificaciones, privacidad, ayuda, términos.

**Otras**: elegir recorrido, resultados del Top 3 de compra, modo compra, reportar un precio, panel de comercio (cargar precios), pedido de comercio, panel admin.

## 7. Estado visual actual (para que el diseño parta de acá o lo reemplace)

- **Dirección**: estilo Apple, neutro. Modo oscuro con negro real y superficies grafito; modo claro con gris niebla y blanco. **Sin violeta/púrpura en ninguna parte.**
- **Color con significado, no decorativo**: verde de interfaz (progreso, checks), **lima solo para ahorro / mejor opción**, azul para rutas y vínculos. Acción primaria: azul noche en claro, blanco suave sobre negro en oscuro.
- **Tono**: argentino, cercano, con humor suave y juegos con "de paso" ("¿Qué te queda de paso hoy?"). Voseo ("armá", "elegí", "mirá").
- **Componentes**: tarjetas redondeadas grandes, botones de ancho completo, tiras horizontales de productos, íconos de comercios con el color de cada cadena (Coto rojo, Carrefour azul, Jumbo verde, etc.), ícono por tipo de producto cuando no hay foto.
- **Responsive**: celular (principal), tablet y escritorio (barra lateral izquierda, contenido centrado hasta 1100 px). Se usa también en la web.
- **Accesibilidad**: contraste ≥ 4.5:1, objetivos táctiles ≥ 44 px, sin `alert()`: los avisos son toasts, banners o diálogos.

## 8. Lo que se le pide al diseño

1. **Identidad y sistema visual**: paleta (claro y oscuro), tipografía, íconos, radios, sombras, espaciados y componentes base (botón, tarjeta, chip, campo de texto, barra de pestañas, tiras de producto, fila de comercio, insignia de precio/ahorro).
2. **Pantallas clave** en celular y en escritorio: Inicio (vacío y con tablero), elegir recorrido, mapa con buscador, Top 3 de compra, lista de compras, perfil.
3. **Momentos de marca**: ícono de la app, splash, onboarding, estados vacíos, ahorro logrado ("ahorraste $X").
4. **Restricciones**: nada de violeta; el lima se reserva para ahorro; debe verse bien en claro y oscuro; textos en español rioplatense; cada pantalla con un solo llamado a la acción principal.

## 9. Datos que aparecen en pantalla (para que los mockups sean realistas)

- Producto: nombre, marca, foto (a veces no hay), precio, comercio, "Ahorrás 18%".
- Comercio/sucursal: cadena, dirección, "a 3 cuadras de tu camino", precio de la lista completa.
- Plan: total, ahorro, costo de viaje, paradas, minutos extra, productos faltantes, confianza del precio (oficial / comunidad / estimado).
- Promo: cadena, medio de pago, % de descuento, tope en pesos, días de vigencia.
- Zona de ejemplo: Mar del Plata (Coto, Carrefour, Jumbo, Día, Vea, La Anónima, Shell, YPF).
