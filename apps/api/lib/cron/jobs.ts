import { refreshProductPopularity } from "../catalog/catalogMaintenance";
import { prefillProductImages } from "../catalog/productImages";
import { syncPaymentPromos } from "../promos/syncPromos";
import type { ScheduledJob } from "./internalSchedule";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

/** Fotos que se revisan por vez: poco, porque las bases abiertas piden un uso moderado. */
const IMAGES_PER_RUN = 40;

/**
 * Las tareas de mantenimiento que antes se programaban a mano en EasyPanel. Los endpoints
 * `/api/promos/sync`, `/api/catalog/refresh` y `/api/catalog/images` siguen existiendo para
 * correrlos a mano o desde un cron externo.
 */
export const MAINTENANCE_JOBS: ScheduledJob[] = [
  { name: "fotos de productos", everyMs: HOUR, firstDelayMs: 2 * MINUTE, run: () => prefillProductImages(IMAGES_PER_RUN) },
  { name: "promos de bancos", everyMs: 24 * HOUR, firstDelayMs: MINUTE, run: syncPaymentPromos },
  { name: "popularidad de productos", everyMs: 24 * HOUR, firstDelayMs: 5 * MINUTE, run: refreshProductPopularity },
];
