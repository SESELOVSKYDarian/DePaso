const { withAppBuildGradle } = require("@expo/config-plugins");

/**
 * Config plugin que reaplica, en cada `expo prebuild`, los 2 fixes reales de
 * `app/build.gradle` necesarios en este monorepo (pnpm + node-linker=hoisted) — sin esto
 * el bundle de release falla resolviendo `expo-router/entry.js` y despues "No routes
 * found" (ver docs/development/PROGRESS.md Sesión 21/22 para el detalle completo).
 *
 * `root = workspaceRoot`: Expo CLI resuelve `--entry-file` (ruta relativa a `root`) contra
 * la raíz real del monorepo que detecta por workspace, no contra apps/mobile.
 *
 * `extraPackagerArgs = ["--config", ...]`: con `root` apuntando a la raíz del monorepo,
 * Expo CLI busca `metro.config.js` ahí (no existe uno "vacío" — hay un re-export en la
 * raíz que apunta al real, ver /metro.config.js) en vez de en apps/mobile; forzar
 * `--config` explícito evita cualquier ambigüedad.
 */
const WORKSPACE_ROOT_DECL = 'def workspaceRoot = new File(projectRoot, "../..").getCanonicalPath()';
const REACT_BLOCK_MARKER = "react {";
const FIX_MARKER = "// @depaso-monorepo-fix";

module.exports = function withMonorepoBuildFix(config) {
  return withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    if (contents.includes(FIX_MARKER)) {
      return config;
    }

    if (!contents.includes(WORKSPACE_ROOT_DECL)) {
      contents = contents.replace(
        /def projectRoot = .*\n/,
        (match) => `${match}${WORKSPACE_ROOT_DECL}\n`
      );
    }

    contents = contents.replace(
      REACT_BLOCK_MARKER,
      `${REACT_BLOCK_MARKER}\n` +
        `    ${FIX_MARKER} — ver docs/development/PROGRESS.md Sesion 21/22, no sacar sin leer eso\n` +
        `    root = file(workspaceRoot)\n` +
        `    extraPackagerArgs = ["--config", "$projectRoot/metro.config.js"]\n`
    );

    config.modResults.contents = contents;
    return config;
  });
};
