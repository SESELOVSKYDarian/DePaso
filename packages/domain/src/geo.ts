export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
  /** Waypoints en el orden en que efectivamente se recorren. */
  orderedWaypoints: LatLng[];
  /** Polyline codificada, cuando el proveedor la da. Mock no la provee. */
  polyline: string | null;
}
