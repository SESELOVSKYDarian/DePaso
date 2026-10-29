/**
 * Prueba de punta a punta de la API: registro, login, JWT con refresh, CRUD de listas y
 * lugares, roles y cierre de sesión. Usa un usuario nuevo cada vez.
 *
 *   BASE_URL=http://localhost:3000 node apps/api/tests/e2e.mjs
 *
 * Importante: crea una cuenta de prueba, así que solo se corre contra una API de desarrollo.
 */
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const email = `e2e-${Date.now()}@example.com`;
const password = "ClaveDePrueba2026";

let passed = 0;
let failed = 0;

/** Llama a la API y devuelve { status, body }. */
async function call(method, path, body, token) {
  const response = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: method === "GET" ? undefined : JSON.stringify(body ?? {}),
  });
  const json = await response.json().catch(() => null);
  return { status: response.status, body: json };
}

/** Anota un resultado: ✔ si pasó, ✘ si no. */
function check(name, condition, detail = "") {
  if (condition) {
    passed++;
    console.log(`  ✔ ${name}`);
  } else {
    failed++;
    console.log(`  ✘ ${name} ${detail}`);
  }
}

console.log(`\nProbando ${BASE} con ${email}\n`);

console.log("Salud y reglas generales");
check("health responde ok (POST)", (await call("POST", "/api/health")).body?.ok === true);
check("GET no está permitido (405)", (await call("GET", "/api/lists/list")).status === 405);
check("sin token => 401", (await call("POST", "/api/lists/list", {})).status === 401);

console.log("Registro e inicio de sesión");
const bad = await call("POST", "/api/auth/register", { email: "no-es-un-mail", password: "x" });
check("registro con datos inválidos => 400", bad.status === 400);
const reg = await call("POST", "/api/auth/register", {
  email,
  password,
  displayName: "Prueba E2E",
  ageConfirmed18Plus: true,
  acceptTerms: true,
  acceptPrivacyNotice: true,
});
check("registro => 201 con access y refresh", reg.status === 201 && reg.body?.token && reg.body?.refreshToken, JSON.stringify(reg.body));
check("el access token es un JWT (3 partes)", reg.body?.token?.split(".").length === 3);
const dup = await call("POST", "/api/auth/register", { email, password, ageConfirmed18Plus: true, acceptTerms: true, acceptPrivacyNotice: true });
check("email repetido => 409", dup.status === 409);
check("login con clave mala => 401", (await call("POST", "/api/auth/login", { email, password: "incorrecta" })).status === 401);
const login = await call("POST", "/api/auth/login", { email, password });
check("login correcto => access y refresh", login.status === 200 && login.body?.token && login.body?.refreshToken);
let access = login.body.token;
let refresh = login.body.refreshToken;
const me = await call("POST", "/api/auth/me", {}, access);
check("/auth/me devuelve el usuario con rol USER", me.status === 200 && me.body?.email === email && me.body?.role === "USER");

console.log("Renovación del token (JWT + refresh)");
const renewed = await call("POST", "/api/auth/refresh", { refreshToken: refresh });
check("refresh => par nuevo", renewed.status === 200 && renewed.body?.token && renewed.body.refreshToken !== refresh);
check("reusar el refresh viejo => 401 (rotación)", (await call("POST", "/api/auth/refresh", { refreshToken: refresh })).status === 401);
access = renewed.body.token;
refresh = renewed.body.refreshToken;
check("access token nuevo sirve", (await call("POST", "/api/auth/me", {}, access)).status === 200);
check("JWT alterado => 401", (await call("POST", "/api/auth/me", {}, access.slice(0, -3) + "abc")).status === 401);

console.log("Listas de compra (crear, leer, actualizar, borrar)");
const list = await call("POST", "/api/lists", { name: "Compra de prueba" }, access);
check("crear lista => 201", list.status === 201 && list.body?.id);
const listId = list.body?.id;
check("nombre vacío => 400", (await call("POST", "/api/lists", { name: "" }, access)).status === 400);
const all = await call("POST", "/api/lists/list", {}, access);
check("listar incluye la nueva", all.body?.lists?.some((l) => l.id === listId));
check("detalle de la lista", (await call("POST", "/api/lists/detail", { id: listId }, access)).body?.name === "Compra de prueba");
const renamed = await call("PUT", "/api/lists", { id: listId, name: "Compra renombrada" }, access);
check("PUT renombra la lista", renamed.status === 200 && renamed.body?.name === "Compra renombrada");
const search = await call("POST", "/api/products/search", { q: "leche" }, access);
const product = search.body?.results?.[0];
check("buscar productos devuelve resultados", Boolean(product), JSON.stringify(search.body).slice(0, 120));
if (product) {
  const added = await call("POST", `/api/lists/${listId}/items`, { productId: product.id, quantity: 1 }, access);
  check("agregar producto => 201", added.status === 201 && added.body?.items?.length === 1);
  const itemId = added.body?.items?.[0]?.id;
  const changed = await call("PUT", "/api/lists/items", { id: listId, itemId, quantity: 3 }, access);
  check("PUT cambia la cantidad", changed.body?.items?.[0]?.quantity === 3);
  const removed = await call("DELETE", "/api/lists/items", { id: listId, itemId }, access);
  check("DELETE quita el producto", removed.status === 200 && removed.body?.items?.length === 0);
}
check("DELETE borra la lista", (await call("DELETE", "/api/lists", { id: listId }, access)).status === 200);
check("la lista borrada => 404", (await call("POST", "/api/lists/detail", { id: listId }, access)).status === 404);

console.log("Inicio y buscador de lugares");
const feed = await call("POST", "/api/home/feed", {}, access);
check("Inicio trae productos baratos y recomendados", feed.status === 200 && Array.isArray(feed.body?.cheapToday) && Array.isArray(feed.body?.popular));
const found = await call("POST", "/api/geocode/search", { q: "shell" }, access);
// el buscador usa un servicio externo: si no responde, no se cuenta como error de la app
if (found.status === 200) check("buscar \"shell\" devuelve lugares", found.body?.results?.length > 0);
else console.log(`  - buscador de lugares omitido (el servicio externo respondió ${found.status})`);
check("buscar con 1 letra => 400", (await call("POST", "/api/geocode/search", { q: "a" }, access)).status === 400);

const logos = await call("POST", "/api/stores/logos", {}, access);
check("los logos de las cadenas salen de la base", logos.status === 200 && logos.body?.logos?.length > 0 && logos.body.logos[0].imageDataUri.startsWith("data:image/png;base64,"));

console.log("Actividad");
const news = await call("POST", "/api/announcements/list", {}, access);
check("las novedades se leen con sesión", news.status === 200 && Array.isArray(news.body?.announcements));
check("un usuario común no publica novedades (403)", (await call("POST", "/api/admin/announcements", { title: "Prueba", body: "Prueba" }, access)).status === 403);
const personal = await call("POST", "/api/activity/feed", {}, access);
check("los avisos personales se leen con sesión", personal.status === 200 && Array.isArray(personal.body?.items));
check("sin sesión no hay novedades (401)", (await call("POST", "/api/announcements/list", {})).status === 401);

console.log("Lugares guardados");
const place = await call("POST", "/api/places", { name: "Casa", type: "HOME", address: "Av. Colón 1234", latitude: -38.0, longitude: -57.55 }, access);
check("crear lugar => 201", place.status === 201 && place.body?.id);
check("latitud fuera de rango => 400", (await call("POST", "/api/places", { name: "X", type: "HOME", address: "Y", latitude: 999, longitude: 0 }, access)).status === 400);
const moved = await call("PUT", "/api/places", { id: place.body?.id, name: "Casa nueva" }, access);
check("PUT actualiza el lugar", moved.status === 200 && moved.body?.name === "Casa nueva");
check("DELETE borra el lugar", (await call("DELETE", "/api/places", { id: place.body?.id }, access)).status === 200);

console.log("Roles y permisos");
check("USER no entra a admin (403)", (await call("POST", "/api/admin/users", {}, access)).status === 403);
check("USER no entra a comercio (403)", (await call("POST", "/api/merchant/prices/list", {}, access)).status === 403);
check("USER no crea comercios (403)", (await call("POST", "/api/admin/stores", { name: "X" }, access)).status === 403);

console.log("Cierre de sesión");
check("logout => ok", (await call("POST", "/api/auth/logout", {}, access)).status === 200);
check("access revocado => 401", (await call("POST", "/api/auth/me", {}, access)).status === 401);
check("refresh revocado => 401", (await call("POST", "/api/auth/refresh", { refreshToken: refresh })).status === 401);

console.log("Baja de cuenta");
const again = await call("POST", "/api/auth/login", { email, password });
check("login de nuevo", again.status === 200);
check("DELETE /auth/account borra la cuenta", (await call("DELETE", "/api/auth/account", {}, again.body?.token)).status === 200);
check("la cuenta borrada ya no entra (401)", (await call("POST", "/api/auth/login", { email, password })).status === 401);

console.log(`\nResultado: ${passed} bien, ${failed} mal\n`);
process.exit(failed === 0 ? 0 : 1);
