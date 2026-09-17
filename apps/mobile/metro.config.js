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

const config = getDefaultConfig(projectRoot);

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

module.exports = config;
