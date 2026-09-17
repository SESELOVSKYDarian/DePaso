// Expo CLI en este monorepo detecta la raiz del workspace (aca) como su "project root"
// - por eso busca metro.config.js aca, no en apps/mobile, y sin este archivo cae al
// config por defecto de Metro (sin nuestro fix de EXPO_ROUTER_APP_ROOT/nodeModulesPaths,
// causaba "Error: No routes found" en runtime sin ningun error visible en el build -
// bug real, ver docs/development/PROGRESS.md Sesion 21). Reexporta el config real de
// apps/mobile, que es el unico paquete de este monorepo que usa Metro.
module.exports = require("./apps/mobile/metro.config.js");
