import { Ionicons } from "@expo/vector-icons";
import { ApiError } from "@depaso/api-client";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radii, spacing, typography } from "@depaso/design-tokens";
import type { RouteContextResponse } from "@depaso/validation";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { BottomSheet } from "@/components/BottomSheet";
import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { FormField } from "@/components/FormField";
import { SelectCheckbox } from "@/components/SelectCheckbox";
import { useToast } from "@/components/Toast";
import { geocodeClient, routeContextClient } from "@/lib/apiClient";
import { PLACE_TYPE_META } from "@/lib/placeTypes";
import { usePlaces } from "@/lib/places/PlacesContext";
import { useTodayRoute, type TodayWaypoint } from "@/lib/routeContext/TodayRouteContext";

const GEOCODING_NOT_CONFIGURED_MESSAGE =
  "La geocodificación real todavía no está configurada — ver docs/development/GEOCODING-SETUP.md.";

/** Geocoding real vía `apps/api` (Fase 28) — ver `apps/mobile/app/places/form.tsx`, mismo
 * criterio: `Location.geocodeAsync` no funciona en Expo Web. */
async function geocodeAddress(address: string) {
  try {
    return await geocodeClient.forward({ address });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export default function RouteContextScreen() {
  const { places } = usePlaces();
  const { waypoints: savedToday, setWaypoints: commitToday } = useTodayRoute();
  const { show: showToast } = useToast();

  const [waypoints, setWaypoints] = useState<TodayWaypoint[]>(savedToday);
  const [presets, setPresets] = useState<RouteContextResponse[]>([]);
  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [tempName, setTempName] = useState("");
  const [tempAddress, setTempAddress] = useState("");
  const [tempError, setTempError] = useState<string | undefined>();
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [askSaveDialog, setAskSaveDialog] = useState<TodayWaypoint | null>(null);
  const [savingPresetName, setSavingPresetName] = useState<string | null>(null);

  useEffect(() => {
    routeContextClient
      .list()
      .then((res) => setPresets(res.routeContexts))
      .catch(() => {
        // Sin presets todavía (o sin conexión) — no bloquea el resto de la pantalla.
      });
  }, []);

  const selectedPlaceIds = new Set(waypoints.map((w) => w.placeId).filter(Boolean));

  const addWaypoint = (waypoint: TodayWaypoint) => setWaypoints((prev) => [...prev, waypoint]);
  const removeWaypoint = (key: string) => setWaypoints((prev) => prev.filter((w) => w.key !== key));

  const addSavedPlace = (place: (typeof places)[number]) => {
    addWaypoint({
      key: place.id,
      placeId: place.id,
      name: place.name,
      address: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      emoji: PLACE_TYPE_META[place.type].emoji,
    });
  };

  const togglePlace = (place: (typeof places)[number]) => {
    if (selectedPlaceIds.has(place.id)) {
      removeWaypoint(place.id);
    } else {
      addSavedPlace(place);
    }
  };

  const addCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      showToast("No pudimos acceder a tu ubicación.", "error");
      return;
    }
    const position = await Location.getCurrentPositionAsync({});
    addWaypoint({
      key: `current-${Date.now()}`,
      name: "Ubicación actual",
      address: "Tu ubicación en este momento",
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      emoji: "📍",
    });
  };

  const handleAddTemporary = async () => {
    if (!tempAddress.trim()) {
      setTempError("Ingresá una dirección.");
      return;
    }
    setIsGeocoding(true);
    try {
      const coords = await geocodeAddress(tempAddress);
      if (!coords) {
        setTempError("No pudimos ubicar esa dirección — probá ser más específico.");
        return;
      }
      const waypoint: TodayWaypoint = {
        key: `temp-${Date.now()}`,
        name: tempName.trim() || tempAddress.trim(),
        address: tempAddress.trim(),
        ...coords,
        emoji: "📍",
      };
      addWaypoint(waypoint);
      setAddSheetVisible(false);
      setTempName("");
      setTempAddress("");
      setTempError(undefined);
      setAskSaveDialog(waypoint);
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) {
        setTempError(GEOCODING_NOT_CONFIGURED_MESSAGE);
      } else if (err instanceof ApiError) {
        setTempError("No pudimos ubicar esa dirección. Probá de nuevo.");
      } else {
        // No es un error de la API (404/503) sino de red/conexión — el servidor puede estar
        // caído o inalcanzable. Bug real encontrado probando el flujo completo: antes esto
        // mostraba el mismo mensaje que "dirección no encontrada", lo que hacía parecer que
        // el geocoding fallaba cuando en realidad no había servidor al otro lado.
        setTempError("No pudimos conectar con el servidor. Revisá tu conexión e intentá de nuevo.");
      }
    } finally {
      setIsGeocoding(false);
    }
  };

  const applyPreset = (preset: RouteContextResponse) => {
    const resolved = preset.waypointPlaceIds
      .map((id) => places.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => p !== undefined)
      .map((place) => ({
        key: place.id,
        placeId: place.id,
        name: place.name,
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
        emoji: PLACE_TYPE_META[place.type].emoji,
      }));
    setWaypoints(resolved);
    showToast(`Cargaste "${preset.name}"`, "success");
  };

  const handleSavePreset = async () => {
    const name = savingPresetName?.trim();
    const placeIds = waypoints.map((w) => w.placeId).filter((id): id is string => id !== undefined);
    if (!name || placeIds.length === 0) return;
    try {
      const created = await routeContextClient.create({ name, waypointPlaceIds: placeIds });
      setPresets((prev) => [created, ...prev]);
      setSavingPresetName(null);
      showToast("Recorrido guardado.", "success");
    } catch {
      showToast("No pudimos guardar el recorrido.", "error");
    }
  };

  const handleDone = () => {
    commitToday(waypoints);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.navHeader}>
        <AnimatedPressable accessibilityLabel="Volver" haptic={false} onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </AnimatedPressable>
        <View>
          <Text style={styles.navTitle}>¿Por dónde vas a andar hoy?</Text>
          <Text style={styles.navSubtitle}>Contanos tu ruta.</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.mapBanner}>
          <Ionicons name="map-outline" size={28} color={colors.brand.route} />
          <Text style={styles.mapBannerText}>Seleccioná los lugares que vas a visitar y armamos la mejor ruta.</Text>
        </View>

        {presets.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Tus recorridos guardados</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsRow}>
              {presets.map((preset) => (
                <AnimatedPressable
                  key={preset.id}
                  accessibilityLabel={`Usar recorrido ${preset.name}`}
                  haptic={false}
                  onPress={() => applyPreset(preset)}
                  style={styles.presetChip}
                >
                  <Text style={styles.presetLabel}>{preset.name}</Text>
                </AnimatedPressable>
              ))}
            </ScrollView>
          </>
        ) : null}

        <View style={styles.listHeaderRow}>
          <Text style={styles.sectionTitle}>Mis lugares</Text>
          <Text style={styles.editLink} onPress={() => router.push("/places")}>
            Editar
          </Text>
        </View>
        <View style={styles.placesList}>
          {places.length === 0 ? (
            <Text style={styles.emptyHint}>
              Todavía no guardaste ningún lugar. Agregá el de hoy más abajo o guardá uno en Mis lugares.
            </Text>
          ) : (
            places.map((place) => {
              const meta = PLACE_TYPE_META[place.type];
              const checked = selectedPlaceIds.has(place.id);
              return (
                <AnimatedPressable
                  key={place.id}
                  accessibilityLabel={`${checked ? "Quitar" : "Agregar"} ${place.name} del recorrido de hoy`}
                  haptic={false}
                  onPress={() => togglePlace(place)}
                  style={styles.placeRow}
                >
                  <Text style={styles.placeEmoji}>{meta.emoji}</Text>
                  <View style={styles.placeText}>
                    <Text style={styles.placeName}>{place.name}</Text>
                    <Text style={styles.placeAddress} numberOfLines={1}>
                      {place.address}
                    </Text>
                  </View>
                  <SelectCheckbox checked={checked} />
                </AnimatedPressable>
              );
            })
          )}

          <AnimatedPressable
            accessibilityLabel="Agregar ubicación actual"
            haptic={false}
            onPress={() => void addCurrentLocation()}
            style={styles.placeRow}
          >
            <Ionicons name="navigate-outline" size={18} color={colors.text.secondary} />
            <Text style={styles.placeName}>Ubicación actual</Text>
          </AnimatedPressable>

          <AnimatedPressable
            accessibilityLabel="Agregar lugar de hoy"
            onPress={() => setAddSheetVisible(true)}
            style={styles.addStopRow}
          >
            <Ionicons name="add" size={16} color={colors.brand.route} />
            <Text style={styles.addStopLabel}>Agregar lugar de hoy</Text>
          </AnimatedPressable>
        </View>

        {waypoints.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Tu ruta de hoy</Text>
            <View style={styles.placesList}>
              {waypoints.map((w, i) => (
                <View key={w.key} style={styles.waypointRow}>
                  <Text style={styles.waypointNumber}>{i + 1}</Text>
                  <Text style={styles.placeEmoji}>{w.emoji}</Text>
                  <View style={styles.placeText}>
                    <Text style={styles.placeName}>{w.name}</Text>
                    <Text style={styles.placeAddress} numberOfLines={1}>
                      {w.address}
                    </Text>
                  </View>
                  <AnimatedPressable
                    accessibilityLabel={`Quitar ${w.name} de la ruta de hoy`}
                    haptic={false}
                    onPress={() => removeWaypoint(w.key)}
                    style={styles.removeWaypointButton}
                  >
                    <Ionicons name="close" size={16} color={colors.text.secondary} />
                  </AnimatedPressable>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {waypoints.some((w) => w.placeId) ? (
          savingPresetName === null ? (
            <Button
              label="Guardar este recorrido para más adelante"
              variant="ghost"
              onPress={() => setSavingPresetName("")}
              style={styles.savePresetTrigger}
            />
          ) : (
            <View style={styles.savePresetForm}>
              <FormField
                label="Nombre del recorrido"
                value={savingPresetName}
                onChangeText={setSavingPresetName}
                placeholder="Trabajo → Casa"
              />
              <View style={styles.savePresetActions}>
                <Button label="Cancelar" variant="ghost" onPress={() => setSavingPresetName(null)} style={{ flex: 1 }} />
                <Button label="Guardar" variant="secondary" onPress={() => void handleSavePreset()} style={{ flex: 1 }} />
              </View>
            </View>
          )
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        {waypoints.length > 0 ? (
          <AnimatedPressable accessibilityLabel="Confirmar recorrido de hoy" onPress={handleDone} style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>TU RUTA DE HOY</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryRoute} numberOfLines={1}>
                {waypoints.map((w) => w.name).join("  →  ")}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.text.onNavy} />
            </View>
            <Text style={styles.summaryMeta}>
              {waypoints.length} {waypoints.length === 1 ? "parada" : "paradas"}
            </Text>
          </AnimatedPressable>
        ) : (
          <Button label="Listo" onPress={handleDone} disabled />
        )}
      </View>

      <BottomSheet visible={addSheetVisible} onClose={() => setAddSheetVisible(false)}>
        <Text style={styles.sheetTitle}>Agregar lugar de hoy</Text>
        <FormField label="Nombre (opcional)" value={tempName} onChangeText={setTempName} placeholder="Médico, Shopping..." />
        <FormField
          label="Dirección"
          value={tempAddress}
          onChangeText={setTempAddress}
          placeholder="Calle y altura, barrio"
          error={tempError}
        />
        <Button
          label={isGeocoding ? "Buscando dirección..." : "Agregar"}
          onPress={() => void handleAddTemporary()}
          disabled={isGeocoding}
        />
      </BottomSheet>

      <Dialog
        visible={askSaveDialog !== null}
        title="¿Guardar este lugar para otra vez?"
        description={askSaveDialog ? `"${askSaveDialog.name}" quedaría disponible como lugar guardado.` : undefined}
        confirmLabel="Guardar"
        cancelLabel="No"
        onCancel={() => setAskSaveDialog(null)}
        onConfirm={() => {
          // El alta real de UserPlace queda para cuando el usuario lo pida desde Mis
          // lugares — acá sólo confirmamos la intención (sección 34: nunca guardar un
          // lugar temporal sin acción explícita). Evita duplicar el formulario de tipo
          // acá mismo.
          showToast("Andá a Perfil → Mis lugares para guardarlo con todos sus datos.", "info");
          setAskSaveDialog(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.base,
  },
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    fontFamily: typography.screenTitle.fontFamily,
    fontSize: 20,
    color: colors.text.primary,
  },
  navSubtitle: {
    fontFamily: typography.subtitle.fontFamily,
    fontSize: 12,
    color: colors.text.secondary,
  },
  content: {
    padding: spacing.lg,
    paddingTop: 0,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  mapBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface.base,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radii.xl,
    padding: spacing.sm + 2,
  },
  mapBannerText: {
    flex: 1,
    fontFamily: typography.subtitle.fontFamily,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
  },
  sectionTitle: {
    fontFamily: typography.itemTitle.fontFamily,
    fontSize: 14,
    color: colors.text.primary,
  },
  presetsRow: {
    flexDirection: "row",
  },
  presetChip: {
    backgroundColor: colors.brand.mint,
    borderRadius: radii.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginRight: spacing.xs,
    minHeight: 40,
    justifyContent: "center",
  },
  presetLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: colors.text.primary,
  },
  emptyHint: {
    fontFamily: typography.subtitle.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  editLink: {
    fontFamily: typography.subtitle.fontFamily,
    fontSize: 13,
    color: colors.text.secondary,
    textDecorationLine: "underline",
  },
  placesList: {
    gap: spacing.sm,
  },
  placeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface.primary,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.md - 2,
    minHeight: 44,
  },
  placeEmoji: {
    fontSize: 18,
  },
  placeText: {
    flex: 1,
  },
  placeName: {
    flex: 1,
    fontFamily: typography.itemTitle.fontFamily,
    fontSize: 14,
    color: colors.text.primary,
  },
  placeAddress: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 1,
  },
  waypointRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface.primary,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.md - 2,
    minHeight: 44,
  },
  waypointNumber: {
    width: 20,
    textAlign: "center",
    fontFamily: typography.itemTitle.fontFamily,
    fontSize: 13,
    color: colors.text.secondary,
  },
  removeWaypointButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  addStopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.surface.primary,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border.subtle,
    padding: spacing.md - 2,
    minHeight: 44,
  },
  addStopLabel: {
    fontFamily: typography.itemTitle.fontFamily,
    fontSize: 13,
    color: colors.text.secondary,
  },
  savePresetTrigger: {
    marginTop: spacing.lg,
    alignSelf: "flex-start",
  },
  savePresetForm: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface.primary,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.md,
  },
  savePresetActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    backgroundColor: colors.surface.base,
  },
  summaryCard: {
    backgroundColor: colors.brand.navy,
    borderRadius: radii.xl,
    padding: spacing.md,
  },
  summaryLabel: {
    fontFamily: typography.itemTitle.fontFamily,
    fontSize: 11,
    letterSpacing: 1.3,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.6)",
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  summaryRoute: {
    flex: 1,
    fontFamily: typography.itemTitle.fontFamily,
    fontSize: 14,
    color: colors.text.onNavy,
  },
  summaryMeta: {
    fontFamily: typography.subtitle.fontFamily,
    fontSize: 11,
    color: "#94A3B8",
    marginTop: spacing.xxs,
  },
  sheetTitle: {
    fontFamily: typography.title.fontFamily,
    fontWeight: "600",
    fontSize: 18,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
});
