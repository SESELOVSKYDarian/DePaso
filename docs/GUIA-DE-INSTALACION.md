# Guía de instalación y configuración

Cómo dejar DePaso funcionando en una máquina nueva: backend (API), base de datos y la app
móvil. Para usar la app ya instalada, ver el [Manual de usuario](MANUAL-DE-USUARIO.md); para los
endpoints, la [Referencia de la API](development/API.md).

## 1. Qué hay que tener instalado

| Herramienta | Versión | Para qué |
|---|---|---|
| Node.js | **22.13 o más** (LTS) | Todo el proyecto. Expo SDK 58 no soporta versiones anteriores |
| pnpm | 10.19 | Gestor de paquetes del monorepo (`corepack enable` lo activa) |
| Git | cualquiera | Clonar el repositorio |
| MySQL | 8.0 o más | Base de datos (local con Docker, o el servicio MySQL de EasyPanel) |
| Expo Go | SDK 58 | Probar la app en el celular (Play Store / App Store) |
| Docker (opcional) | cualquiera | Levantar MySQL local con `docker compose` |

> El celular y la PC pueden estar en redes distintas: ver "Probar desde otra red" más abajo.

## 2. Obtener el código e instalar dependencias

```bash
git clone https://github.com/SESELOVSKYDarian/DePaso.git
cd DePaso
corepack enable
pnpm install
```

El repositorio es un monorepo (`apps/` y `packages/`, ver el [README](../README.md)); un solo
`pnpm install` instala todo.

## 3. Variables de entorno

Copiá `.env.example` como `.env` (raíz) y, para la API, también como `apps/api/.env.local`.
Nunca subas valores reales a Git (`.env*` está ignorado).

### Obligatorias (backend)

| Variable | Qué es | Ejemplo |
|---|---|---|
| `DATABASE_URL` | Conexión a MySQL | `mysql://depaso:depaso@localhost:3306/depaso` |
| `AUTH_SESSION_SECRET` | Secreto largo y aleatorio por entorno. Firma los JWT de acceso y los códigos de recuperación | `openssl rand -base64 32` |

### Opcionales (cada una activa una función)

| Variable(s) | Función que activa | Si falta |
|---|---|---|
| `MAPBOX_ACCESS_TOKEN` | Geocodificación, rutas reales y mapa | El ruteo usa una línea recta y `/api/geocode` responde 503 |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Mails de "Olvidé mi contraseña" | Responde 503 `EMAIL_NOT_CONFIGURED` |
| `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` | Login con Google | El botón avisa que no está activado |
| `META_APP_ID` + `META_APP_SECRET` (o `FACEBOOK_APP_ID/SECRET`) | Login con Meta (Facebook) | Ídem |
| `DISCORD_CLIENT_ID` + `DISCORD_CLIENT_SECRET` | Login con Discord | Ídem |
| `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL` | Asistente de compras con IA | "Modo básico": corta el texto por comas |
| `STT_API_KEY`, `STT_BASE_URL`, `STT_MODEL` | Micrófono del asistente (voz a texto) | El micrófono avisa y se puede escribir |
| `CRON_SECRET` | Autoriza a los cron jobs de EasyPanel a sincronizar promos | Solo un admin puede sincronizar |

Para **Gmail** como SMTP: activá la verificación en dos pasos y generá una "contraseña de
aplicación" (cuenta de Google → Seguridad). Usá `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`,
`SMTP_SECURE=false`.

Para el **login social**, en la consola de cada proveedor registrá como URI de redirección:
`https://<tu-api>/api/auth/oauth/callback`.

### App móvil

En `apps/mobile/.env` (copiar de `apps/mobile/.env.example`):

```
EXPO_PUBLIC_API_URL="https://<tu-api>.easypanel.host"   # API desplegada
# o la API local: http://<IP-de-tu-PC>:3000
```

## 4. Base de datos

### Opción A: MySQL local con Docker

```bash
docker compose up -d                                    # MySQL 8 en localhost:3306
pnpm --filter @depaso/database run migrate:deploy       # crea las tablas
pnpm --filter @depaso/database run seed                 # datos de ejemplo
```

### Opción B: MySQL de EasyPanel (la que usa el despliegue)

1. En EasyPanel: *Create Service → MySQL*. Anotá usuario, clave, base y nombre del servicio.
2. La API (servicio App) usa la URL interna: `mysql://USUARIO:CLAVE@NOMBRE-SERVICIO:3306/BASE`.
3. Al arrancar, el contenedor aplica las migraciones solo. Detalle en
   [DEPLOY-EASYPANEL.md](development/DEPLOY-EASYPANEL.md).

### Cargar el catálogo real (opcional)

Los precios y productos salen del dataset público SEPA. La importación es manual (los archivos
pesan ~330 MB por día):

```bash
pnpm data:sepa:import              # descarga e importa
pnpm data:sepa:backfill-types      # asigna el "tipo" (gaseosa, vino…) a cada producto
pnpm data:sepa:backfill-types -- --dry-run   # solo muestra el resumen, sin escribir
```

## 5. Ejecutar

### API (backend)

```bash
pnpm --filter @depaso/api dev      # http://localhost:3000
```

Comprobá que anda: <http://localhost:3000/api/health> debe devolver `{"ok":true}`.

### App móvil

```bash
cd apps/mobile
npx expo start
```

Escaneá el QR con Expo Go. Si el celu y la PC están en la misma red Wi‑Fi alcanza con eso.

### Probar desde otra red (o con datos móviles)

```bash
npx expo start --tunnel
```

Crea una URL pública (`exp://….on.expo.app`) que se pega en Expo Go → *Enter URL manually*.
La PC tiene que seguir prendida y con internet.

### Panel de administración (opcional)

```bash
pnpm --filter @depaso/admin dev
```

## 6. Tests y chequeos

```bash
pnpm typecheck        # tipos de todo el monorepo
pnpm test             # tests (optimización, auth, clasificador de productos, etc.)
cd apps/mobile && npx expo-doctor     # diagnóstico de dependencias de Expo
```

## 7. Generar el APK (Android)

La app se compila en la nube con EAS. Pasos completos en
[docs/development/EAS-BUILD-SETUP.md](development/EAS-BUILD-SETUP.md). Resumen:

```bash
npm i -g eas-cli
eas login
cd apps/mobile
eas build -p android --profile preview     # genera el .apk descargable
```

El perfil `preview` apunta a la API desplegada (`EXPO_PUBLIC_API_URL`).

## 8. Despliegue de la API en EasyPanel

Pasos completos, variables y cron jobs en [DEPLOY-EASYPANEL.md](development/DEPLOY-EASYPANEL.md).
Resumen: un servicio **MySQL**, un servicio **App** desde GitHub (rama `easypanel`, build con el
`Dockerfile` de la raíz, puerto 3000), las variables de la sección 3 en *Environment* y los 3 cron
jobs. La URL pública del servicio App es la que va en `EXPO_PUBLIC_API_URL`.

## 9. Problemas frecuentes

| Síntoma | Causa y solución |
|---|---|
| Expo Go no conecta con la URL de IP | La IP de la PC cambió o el celu está en otra red. Usá `--tunnel` |
| "Node.js is outdated and unsupported" | Actualizá a Node 22.13+ |
| `EPERM … rename` al hacer `pnpm install` en Windows | Hay un Metro/Node abierto bloqueando archivos: cerralo y reintentá |
| La app se queda en el logo | El servidor Metro no está corriendo o se cayó: reiniciá `expo start` |
| "No pudimos enviar el mail" | Falta o es inválida `SMTP_PASS` (Gmail pide contraseña de aplicación) |
| El login social dice "no está activado" | Faltan las claves del proveedor o hay que redesplegar el servicio |
| Búsqueda sin chips de tipo | Falta correr `pnpm data:sepa:backfill-types` |
| `/api/health` devuelve 503 | `DATABASE_URL` incorrecta (revisá usuario, contraseña y que esté URL-encodeada) |
