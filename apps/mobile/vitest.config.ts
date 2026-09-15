import { defineConfig } from "vitest/config";

/**
 * Sólo `lib/**` (funciones puras, sin JSX/React Native) — testear componentes necesitaría
 * un renderer de RN (`@testing-library/react-native` + config de Jest/Babel específica) que
 * esta fase no amerita todavía; las funciones puras son donde vive la lógica con más riesgo
 * real de bug silencioso (ver `lib/priceDisclosure.ts`, BUSINESS-RULES.md p.9).
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
