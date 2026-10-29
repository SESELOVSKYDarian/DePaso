# Deploy en EasyPanel (API + MySQL)

## 1. Base de datos
En el proyecto de EasyPanel: **Create Service → MySQL**. Anotá el nombre del servicio, el
usuario, la clave y la base. La URL interna queda así:

```
DATABASE_URL=mysql://USUARIO:CLAVE@NOMBRE-DEL-SERVICIO-MYSQL:3306/BASE
```

## 2. API
**Create Service → App**, origen GitHub `SESELOVSKYDarian/DePaso`, rama `easypanel`, build con
**Dockerfile** (`Dockerfile` en la raíz). Puerto del contenedor: `3000`. Dominio: el que te da
EasyPanel (esa es la URL de la API). Al arrancar, el contenedor aplica las migraciones solo.

### Variables de entorno (pestaña Environment)
| Variable | Para qué |
| --- | --- |
| `DATABASE_URL` | MySQL interno (ver arriba) |
| `AUTH_SESSION_SECRET` | secreto de las sesiones/tokens (largo y aleatorio) |
| `CRON_SECRET` | secreto de los cron (largo y aleatorio) |
| `MAPBOX_ACCESS_TOKEN` | mapas, geocoding y rutas |
| `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL` | asistente de listas |
| `STT_API_KEY`, `STT_BASE_URL`, `STT_MODEL` | dictado por voz |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | mail de recuperar contraseña |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | login con Google (opcional) |

## 3. Cron jobs (pestaña Cron Jobs del servicio App)
Corren dentro del contenedor de la API:

| Cuándo | Comando |
| --- | --- |
| `0 10 * * *` | `curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/promos/sync` |
| `30 10 * * *` | `curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/catalog/refresh` |
| `0 6 * * *` | `pnpm data:sepa:import --wholesale` |

El import de SEPA es lo que llena `price_history`: con dos corridas en días distintos empiezan a
aparecer "subió" y "bajó" en Inicio. La primera vez conviene correrlo a mano desde la consola
del servicio (`pnpm data:sepa:import --wholesale`) y después `pnpm data:sepa:backfill-types`.

## 4. App mobile
`EXPO_PUBLIC_API_URL=https://<dominio-de-la-api>` y volver a abrir Expo.

## 5. Web (la app en el navegador)
La misma app de Expo se exporta como sitio web y se sirve con nginx. Es un **segundo servicio App**
en el mismo proyecto de EasyPanel, aparte de la API.

1. **Create Service → App**, origen GitHub `SESELOVSKYDarian/DePaso`, rama `easypanel`.
2. **Build**: elegí **Dockerfile** y en la ruta del archivo escribí `Dockerfile.web`
   (en la raíz del repo; ya trae su `Dockerfile.web.dockerignore`).
3. **Environment**: `EXPO_PUBLIC_API_URL=https://<dominio-de-la-api>` (si EasyPanel pasa las variables al
   build, se usa esa; si no, el Dockerfile ya trae la URL actual como valor por defecto).
4. **Domains**: puerto **80**. Ese dominio es la URL de la web.
5. **Deploy**. Tarda unos minutos porque compila la app.
6. En el servicio de la **API**, agregá `CORS_ALLOWED_ORIGINS=https://<dominio-de-la-web>` y
   volvé a desplegarla: sin eso el navegador bloquea las llamadas.

Para probarla en local: `cd apps/mobile && EXPO_PUBLIC_API_URL=http://localhost:3000 npx expo start --web`.
