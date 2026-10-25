import { Ionicons } from "@expo/vector-icons";
import { ApiError } from "@depaso/api-client";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { makeStyles, useColors, withAlpha } from "@/lib/theme";
import type { RouteContextResponse } from "@depaso/validation";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { BottomSheet } from "@/components/BottomSheet";
import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { FormField } from "@/components/FormField";
import { SelectCheckbox } from "@/components/SelectCheckbox";
import { useToast } from "@/components/Toast";
import { geocodeClient, mapConfigClient, routeContextClient } from "@/lib/apiClient";
import { MapPicker } from "@/components/MapPicker";
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

const MAR_DEL_PLATA = { latitude: -38.0055, longitude: -57.5426 };

export default function RouteContextScreen() {
  const colors = useColors();
  const styles = useStyles();
  const { places, createPlace } = usePlaces();
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
  const [isLocating, setIsLocating] = useState(false);
  const [isSavingRoute, setIsSavingRoute] = useState(false);
  const [isSavingPlace, setIsSavingPlace] = useState(false);
  // Elegir el lugar tocando el mapa.
  const [mapOpen, setMapOpen] = useState(false);
  const [mapToken, setMapToken] = useState<string | null>(null);
  const [picked, setPicked] = useState<{ latitude: number; longitude: number } | null>(null);
  const [pickedAddress, setPickedAddress] = useState<string | null>(null);
  const [isResolvingPick, setIsResolvingPick] = useState(false);
  const pickRequest = useRef(0);

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

  /** Dirección legible de un punto; si falla, se describe sin dirección. */
  const describePoint = async (point: { latitude: number; longitude: number }) => {
    try {
      const { address } = await geocodeClient.reverse(point);
      return address;
    } catch {
      return null;
    }
  };

  const addCurrentLocation = async () => {
    // Un solo pedido a la vez: el GPS puede tardar y antes cada toque sumaba otra parada.
    if (isLocating) return;
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showToast("No pudimos acceder a tu ubicación.", "error");
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const point = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      const address = await describePoint(point);
      addWaypoint({
        key: `current-${Date.now()}`,
        name: "Ubicación actual",
        address: address ?? "Tu ubicación en este momento",
        ...point,
        emoji: "📍",
      });
    } catch {
      showToast("No pudimos leer tu ubicación. Probá de nuevo o elegila en el mapa.", "error");
    } finally {
      setIsLocating(false);
    }
  };

  const openMapPicker = async () => {
    setAddSheetVisible(false);
    setPicked(null);
    setPickedAddress(null);
    setMapOpen(true);
    if (!mapToken) {
      try {
        const config = await mapConfigClient.getMapboxToken();
        setMapToken(config.token);
      } catch {
        setMapOpen(false);
        showToast("No pudimos abrir el mapa. Escribí la dirección.", "error");
      }
    }
  };

  const handlePick = async (point: { latitude: number; longitude: number }) => {
    const id = ++pickRequest.current;
    setPicked(point);
    setPickedAddress(null);
    setIsResolvingPick(true);
    const address = await describePoint(point);
    if (id !== pickRequest.current) return;
    setPickedAddress(address);
    setIsResolvingPick(false);
  };

  const addPickedPoint = () => {
    if (!picked) return;
    const address = pickedAddress ?? `${picked.latitude.toFixed(5)}, ${picked.longitude.toFixed(5)}`;
    const waypoint: TodayWaypoint = {
      key: `map-${Date.now()}`,
      name: tempName.trim() || address.split(",")[0] || "Punto del mapa",
      address,
      ...picked,
      emoji: "📍",
    };
    addWaypoint(waypoint);
    setMapOpen(false);
    setTempName("");
    setAskSaveDialog(waypoint);
  };

  /** "¿Guardar este lugar?" → sí: se guarda en Mis lugares y la parada queda vinculada. */
  const savePlace = async (waypoint: TodayWaypoint) => {
    if (isSavingPlace) return;
    setIsSavingPlace(true);
    try {
      const created = await createPlace({
        name: waypoint.name.slice(0, 80),
        type: "CUSTOM",
        address: waypoint.address.slice(0, 200),
        latitude: waypoint.latitude,
        longitude: waypoint.longitude,
        isFavorite: false,
      });
      setWaypoints((prev) => prev.map((w) => (w.key === waypoint.key ? { ...w, key: created.id, placeId: created.id } : w)));
      showToast(`Guardamos "${created.name}" en Mis lugares.`, "success");
    } catch {
      showToast("No pudimos guardar el lugar. Probá de nuevo.", "error");
    } finally {
      setIsSavingPlace(false);
      setAskSaveDialog(null);
    }
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
    if (preset.stops && preset.stops.length > 0) {
      setWaypoints(
        preset.stops.map((stop, index) => ({
          key: stop.placeId ?? `saved-${preset.id}-${index}`,
          ...(stop.placeId ? { placeId: stop.placeId } : {}),
          name: stop.name,
          address: stop.address,
          latitude: stop.latitude,
          longitude: stop.longitude,
          emoji: stop.emoji,
        })),
      );
      showToast(`Cargaste "${preset.name}"`, "success");
      return;
    }
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
    if (!name || waypoints.length < 2 || isSavingRoute) return;
    setIsSavingRoute(true);
    try {
      const created = await routeContextClient.create({
        name,
        stops: waypoints.map((w) => ({
          name: w.name,
          address: w.address,
          latitude: w.latitude,
          longitude: w.longitude,
          emoji: w.emoji,
          ...(w.placeId ? { placeId: w.placeId } : {}),
        })),
      });
      setPresets((prev) => [created, ...prev]);
      setSavingPresetName(null);
      showToast(`Guardamos "${created.name}". La tenés arriba para usarla cuando quieras.`, "success");
    } catch {
      showToast("No pudimos guardar el recorrido. Probá de nuevo.", "error");
    } finally {
      setIsSavingRoute(false);
    }
  };

  const deletePreset = async (preset: RouteContextResponse) => {
    try {
      await routeContextClient.remove(preset.id);
      setPresets((prev) => prev.filter((p) => p.id !== preset.id));
      showToast(`Borramos "${preset.name}".`, "info");
    } catch {
      showToast("No pudimos borrar la ruta.", "error");
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
            <Text style={styles.sectionTitle}>Tus rutas guardadas</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsRow}>
              {presets.map((preset) => (
                <View key={preset.id} style={{ flexDirection: "row", alignItems: "center" }}>
                <AnimatedPressable
                  accessibilityLabel={`Usar recorrido ${preset.name}`}
                  haptic={false}
                  onPress={() => applyPreset(preset)}
                  style={styles.presetChip}
                >
                  <Text style={styles.presetLabel}>{preset.name}</Text>
                </AnimatedPressable>
                <AnimatedPressable
                  accessibilityLabel={`Borrar la ruta guardada ${preset.name}`}
                  haptic={false}
                  onPress={() => void deletePreset(preset)}
                  style={styles.presetDelete}
                >
                  <Ionicons name="close" size={14} color={colors.text.secondary} />
                </AnimatedPressable>
                </View>
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
            style={[styles.placeRow, isLocating ? styles.rowBusy : null]}
          >
            {isLocating ? (
              <ActivityIndicator size="small" color={colors.text.primary} />
            ) : (
              <Ionicons name="navigate-outline" size={18} color={colors.text.secondary} />
            )}
            <Text style={styles.placeName}>{isLocating ? "Buscando dónde estás…" : "Ubicación actual"}</Text>
          </AnimatedPressable>

          <AnimatedPressable
            accessibilityLabel="Elegir un lugar en el mapa"
            haptic={false}
            onPress={() => void openMapPicker()}
            style={styles.placeRow}
          >
            <Ionicons name="map-outline" size={18} color={colors.text.secondary} />
            <Text style={styles.placeName}>Elegir en el mapa</Text>
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

        {waypoints.length >= 2 ? (
          savingPresetName === null ? (
            <Button
              label="Guardar esta ruta con un nombre"
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
                placeholder="Ej.: Trabajo → Casa, Ruta del sábado"
                autoFocus
              />
              <View style={styles.savePresetActions}>
                <Button label="Cancelar" variant="ghost" onPress={() => setSavingPresetName(null)} style={{ flex: 1 }} />
                <Button
                  label={isSavingRoute ? "Guardando…" : "Guardar"}
                  variant="secondary"
                  onPress={() => void handleSavePreset()}
                  loading={isSavingRoute}
                  disabled={!savingPresetName.trim()}
                  style={{ flex: 1 }}
                />
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
        <AnimatedPressable
          accessibilityLabel="Elegir el lugar en el mapa"
          haptic={false}
          onPress={() => void openMapPicker()}
          style={styles.mapOption}
        >
          <Ionicons name="map-outline" size={20} color={colors.text.primary} />
          <Text style={styles.placeName}>Elegir en el mapa</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.text.secondary} />
        </AnimatedPressable>
        <Text style={styles.orLabel}>o escribí la dirección</Text>
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
        cancelLabel="No"
        onCancel={() => setAskSaveDialog(null)}
        confirmLabel={isSavingPlace ? "Guardando…" : "Guardar"}
        onConfirm={() => {
          // Sección 34: sólo se guarda con la confirmación explícita de este diálogo.
          if (askSaveDialog) void savePlace(askSaveDialog);
        }}
      />

      <Modal visible={mapOpen} animationType="slide" onRequestClose={() => setMapOpen(false)}>
        <SafeAreaView style={styles.mapModal} edges={["top", "bottom"]}>
          <View style={styles.navHeader}>
            <AnimatedPressable accessibilityLabel="Cerrar el mapa" haptic={false} onPress={() => setMapOpen(false)} style={styles.backButton}>
              <Ionicons name="close" size={22} color={colors.text.primary} />
            </AnimatedPressable>
            <Text style={styles.navTitle}>Elegí el lugar</Text>
          </View>
          <View style={styles.mapArea}>
            {mapToken ? (
              <MapPicker mapboxToken={mapToken} center={waypoints[waypoints.length - 1] ?? MAR_DEL_PLATA} onPick={(point) => void handlePick(point)} />
            ) : (
              <ActivityIndicator style={styles.mapLoader} color={colors.text.primary} />
            )}
          </View>
          <View style={styles.mapFooter}>
            <View style={styles.pickedRow}>
              <Ionicons name="location-outline" size={20} color={colors.text.primary} />
              <Text style={styles.pickedText} numberOfLines={2}>
                {!picked
                  ? "Tocá el mapa donde vas a estar. Podés arrastrar el pin."
                  : isResolvingPick
                    ? "Buscando la dirección…"
                    : (pickedAddress ?? "Punto elegido en el mapa")}
              </Text>
            </View>
            <FormField label="Nombre (opcional)" value={tempName} onChangeText={setTempName} placeholder="Médico, Shopping..." />
            <Button label="Agregar este lugar" onPress={addPickedPoint} disabled={!picked || isResolvingPick} />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((colors) => StyleSheet.create({
  rowBusy: { opacity: 0.7 },
  presetDelete: {
    alignSelf: "center",
    width: 28,
    height: 28,
    marginRight: spacing.xs,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface.input,
  },
  mapOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.base,
    marginBottom: spacing.sm,
  },
  orLabel: { fontFamily: typography.caption.fontFamily, fontSize: 13, color: colors.text.secondary, marginBottom: spacing.xs },
  mapModal: { flex: 1, backgroundColor: colors.surface.base },
  mapArea: { flex: 1 },
  mapLoader: { marginTop: spacing.xl },
  mapFooter: { padding: spacing.lg, gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border.subtle },
  pickedRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  pickedText: { flex: 1, fontFamily: typography.body.fontFamily, fontSize: 15, color: colors.text.primary },
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
    color: withAlpha(colors.text.onNavy, 0.65),
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
    color: withAlpha(colors.text.onNavy, 0.75),
    marginTop: spacing.xxs,
  },
  sheetTitle: {
    fontFamily: typography.title.fontFamily,
    fontWeight: "600",
    fontSize: 18,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
}));
