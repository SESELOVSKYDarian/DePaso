# EAS Build — configuración manual (Fase 26)

Sin Android Studio/Xcode en este entorno de desarrollo (Windows, sin emulador ni Mac), la
única vía real para generar un `.apk`/`.aab` (Android) o `.ipa` (iOS) instalable es correr
el build en la nube con **EAS Build** (Expo Application Services). El plan gratuito alcanza
para esto — Android no pide nada más; iOS necesita una cuenta de Apple Developer paga
(\$99/año) sólo para firmar el build, EAS igual puede generar el build sin eso si el
perfil usa `simulator: true` (ver `eas.json`, perfil `development`).

## Qué ya quedó configurado en el repo

- `apps/mobile/eas.json` (nuevo): 3 perfiles —
  - `development`: build instalable con dev client (hot reload contra este mismo código),
    Android en formato `.apk` (instalable directo, sin Play Store), iOS para simulador
    (no necesita cuenta paga).
  - `preview`: build de prueba interna, formato `.apk` en Android.
  - `production`: build de release (`.aab` en Android, incrementa versión sola).
- `apps/mobile/package.json`: scripts `build:dev`/`build:preview`/`build:production` +
  `eas-cli` y `expo-dev-client` como dependencias.
- `apps/mobile/app.json`: ya tenía `ios.bundleIdentifier`/`android.package`
  (`ar.com.depaso.mobile`) — EAS los necesita, no hubo que tocarlos.

Lo que **no** se puede configurar sin tu cuenta: el `projectId` de EAS (se genera al
vincular el proyecto a una cuenta de Expo real) y la firma de builds de producción.

## Paso a paso — primera vez (15-20 minutos)

1. Crear una cuenta gratis en **https://expo.dev** (si no tenés una).
2. Desde la carpeta `apps/mobile`, iniciar sesión:
   ```bash
   pnpm exec eas login
   ```
3. Vincular este proyecto a tu cuenta (esto edita `app.json` agregando
   `extra.eas.projectId` automáticamente — no hace falta tocarlo a mano):
   ```bash
   pnpm exec eas init
   ```
4. Lanzar el primer build (Android es el más simple para probar, no pide cuenta paga):
   ```bash
   pnpm run build:dev -- --platform android
   ```
   EAS compila en la nube (~10-15 min la primera vez) y al final da un link con un QR —
   escaneándolo desde el celular (con Expo Go o descargando el `.apk` directo) se instala.

## Perfiles disponibles

| Perfil | Comando | Para qué |
|---|---|---|
| `development` | `pnpm run build:dev` | Build con dev client — conecta al bundler local (`pnpm start`), hot reload real en el dispositivo. El más útil para seguir desarrollando. |
| `preview` | `pnpm run build:preview` | `.apk` standalone, sin dev client — para compartir un build de prueba sin pasar por una tienda. |
| `production` | `pnpm run build:production` | Build de release, listo para subir a Play Store/App Store (`eas submit`, requiere cuentas de desarrollador en cada tienda — fuera de alcance hasta que se decida publicar). |

## iOS — la salvedad real

Un build de **simulador** iOS (perfil `development`, `ios.simulator: true` en `eas.json`)
no necesita cuenta de Apple Developer — corre en el simulador de Xcode (que tampoco está
disponible en este entorno, pero si vos tenés Mac, sí). Un build para **dispositivo físico**
o para subir a App Store sí necesita una cuenta de Apple Developer (\$99/año) para firmar —
EAS te va a pedir esas credenciales la primera vez que corras
`pnpm run build:dev -- --platform ios` apuntando a dispositivo, y las gestiona por vos
(no hace falta Xcode instalado para eso, EAS firma en la nube).

## Límites del plan gratuito de EAS a tener en cuenta

- Cantidad limitada de builds por mes en el tier gratuito (variable, ver
  https://expo.dev/pricing — hoy son pocos por mes, suficiente para probar pero no para
  iterar builds todo el día).
- Sin tarjeta para el tier gratuito de EAS en sí — la única tarjeta que puede hacer falta
  es la cuenta de Apple Developer, y sólo si se quiere firmar para dispositivo/App Store.

## Cómo confirmar que quedó bien

Después de `eas init`, `apps/mobile/app.json` va a tener una sección nueva:
```json
"extra": { "eas": { "projectId": "algo-real-acá" } }
```
Si ese `projectId` aparece, quedó vinculado. `pnpm run build:dev -- --platform android`
debería arrancar el build en la nube (visible también en https://expo.dev/accounts/tu-cuenta/projects).
