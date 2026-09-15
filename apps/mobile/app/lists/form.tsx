import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from "react-native";
import { colors, spacing } from "@depaso/design-tokens";
import { Button } from "@/components/Button";
import { FormField } from "@/components/FormField";
import { useLists } from "@/lib/lists/ListsContext";

/** Crear (o renombrar) una lista de compra — Fase 9. */
export default function ListFormScreen() {
  const { id, name: presetName } = useLocalSearchParams<{ id?: string; name?: string }>();
  const { createList, updateList } = useLists();
  const isEditing = id !== undefined;

  const [name, setName] = useState(presetName ?? "");
  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Ponele un nombre a esta lista.");
      return;
    }
    setIsSubmitting(true);
    try {
      if (isEditing) {
        await updateList(id, { name });
      } else {
        const created = await createList({ name });
        router.replace({ pathname: "/lists/[id]", params: { id: created.id } });
        return;
      }
      router.back();
    } catch {
      setError("No pudimos guardar la lista. Probá de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <FormField
          label="Nombre de la lista"
          value={name}
          onChangeText={setName}
          placeholder="Compra semanal, Cumpleaños..."
          error={error}
          autoFocus
        />
        <Button
          label={isSubmitting ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear lista"}
          onPress={() => void handleSubmit()}
          loading={isSubmitting}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.base },
  content: { padding: spacing.lg, gap: spacing.md },
});
