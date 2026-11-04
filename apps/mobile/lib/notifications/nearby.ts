import type { OptimizationPlanResponse } from "@depaso/validation";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { Platform } from "react-native";
import { getStoredValue, setStoredValue } from "@/lib/auth/secureStore";
import { showLocalNotification } from "./push";

/**
 * Aviso de cercanía: cuando pasás cerca de un comercio de tu compra de hoy, el celular te avisa.
 * Usa "geocercas" del sistema (círculos alrededor de cada comercio): las vigila Android/iOS, así
 * que funciona con la app cerrada y casi no gasta batería. Solo se activa si la persona lo pide.
 */

const TASK_NAME = "depaso-nearby-stores";
const ENABLED_KEY = "depaso_nearby_enabled";
const RADIUS_KEY = "depaso_nearby_radius";

/** Distancias que se pueden elegir, en metros. */
export const NEARBY_RADIUS_OPTIONS = [200, 500, 1000, 2000] as const;
export const DEFAULT_NEARBY_RADIUS = 500;

const supported = Platform.OS !== "web";

export function formatRadius(meters: number): string {
  return meters >= 1000 ? `${meters / 1000} km` : `${meters} m`;
}

// La tarea corre aunque la app esté cerrada, por eso se define al cargar el módulo.
if (supported) {
  TaskManager.defineTask(TASK_NAME, async ({ data, error }) => {
    if (error) return;
    const { eventType, region } = data as { eventType: Location.GeofencingEventType; region: Location.LocationRegion };
    if (eventType !== Location.GeofencingEventType.Enter) return;
    // el nombre del comercio viaja en el identificador: "<número>|<nombre>"
    const name = region.identifier?.split("|")[1] ?? "un comercio de tu recorrido";
    await showLocalNotification({
      title: `Estás cerca de ${name} 🛒`,
      body: "Está en tu compra de paso: aprovechá y pasá a comprar.",
      data: { type: "nearby" },
    });
  });
}

export async function isNearbyEnabled(): Promise<boolean> {
  return (await getStoredValue(ENABLED_KEY)) === "on";
}

export async function getNearbyRadius(): Promise<number> {
  const stored = Number(await getStoredValue(RADIUS_KEY));
  return NEARBY_RADIUS_OPTIONS.includes(stored as (typeof NEARBY_RADIUS_OPTIONS)[number]) ? stored : DEFAULT_NEARBY_RADIUS;
}

/** Pide la ubicación "todo el tiempo", que Android/iOS exigen para vigilar con la app cerrada. */
export async function requestNearbyPermission(): Promise<boolean> {
  if (!supported) return false;
  try {
    const foreground = await Location.requestForegroundPermissionsAsync();
    if (foreground.status !== "granted") return false;
    const background = await Location.requestBackgroundPermissionsAsync();
    return background.status === "granted";
  } catch {
    return false;
  }
}

/** Deja de vigilar los comercios. */
export async function stopNearbyAlerts(): Promise<void> {
  if (!supported) return;
  try {
    if (await Location.hasStartedGeofencingAsync(TASK_NAME)) await Location.stopGeofencingAsync(TASK_NAME);
  } catch {
    // si no estaba activo no hay nada que frenar
  }
}

/** Empieza a vigilar los comercios de la compra, si la persona activó el aviso y dio permiso. */
export async function startNearbyAlerts(plan: OptimizationPlanResponse): Promise<void> {
  if (!supported || !(await isNearbyEnabled())) return;
  try {
    const background = await Location.getBackgroundPermissionsAsync();
    if (background.status !== "granted") return;
    const radius = await getNearbyRadius();
    const regions = plan.stops
      .filter((stop) => stop.latitude !== undefined && stop.longitude !== undefined)
      .map((stop, index) => ({
        identifier: `${index}|${stop.storeName}`,
        latitude: stop.latitude!,
        longitude: stop.longitude!,
        radius,
        notifyOnEnter: true,
        notifyOnExit: false,
      }));
    if (regions.length === 0) return;
    await Location.startGeofencingAsync(TASK_NAME, regions);
  } catch {
    // sin geocercas la compra sigue igual: solo no llega el aviso
  }
}

/** Guarda si el aviso está prendido. Al apagarlo se frena la vigilancia. */
export async function setNearbyEnabled(enabled: boolean): Promise<void> {
  await setStoredValue(ENABLED_KEY, enabled ? "on" : "off");
  if (!enabled) await stopNearbyAlerts();
}

export async function setNearbyRadius(meters: number): Promise<void> {
  await setStoredValue(RADIUS_KEY, String(meters));
}
