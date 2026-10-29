import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { Dialog } from "@/components/common/Dialog";
import { useColors } from "@/lib/theme";
import { AddTodaySheet } from "./components/AddTodaySheet";
import { MapPickerModal } from "./components/MapPickerModal";
import { PlacesList } from "./components/PlacesList";
import { RouteFooter } from "./components/RouteFooter";
import { SavedRoutesRow } from "./components/SavedRoutesRow";
import { SavePresetForm } from "./components/SavePresetForm";
import { TodayRouteList } from "./components/TodayRouteList";
import { useStyles } from "./styles";
import { useRouteBuilder } from "./useRouteBuilder";

/**
 * "Armar ruta": se suman, quitan y ordenan las paradas del recorrido, se pueden buscar lugares
 * y guardar la ruta con nombre. Para usar una ruta ya guardada está "Elegí tu recorrido".
 * La lógica vive en `useRouteBuilder`; acá solo se dibuja.
 */
export default function RouteBuilderScreen() {
  const colors = useColors();
  const styles = useStyles();
  const builder = useRouteBuilder();
  const { saved, temporary, location, savePlace, map, waypoints } = builder;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.navHeader}>
        <AnimatedPressable accessibilityLabel="Volver" haptic={false} onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </AnimatedPressable>
        <View>
          <Text style={styles.navTitle}>Armar ruta</Text>
          <Text style={styles.navSubtitle}>Sumá las paradas de tu recorrido.</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.mapBanner}>
          <Ionicons name="map-outline" size={28} color={colors.brand.route} />
          <Text style={styles.mapBannerText}>Seleccioná los lugares que vas a visitar y armamos la mejor ruta.</Text>
        </View>

        <SavedRoutesRow presets={saved.presets} onApply={saved.apply} onDelete={(preset) => void saved.remove(preset)} />
        <PlacesList
          places={builder.places}
          selectedPlaceIds={builder.selectedPlaceIds}
          isLocating={location.isLocating}
          onToggle={builder.togglePlace}
          onCurrentLocation={() => void location.addCurrentLocation()}
          onPickOnMap={builder.openMapPicker}
          onAddToday={temporary.open}
        />
        <TodayRouteList waypoints={waypoints} onRemove={builder.removeWaypoint} />
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

      <RouteFooter waypoints={waypoints} onDone={builder.done} />

      <AddTodaySheet
        visible={temporary.visible}
        name={temporary.name}
        address={temporary.address}
        error={temporary.error}
        isGeocoding={temporary.isGeocoding}
        onChangeName={temporary.setName}
        onChangeAddress={temporary.setAddress}
        onPickOnMap={builder.openMapPicker}
        onSubmit={() => void temporary.submit()}
        onClose={temporary.close}
      />

      <Dialog
        visible={savePlace.pending !== null}
        title="¿Guardar este lugar para otra vez?"
        description={savePlace.pending ? `"${savePlace.pending.name}" quedaría disponible como lugar guardado.` : undefined}
        cancelLabel="No"
        onCancel={savePlace.cancel}
        confirmLabel={savePlace.isSaving ? "Guardando…" : "Guardar"}
        onConfirm={() => void savePlace.confirm()}
      />

      <MapPickerModal
        picking={map}
        center={waypoints[waypoints.length - 1]}
        name={temporary.name}
        onChangeName={temporary.setName}
        onConfirm={builder.addPickedPoint}
      />
    </SafeAreaView>
  );
}
