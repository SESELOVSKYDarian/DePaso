import type { ConfidenceLevel } from "@depaso/types";

/**
 * CommunityTrustService — Fase 13-14. La fórmula exacta del trust score/reputación
 * ponderada está marcada NO DEFINIDO en BUSINESS-RULES.md (p.7, "NO DEFINIDO") — esto es
 * un punto de partida simple y documentado, a calibrar con datos reales. Lo que sí es
 * regla obligatoria: nunca exponer el valor numérico al usuario; usar `toConfidenceLevel`
 * para cualquier superficie pública.
 */

export interface TrustScoreState {
  score: number;
  reportsSubmitted: number;
  reportsConfirmed: number;
}

export const INITIAL_TRUST_SCORE: TrustScoreState = {
  score: 0.5,
  reportsSubmitted: 0,
  reportsConfirmed: 0,
};

const MIN_SCORE = 0;
const MAX_SCORE = 1;
const SCORE_STEP_UP = 0.03;
const SCORE_STEP_DOWN = 0.08;

export type ReportOutcome = "CONFIRMED" | "DISPUTED" | "REJECTED";

export function recordReportSubmitted(state: TrustScoreState): TrustScoreState {
  return { ...state, reportsSubmitted: state.reportsSubmitted + 1 };
}

/**
 * Historial consistente pesa más (regla anti-fraude p.8) — subir de a poco, bajar más
 * rápido, para que un puñado de reportes rechazados no se compense con uno confirmado.
 */
export function recordReportOutcome(state: TrustScoreState, outcome: ReportOutcome): TrustScoreState {
  const delta = outcome === "CONFIRMED" ? SCORE_STEP_UP : -SCORE_STEP_DOWN;
  return {
    ...state,
    score: clamp(state.score + delta, MIN_SCORE, MAX_SCORE),
    reportsConfirmed: state.reportsConfirmed + (outcome === "CONFIRMED" ? 1 : 0),
  };
}

export function toConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 0.7) return "HIGH";
  if (score >= 0.4) return "MEDIUM";
  return "LOW";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
