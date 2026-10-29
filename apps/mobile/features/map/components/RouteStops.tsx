import { Text, View } from "react-native";
import type { TodayWaypoint } from "@/lib/routeContext/TodayRouteContext";
import { useStyles } from "../styles";

/** "Paradas del recorrido": la línea de tiempo con cada parada, numerada, hasta el destino final. */
export function RouteStops({ waypoints }: { waypoints: TodayWaypoint[] }) {
  const s = useStyles();

  return (
    <>
      <Text style={s.section}>Paradas del recorrido</Text>
      {waypoints.map((w, i) => (
        <View key={w.key} style={s.stop}>
          <View style={s.rail}>
            <View style={s.number}>
              <Text style={s.numberText}>{i + 1}</Text>
            </View>
            {i < waypoints.length - 1 ? <View style={s.line} /> : null}
          </View>
          <View style={s.stopText}>
            <Text style={s.stopName}>{w.name}</Text>
            <Text style={s.address}>{i === waypoints.length - 1 ? "Destino final" : w.address}</Text>
          </View>
        </View>
      ))}
    </>
  );
}
