// pnpm con node-linker=hoisted deja algunos paquetes (ej. expo-router) sólo en el
// node_modules raíz del monorepo, no en apps/mobile/node_modules — sin esto Metro no
// los encuentra. OJO: no tocar `watchFolders` acá — Metro lo usa como base para
// resolver rutas relativas como `--entry-file` (pasado por el Gradle plugin de RN), y
// agregar la raíz del monorepo ahí rompe esa resolución (bug real encontrado armando
// el build release: "Unable to resolve module ... from D:\DePaso/.").
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

// El plugin de babel de expo-router detecta la carpeta `app/` sola, pero con `root`
// apuntando a la raiz del monorepo (necesario para el fix de arriba) se confunde y
// busca `app/` en D:\DePaso en vez de apps/mobile - "Error: No routes found" en
// runtime (bug real, ver PROGRESS.md Sesion 21). Fijarlo explicito lo saca de dudas.
process.env.EXPO_ROUTER_APP_ROOT = path.resolve(projectRoot, "app");

const config = getDefaultConfig(projectRoot);

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// El alias "@/" (tsconfig.json paths) normalmente lo resuelve babel-preset-expo leyendo
// tsconfig.json, pero esa deteccion usa `process.cwd()` - que con `root` apuntando a la
// raiz del monorepo (arriba) es D:\DePaso, donde no hay tsconfig.json, así que fallaba con
// "Unable to resolve module @/components/..." (bug real, PROGRESS.md Sesión 21). Resuelto
// directo en Metro, sin depender de esa deteccion.
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith("@/")) {
    const resolved = path.join(projectRoot, moduleName.slice(2));
    return context.resolveRequest(context, resolved, platform);
  }
  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
