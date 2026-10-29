import type { AssistantResponse } from "@depaso/validation";
import { Pressable, ScrollView, Text, View } from "react-native";
import { radii } from "@depaso/design-tokens";
import { Button } from "@/components/common/Button";
import { useStyles } from "../styles";
import type { ReviewItem } from "../types";
import { ReviewCard } from "./ReviewCard";

interface ReviewViewProps {
  heard: string | null;
  source: AssistantResponse["source"];
  review: ReviewItem[];
  addableCount: number;
  isAdding: boolean;
  onCorrectText: () => void;
  onUpdate: (id: string, patch: Partial<ReviewItem>) => void;
  onPickBrand: (entry: ReviewItem, brandId: string | null) => void;
  onAddAll: () => void;
  onRedo: () => void;
}

/** Revisión: lo que entendió la IA, producto por producto, y el botón para agregarlo todo. */
export function ReviewView(props: ReviewViewProps) {
  const styles = useStyles();
  const { addableCount } = props;
  const addLabel = props.isAdding
    ? "Agregando..."
    : addableCount === 0
      ? "No hay nada para agregar"
      : `Agregar ${addableCount} ${addableCount === 1 ? "producto" : "productos"}`;

  return (
    <>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text accessibilityRole="header" style={styles.title}>
          Esto entendimos
        </Text>
        {props.heard ? (
          <View style={styles.heardBox}>
            <View style={styles.heardHeader}>
              <Text style={styles.heardLabel}>Dijiste</Text>
              <Pressable accessibilityLabel="Corregir lo que dijiste" hitSlop={10} onPress={props.onCorrectText}>
                <Text style={styles.remove}>Corregir</Text>
              </Pressable>
            </View>
            <Text style={styles.heardText}>{props.heard}</Text>
          </View>
        ) : null}
        <Text style={styles.subtitle}>
          {props.source === "fallback"
            ? "Lo armamos en modo básico: revisá bien cada producto."
            : "Elegí la marca de cada uno, o dejá “Me da igual”."}
        </Text>

        {props.review.map((entry) =>
          entry.removed ? null : (
            <ReviewCard
              key={entry.item.id}
              entry={entry}
              onUpdate={(patch) => props.onUpdate(entry.item.id, patch)}
              onPickBrand={(brandId) => props.onPickBrand(entry, brandId)}
            />
          ),
        )}
      </ScrollView>
      <View style={styles.footer}>
        <Button
          label={addLabel}
          onPress={props.onAddAll}
          loading={props.isAdding}
          disabled={addableCount === 0}
          style={{ borderRadius: radii.full }}
        />
        <Button label="Volver a decirlo" variant="ghost" onPress={props.onRedo} />
      </View>
    </>
  );
}
