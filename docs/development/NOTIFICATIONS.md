# Notificaciones del celular y anuncios

Cómo funcionan los avisos que salen en la barra del celular (no los de adentro de la app) y los
anuncios que publica el administrador.

## Qué hay

| Aviso | Quién lo dispara | Categoría que lo apaga |
|---|---|---|
| Anuncio del equipo | El administrador, al publicar con "Notificación al celular" | `news` |
| Ofertas y bajas de precio de tus listas | La API, cada 6 horas (como mucho 1 por persona por día, de 9 a 21 h) | `offers` |
| "Alguien compartió una lista con vos" | La API, al compartir | `lists` |
| "Empezaste tu compra de paso" | La propia app, al tocar *Empezar compra* | `routes` (solo en el celular) |

Cada persona elige cuáles quiere en **Perfil › Avisos del celular**. Sin elegir nada, están todos activos.

## Cómo viaja un aviso

1. La app pide permiso al sistema (la primera vez, con un cartel propio antes) y saca su token de
   Expo Push. Lo manda a `POST /api/notifications/token`; queda en la tabla `push_tokens`.
2. Para avisar, la API arma los mensajes (`apps/api/lib/push/notify.ts`) y se los pasa a Expo
   (`https://exp.host/--/api/v2/push/send`, `apps/api/lib/push/expoPush.ts`). Expo habla con Apple y
   Google. Los tokens que Expo marca como `DeviceNotRegistered` se borran solos.
3. Al tocar el aviso, la app abre la pantalla que corresponde (`features/announcement-popup/StartupExtras.tsx`).

## Lo que hay que configurar para que lleguen en Android

Los avisos remotos de Android pasan por Firebase Cloud Messaging. Sin esto el APK **no puede
sacar el token** (los avisos locales, como el de "empezaste tu compra", sí funcionan):

1. Crear un proyecto en <https://console.firebase.google.com> y agregar una app Android con el
   paquete `ar.com.depaso.mobile`.
2. Bajar `google-services.json` y guardarlo en `apps/mobile/google-services.json` (está ignorado por Git si se agrega al `.gitignore`; no tiene secretos de servidor, pero conviene no publicarlo).
3. En `apps/mobile/app.json`, dentro de `android`, agregar `"googleServicesFile": "./google-services.json"`.
4. En Firebase: *Configuración del proyecto › Cuentas de servicio › Generar nueva clave privada*.
   Subir ese JSON a EAS: `eas credentials -p android` › *Google Service Account* › *FCM V1*.
5. Generar un APK nuevo: `eas build -p android --profile preview`.

En iPhone hace falta además la cuenta de Apple Developer y las credenciales de push de EAS.

> En **Expo Go de Android** los avisos remotos no existen (Expo los sacó). Se prueban con el APK.
> En la web no hay avisos del celular.

## Anuncios con ventana, emoji e imagen

Desde **Perfil › Administración › Publicar novedades** el administrador escribe título y mensaje, y
puede sumar un emoji o una imagen (de la galería del celular o, en la web, de sus archivos). La app
la achica y la comprime antes de mandarla (una versión grande de hasta ~650 KB para la ventana y una
miniatura de 160 px para las listas). Se guarda en la base como data URI (`announcements.imageData`
y `thumbData`), igual que los logos de los comercios.

- **Ventana al abrir la app:** `POST /api/announcements/popup` devuelve el anuncio vigente (hasta
  14 días). La app guarda el id del último que mostró y no lo repite.
- **Notificación al celular:** se manda en segundo plano al publicar (`sendPush`).
- Las listas (`/api/announcements/list`) traen solo la miniatura: la imagen grande no viaja si no hace falta.

## Endpoints

| Endpoint | Para qué |
|---|---|
| `POST /api/notifications/token` | Registra el token de este celular |
| `DELETE /api/notifications/token` | Lo borra (cierre de sesión) |
| `POST /api/notifications/settings` | Lee qué avisos están activos |
| `PUT /api/notifications/settings` | Activa o apaga categorías |
| `POST /api/announcements/popup` | Anuncio para la ventana de entrada |
| `POST /api/admin/announcements` | El admin publica (`emoji`, `imageData`, `thumbData`, `showPopup`, `sendPush`) |
