import { Ionicons } from "@expo/vector-icons";
import { ApiError } from "@depaso/api-client";
import type { UserPlaceResponse } from "@depaso/validation";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { Dialog } from "@/components/common/Dialog";
import { useToast } from "@/components/common/Toast";
import { geocodeClient } from "@/lib/apiClient";
import { PLACE_TYPE_META } from "@/lib/placeTypes";
import { usePlaces } from "@/lib/places/PlacesContext";
import { useTodayRoute, type TodayWaypoint } from "@/lib/routeContext/TodayRouteContext";
import { useColors } from "@/lib/theme";
import { AddTodaySheet } from "./components/AddTodaySheet";
import { MapPickerModal } from "./components/MapPickerModal";
import { PlacesList } from "./components/PlacesList";
import { RouteFooter } from "./components/RouteFooter";
import { SavedRoutesRow } from "./components/SavedRoutesRow";
import { SavePresetForm } from "./components/SavePresetForm";
import { TodayRouteList } from "./components/TodayRouteList";
import { GEOCODING_NOT_CONFIGURED_MESSAGE, geocodeAddress } from "./helpers";
import { useStyles } from "./styles";
import { useMapPicking } from "./useMapPicking";
import { useSavedRoutes } from "./useSavedRoutes";

type Point = { latitude: number; longitude: number };

/** "¿Por dónde vas a andar hoy?": se arma la lista de paradas del recorrido de hoy. */
export default function RouteContextScreen() {
  const colors = useColors();
  const styles = useStyles();
  const { places, createPlace } = usePlaces();
  const { waypoints: savedToday, setWaypoints: commitToday } = useTodayRoute();
  const { show: showToast } = useToast();

  const [waypoints, setWaypoints] = useState<TodayWaypoint[]>(savedToday);
  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [tempName, setTempName] = useState("");
  const [tempAddress, setTempAddress] = useState("");
  const [tempError, setTempError] = useState<string | undefined>();
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [askSaveDialog, setAskSaveDialog] = useState<TodayWaypoint | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isSavingPlace, setIsSavingPlace] = useState(false);

  /** Dirección legible de un punto; si falla, se describe sin dirección. */
  const describePoint = async (point: Point) => {
    try {
      const { address } = await geocodeClient.reverse(point);
      return address;
    } catch {
      return null;
    }
  };

  const map = useMapPicking(describePoint);
  const saved = useSavedRoutes(waypoints, setWaypoints, places, showToast);

  const selectedPlaceIds = new Set(waypoints.map((w) => w.placeId).filter(Boolean));
  const addWaypoint = (waypoint: TodayWaypoint) => setWaypoints((prev) => [...prev, waypoint]);
  const removeWaypoint = (key: string) => setWaypoints((prev) => prev.filter((w) => w.key !== key));

  // tildar o destildar un lugar guardado
  const togglePlace = (place: UserPlaceResponse) => {
    if (selectedPlaceIds.has(place.id)) {
      removeWaypoint(place.id);
      return;
    }
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

  // sumo la ubicación GPS actual como parada
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

  const openMapPicker = () => {
    setAddSheetVisible(false);
    void map.open(() => showToast("No pudimos abrir el mapa. Escribí la dirección.", "error"));
  };

  // confirmo el punto tocado en el mapa
  const addPickedPoint = () => {
    if (!map.picked) return;
    const address = map.pickedAddress ?? `${map.picked.latitude.toFixed(5)}, ${map.picked.longitude.toFixed(5)}`;
    const waypoint: TodayWaypoint = {
      key: `map-${Date.now()}`,
      name: tempName.trim() || address.split(",")[0] || "Punto del mapa",
      address,
      ...map.picked,
      emoji: "📍",
    };
    addWaypoint(waypoint);
    map.close();
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

  // sumo una dirección escrita a mano (la convierto a coordenadas)
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
        // No es un error de la API sino de red: el servidor puede estar caído o inalcanzable.
        setTempError("No pudimos conectar con el servidor. Revisá tu conexión e intentá de nuevo.");
      }
    } finally {
      setIsGeocoding(false);
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

        <SavedRoutesRow presets={saved.presets} onApply={saved.apply} onDelete={(preset) => void saved.remove(preset)} />
        <PlacesList
          places={places}
          selectedPlaceIds={selectedPlaceIds}
          isLocating={isLocating}
          onToggle={togglePlace}
          onCurrentLocation={() => void addCurrentLocation()}
          onPickOnMap={openMapPicker}
          onAddToday={() => setAddSheetVisible(true)}
        />
        <TodayRouteList waypoints={waypoints} onRemove={removeWaypoint} />
        <SavePresetForm
          stopCount={waypoints.length}
          name={saved.savingName}
          isSaving={saved.isSaving}
          onOpen={() => saved.setSavingName("")}
          onChangeName={saved.setSavingName}
          onCancel={() => saved.setSavingName(null)}
          onSave={() => void saved.save()}
        />
      </ScrollView>

      <RouteFooter waypoints={waypoints} onDone={handleDone} />

      <AddTodaySheet
        visible={addSheetVisible}
        name={tempName}
        address={tempAddress}
        error={tempError}
        isGeocoding={isGeocoding}
        onChangeName={setTempName}
        onChangeAddress={setTempAddress}
        onPickOnMap={openMapPicker}
        onSubmit={() => void handleAddTemporary()}
        onClose={() => setAddSheetVisible(false)}
      />

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

      <MapPickerModal
        picking={map}
        center={waypoints[waypoints.length - 1]}
        name={tempName}
        onChangeName={setTempName}
        onConfirm={addPickedPoint}
      />
    </SafeAreaView>
  );
}
