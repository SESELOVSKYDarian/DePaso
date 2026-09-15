# Geocodificación real — configuración manual (Fase 28)

Proveedor elegido: **Mapbox Geocoding API** — 100.000 requests/mes gratis, **sin tarjeta de
crédito** para el tier gratuito ("Temporary geocoding"; sólo el tier "Permanent geocoding",
que guarda resultados, pide tarjeta — no lo usamos). Confirmado contra la documentación
oficial de Mapbox (2026-09), no supuesto.

Esto reemplaza `Location.geocodeAsync`/`reverseGeocodeAsync` (nativo, `expo-location`) que
`places/form.tsx` y `route-context/index.tsx` llamaban directo desde el cliente — sin
implementación en Expo Web (por eso el error "No pudimos ubicar esa dirección" en
navegador) y poco confiable en Android real a largo plazo. El geocoding ahora pasa por
`apps/api` (`POST /api/geocode`), que sí funciona igual en Web/iOS/Android.

## Paso a paso — conseguir la key (10 minutos, gratis, sin tarjeta)

1. Ir a **https://www.mapbox.com** y hacer click en **"Sign up"** (arriba a la derecha).
2. Completar el registro con tu email — no pide tarjeta de crédito en este paso.
3. Confirmar el email (Mapbox manda un link de verificación).
4. Una vez adentro, ir a **https://console.mapbox.com/account/access-tokens/** (o
   "Tokens" en el menú de la cuenta).
5. Vas a ver un **"Default public token"** ya creado automáticamente
   (empieza con `pk.`). **Ese sirve** — no hace falta crear uno nuevo para esto.
   - Opcional (más prolijo, no obligatorio): crear un token nuevo con
     **"Create a token"**, ponerle nombre `depaso-geocoding`, y en "Secret scopes"
     dejarlo sin marcar nada especial (con los scopes públicos por defecto alcanza para
     geocoding).
6. Copiar el token (empieza con `pk.eyJ...`).

## Paso a paso — dónde pegarlo en el proyecto

1. Abrir (o crear, si no existe) el archivo `apps/api/.env.local`.
2. Agregar esta línea (reemplazar por tu token real):
   ```
   MAPBOX_ACCESS_TOKEN="pk.eyJ...tu-token-real-acá"
   ```
3. Guardar. **No hace falta reiniciar nada más** — `apps/api` (Next.js) lee `.env.local`
   automáticamente la próxima vez que arranque (`pnpm --filter @depaso/api run dev`).
4. **Nunca commitear ese archivo** — `apps/api/.env.local` ya está en `.gitignore` del
   monorepo (mismo patrón que `DATABASE_URL`).

## Cómo confirmar que quedó bien

Con `apps/api` corriendo, probar:

```bash
curl -X POST http://localhost:3000/api/geocode -H "Content-Type: application/json" -d '{"address":"Av. Constitución 5000, Mar del Plata"}'
```

Si devuelve `{"latitude": ..., "longitude": ...}` con números reales, quedó bien
configurado. Si devuelve `{"error":"GEOCODING_NOT_CONFIGURED"}`, el
`MAPBOX_ACCESS_TOKEN` no está seteado o el archivo `.env.local` no se guardó donde
correspondía.

## Límites del free tier a tener en cuenta

- 100.000 requests/mes gratis (Temporary geocoding) — de sobra para desarrollo y para el
  volumen de Mar del Plata en esta fase.
- Si algún día se supera ese volumen, Mapbox cobra desde \$0.75 cada 1.000 requests
  adicionales (no hay corte automático del servicio, así que conviene poner una alerta de
  uso en el dashboard de Mapbox si se llega a producción real).
- "Temporary geocoding" no permite guardar el resultado indefinidamente en una base de
  datos de terceros más allá de lo razonable para mostrarlo al usuario — DePaso ya cumple
  esto: sólo persiste `latitude`/`longitude` en `UserPlace` (el resultado final que el
  usuario eligió guardar), no cachea geocodificaciones de terceros por su cuenta.

## Qué hace el código con esto (para referencia, no hace falta tocar nada)

- `packages/data-sources/mapbox` (nuevo): `MapboxGeocodingProvider`, implementa la interfaz
  `GeocodingProvider` ya existente en `packages/domain/src/providers.ts` (Fase 1 — pensada
  para esto, no se rediseñó nada).
- `apps/api/app/api/geocode/route.ts`: `POST /api/geocode` (`{ address }` →
  `{ latitude, longitude }`) y `POST /api/geocode/reverse` (`{ latitude, longitude }` →
  `{ address }`). Si `MAPBOX_ACCESS_TOKEN` no está seteado, responde
  `503 GEOCODING_NOT_CONFIGURED` en vez de romper — así el resto de la app sigue
  funcionando aunque todavía no hayas configurado la key.
- `apps/mobile`: `places/form.tsx` y `route-context/index.tsx` llaman a este endpoint en
  vez de `Location.geocodeAsync` — funciona igual en Expo Web, iOS y Android.
