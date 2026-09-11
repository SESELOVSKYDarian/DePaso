import * as Location from "expo-location";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing, typography } from "@depaso/design-tokens";
import type { RouteContextResponse } from "@depaso/validation";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { BottomSheet } from "@/components/BottomSheet";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Dialog } from "@/components/Dialog";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { routeContextClient } from "@/lib/apiClient";
import { PLACE_TYPE_META } from "@/lib/placeTypes";
import { usePlaces } from "@/lib/places/PlacesContext";
import { useTodayRoute, type TodayWaypoint } from "@/lib/routeContext/TodayRouteContext";

async function geocodeAddress(address: string) {
  const results = await Location.geocodeAsync(address);
  const first = results[0];
  return first ? { latitude: first.latitude, longitude: first.longitude } : null;
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
  const availablePlaces = places.filter((p) => !selectedPlaceIds.has(p.id));

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
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
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

        <Text style={styles.sectionTitle}>Tu recorrido de hoy</Text>
        <Card>
          {waypoints.length === 0 ? (
            <Text style={styles.emptyHint}>
              Todavía no elegiste ningún lugar. Agregá los que vas a visitar hoy, en orden.
            </Text>
          ) : (
            <View style={styles.waypointsList}>
              {waypoints.map((w, i) => (
                <View key={w.key} style={styles.waypointRow}>
                  <Text style={styles.waypointOrder}>{i + 1}</Text>
                  <Text style={styles.waypointEmoji}>{w.emoji}</Text>
                  <Text style={styles.waypointName} numberOfLines={1}>
                    {w.name}
                  </Text>
                  <AnimatedPressable
                    accessibilityLabel={`Quitar ${w.name}`}
                    haptic={false}
                    onPress={() => removeWaypoint(w.key)}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeLabel}>×</Text>
                  </AnimatedPressable>
                </View>
              ))}
            </View>
          )}
        </Card>

        <Text style={styles.sectionTitle}>Agregar a tu recorrido</Text>
        <View style={styles.chipsWrap}>
          <AnimatedPressable
            accessibilityLabel="Agregar ubicación actual"
            haptic={false}
            onPress={() => void addCurrentLocation()}
            style={styles.addChip}
          >
            <Text style={styles.addChipLabel}>📍 Ubicación actual</Text>
          </AnimatedPressable>
          {availablePlaces.map((place) => (
            <AnimatedPressable
              key={place.id}
              accessibilityLabel={`Agregar ${place.name}`}
              haptic={false}
              onPress={() => addSavedPlace(place)}
              style={styles.addChip}
            >
              <Text style={styles.addChipLabel}>
                {PLACE_TYPE_META[place.type].emoji} {place.name}
              </Text>
            </AnimatedPressable>
          ))}
          <AnimatedPressable
            accessibilityLabel="Agregar lugar de hoy"
            onPress={() => setAddSheetVisible(true)}
            style={[styles.addChip, styles.addChipDashed]}
          >
            <Text style={styles.addChipLabel}>+ Agregar lugar de hoy</Text>
          </AnimatedPressable>
        </View>

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
        <Button label="Listo" onPress={handleDone} disabled={waypoints.length === 0} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.base,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  sectionTitle: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 13,
    fontWeight: "600",
    color: colors.text.muted,
    textTransform: "uppercase",
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
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
    fontWeight: "600",
    fontSize: 14,
    color: colors.text.primary,
  },
  emptyHint: {
    fontFamily: typography.bodyRegular.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  waypointsList: {
    gap: spacing.sm,
  },
  waypointRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  waypointOrder: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: "700",
    color: colors.text.muted,
    width: 16,
  },
  waypointEmoji: {
    fontSize: 18,
  },
  waypointName: {
    flex: 1,
    fontFamily: typography.body.fontFamily,
    fontWeight: "500",
    fontSize: 15,
    color: colors.text.primary,
  },
  removeButton: {
    minWidth: 32,
    minHeight: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  removeLabel: {
    fontSize: 18,
    color: colors.text.muted,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  addChip: {
    backgroundColor: colors.surface.primary,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    minHeight: 40,
    justifyContent: "center",
  },
  addChipDashed: {
    borderStyle: "dashed",
    borderColor: colors.border.strong,
  },
  addChipLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: colors.text.primary,
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
  sheetTitle: {
    fontFamily: typography.title.fontFamily,
    fontWeight: "600",
    fontSize: 18,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
});
