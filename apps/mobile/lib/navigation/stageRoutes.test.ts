import { describe, expect, it } from "vitest";
import { belongsToStage, homeForStage } from "./stageRoutes";

const base = { onboardingSeen: true, isAuthenticated: true, needsEmail: false, postSignupDone: true };

describe("a dónde corresponde estar según la sesión", () => {
  it("sigue la secuencia: bienvenida, ingreso, mail, configuración y la app", () => {
    expect(homeForStage({ ...base, onboardingSeen: false, isAuthenticated: false })).toBe("/onboarding");
    expect(homeForStage({ ...base, isAuthenticated: false })).toBe("/(auth)");
    expect(homeForStage({ ...base, needsEmail: true, postSignupDone: false })).toBe("/verify-email");
    expect(homeForStage({ ...base, postSignupDone: false })).toBe("/(setup)/location");
    expect(homeForStage(base)).toBe("/(tabs)");
  });
});

describe("si la pantalla actual ya es de la etapa", () => {
  it("reconoce la pantalla de cada etapa", () => {
    expect(belongsToStage("/(auth)", "(auth)")).toBe(true);
    expect(belongsToStage("/(setup)/location", "(setup)")).toBe(true);
    expect(belongsToStage("/onboarding", "onboarding")).toBe(true);
  });

  it("no da por buena una pantalla de otra etapa ni una perdida", () => {
    expect(belongsToStage("/(setup)/location", "verify-email")).toBe(false);
    expect(belongsToStage("/(setup)/location", "+not-found")).toBe(false);
    expect(belongsToStage("/(auth)", undefined)).toBe(false);
  });

  it("con sesión vale cualquier pantalla de la app, pero no las de otras etapas", () => {
    expect(belongsToStage("/(tabs)", "(tabs)")).toBe(true);
    expect(belongsToStage("/(tabs)", "lists")).toBe(true);
    expect(belongsToStage("/(tabs)", "(setup)")).toBe(false);
    expect(belongsToStage("/(tabs)", "[...unmatched]")).toBe(false);
  });
});