import type { CustomStorePreferenceResponse } from "@depaso/validation";

interface CustomStoreRow {
  id: string;
  category: string;
  type: "REQUIRED" | "PREFERRED";
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
}

/** Fila de la base → lo que ve la app. */
export function toCustomStoreResponse(row: CustomStoreRow): CustomStorePreferenceResponse {
  return { id: row.id, category: row.category, type: row.type, name: row.name, address: row.address, latitude: row.latitude, longitude: row.longitude };
}