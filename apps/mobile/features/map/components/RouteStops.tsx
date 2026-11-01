import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import type { TodayWaypoint } from "@/lib/routeContext/TodayRouteContext";
import { makeStyles, useColors } from "@/lib/theme";
import { useStyles as useScreenStyles } from "../styles";

/**
 * "Tu recorrido": una línea de tiempo con la salida, cada parada y el destino final. La salida y
 * el destino llevan su rótulo y su ícono para que se entienda de un vistazo por dónde vas.
 */
export function RouteStops({ waypoints }: { waypoints: TodayWaypoint[] }) {
  const s = useScreenStyles();
  const styles = useStyles();
  const colors = useColors();
  const last = waypoints.length - 1;

  return (
    <>
      <Text style={s.section}>Tu recorrido</Text>
      <View style={styles.card}>
        {waypoints.map((w, i) => {
          const isFirst = i === 0;
          const isLast = i === last;
          const tag = isFirst ? "SALIDA" : isLast ? "DESTINO" : `PARADA ${i}`;
          return (
            <View key={w.key} style={styles.row}>
              <View style={styles.rail}>
                <View style={[styles.dot, isFirst ? styles.dotStart : isLast ? styles.dotEnd : null]}>
                  {isFirst ? (
                    <Ionicons name="navigate" size={14} color={colors.text.onNavy} />
                  ) : isLast ? (
                    <Ionicons name="flag" size={14} color={colors.text.onLime} />
                  ) : (
                    <Text style={styles.dotText}>{i}</Text>
                  )}
                </View>
                {!isLast ? <View style={styles.line} /> : null}
              </View>
              <View style={styles.text}>
                <Text style={styles.tag}>{tag}</Text>
                <Text style={styles.name} numberOfLines={1}>
                  {w.name}
                </Text>
                {w.address ? (
                  <Text style={s.address} numberOfLines={1}>
                    {w.address}
                  </Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    card: {
      padding: spacing.md,
      borderRadius: radii.xl,
      backgroundColor: colors.surface.primary,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    row: { flexDirection: "row", gap: spacing.md, minHeight: 62 },
    rail: { alignItems: "center", width: 30 },
    dot: { width: 30, height: 30, borderRadius: radii.full, alignItems: "center", justifyContent: "center", backgroundColor: colors.brand.route },
    dotStart: { backgroundColor: colors.brand.navy },
    dotEnd: { backgroundColor: colors.saving.lime },
    dotText: { fontFamily: typography.itemTitle.fontFamily, fontSize: 13, color: colors.text.onNavy },
    line: { width: 2, flex: 1, marginVertical: 3, borderRadius: 1, backgroundColor: colors.border.strong },
    text: { flex: 1, paddingBottom: spacing.sm },
    tag: { fontFamily: typography.caption.fontFamily, fontSize: 11, letterSpacing: 1, color: colors.text.tertiary },
    name: { fontFamily: typography.itemTitle.fontFamily, fontSize: 15, color: colors.text.primary },
  }),
);
