import { Ionicons } from "@expo/vector-icons";
import { colors, radii, spacing, typography } from "@depaso/design-tokens";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { EmptyState } from "@/components/EmptyState";
import { RouteMapView } from "@/components/RouteMapView";
import { mapConfigClient, routeComputeClient } from "@/lib/apiClient";
import { useTodayRoute } from "@/lib/routeContext/TodayRouteContext";

/** Mapa visual con ruta dibujada (Fase 17) — Mapbox GL JS real cuando hay token
 * configurado; si no, conserva el fallback funcional anterior (orden + direcciones). */
export default function MapScreen() {
  const { waypoints } = useTodayRoute();
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [polyline, setPolyline] = useState<string | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  useEffect(() => {
    if (waypoints.length < 2) return;
    let cancelled = false;
    setIsLoadingRoute(true);
    Promise.all([
      mapConfigClient.getMapboxToken(),
      routeComputeClient.compute({
        waypoints: waypoints.map(({ latitude, longitude }) => ({ latitude, longitude })),
        transportMode: "CAR",
      }),
    ])
      .then(([config, route]) => {
        if (cancelled) return;
        setMapboxToken(config.token);
        setPolyline(route.polyline);
      })
      .catch(() => {
        if (!cancelled) {
          setMapboxToken(null);
          setPolyline(null);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingRoute(false);
      });
    return () => {
      cancelled = true;
    };
  }, [waypoints]);

  if (waypoints.length < 2) return <SafeAreaView style={s.container} edges={["top"]}><EmptyState emoji="🗺️" title="Todavía no tenés una ruta activa" description="Elegí origen y destino para ver el recorrido." action={<AnimatedPressable accessibilityLabel="Elegir recorrido" onPress={() => router.push("/route-context")} style={s.emptyAction}><Text style={s.emptyActionText}>Elegir mi recorrido</Text></AnimatedPressable>} /></SafeAreaView>;
  return <SafeAreaView style={s.container} edges={["top"]}><ScrollView contentContainerStyle={s.content}>
    <View style={s.header}><View><Text style={s.title}>Tu ruta activa</Text><Text style={s.subtitle}>{waypoints.length} paradas en orden</Text></View><AnimatedPressable accessibilityLabel="Editar recorrido" haptic={false} onPress={() => router.push("/route-context")} style={s.edit}><Ionicons name="create-outline" size={19} color={colors.text.primary} /></AnimatedPressable></View>
    {isLoadingRoute ? (
      <View style={s.mapLoading}><ActivityIndicator color={colors.brand.navy} /></View>
    ) : mapboxToken ? (
      <RouteMapView
        waypoints={waypoints.map(({ latitude, longitude }) => ({ latitude, longitude }))}
        polyline={polyline}
        mapboxToken={mapboxToken}
      />
    ) : (
      <View style={s.routeCard}><Ionicons name="navigate-outline" size={30} color={colors.brand.route} /><Text style={s.routeLabel}>Tu recorrido de hoy</Text><Text style={s.routeHint}>El mapa visual necesita un token de Mapbox configurado — ver docs/development/GEOCODING-SETUP.md (misma key).</Text></View>
    )}
    <Text style={s.section}>Paradas del recorrido</Text>{waypoints.map((w, i) => <View key={w.key} style={s.stop}><View style={s.rail}><View style={s.number}><Text style={s.numberText}>{i + 1}</Text></View>{i < waypoints.length - 1 ? <View style={s.line} /> : null}</View><View style={s.stopText}><Text style={s.stopName}>{w.name}</Text><Text style={s.address}>{i === waypoints.length - 1 ? "Destino final" : w.address}</Text></View></View>)}
  </ScrollView></SafeAreaView>;
}
const s = StyleSheet.create({container:{flex:1,backgroundColor:colors.surface.base},content:{padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.md},header:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},title:{fontFamily:typography.heroTitle.fontFamily,fontSize:24,color:colors.text.primary},subtitle:{fontFamily:typography.caption.fontFamily,fontSize:13,color:colors.text.secondary},edit:{width:44,height:44,borderRadius:radii.full,backgroundColor:colors.surface.primary,borderWidth:1,borderColor:colors.border.subtle,alignItems:"center",justifyContent:"center"},mapLoading:{height:260,borderRadius:radii.xl,backgroundColor:colors.surface.secondary,alignItems:"center",justifyContent:"center"},routeCard:{alignItems:"center",gap:spacing.xs,padding:spacing.lg,borderRadius:radii.xl,backgroundColor:colors.tint.blue.bg,borderWidth:1,borderColor:colors.tint.blue.border},routeLabel:{fontFamily:typography.itemTitle.fontFamily,fontSize:16,color:colors.text.primary},routeHint:{fontFamily:typography.caption.fontFamily,fontSize:12,lineHeight:17,textAlign:"center",color:colors.text.secondary},section:{fontFamily:typography.itemTitle.fontFamily,fontSize:16,color:colors.text.primary},stop:{flexDirection:"row",gap:spacing.sm,minHeight:58},rail:{alignItems:"center",width:30},number:{width:30,height:30,borderRadius:radii.full,alignItems:"center",justifyContent:"center",backgroundColor:colors.brand.navy},numberText:{fontFamily:typography.itemTitle.fontFamily,fontSize:13,color:colors.text.onNavy},line:{width:2,flex:1,marginVertical:4,backgroundColor:colors.brand.route},stopText:{flex:1,paddingTop:4},stopName:{fontFamily:typography.itemTitle.fontFamily,fontSize:15,color:colors.text.primary},address:{fontFamily:typography.caption.fontFamily,fontSize:12,color:colors.text.secondary,marginTop:2},emptyAction:{minHeight:44,backgroundColor:colors.brand.navy,borderRadius:radii.full,paddingHorizontal:spacing.lg,alignItems:"center",justifyContent:"center"},emptyActionText:{fontFamily:typography.buttonLabel.fontFamily,fontSize:15,color:colors.text.onNavy}});
