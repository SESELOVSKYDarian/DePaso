import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { useColors } from "@/lib/theme";
import { capitalize } from "../helpers";
import { useStyles } from "../styles";
import type { ReviewItem } from "../types";
import { ProductPicker } from "./ProductPicker";

interface ReviewCardProps {
  entry: ReviewItem;
  onUpdate: (patch: Partial<ReviewItem>) => void;
  onPickBrand: (brandId: string | null) => void;
}

/** Una fila de la revisión: cantidad, marca a elegir y el producto que se va a agregar. */
export function ReviewCard({ entry, onUpdate, onPickBrand }: ReviewCardProps) {
  const colors = useColors();
  const styles = useStyles();
  const brandOptions = [{ id: null as string | null, name: "Me da igual" }, ...entry.item.brands];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {capitalize(entry.item.term)}
        </Text>
        <View style={styles.stepper}>
          <Pressable
            accessibilityLabel={`Restar uno a ${entry.item.term}`}
            hitSlop={8}
            onPress={() => onUpdate({ quantity: Math.max(1, entry.quantity - 1) })}
            style={styles.stepperButton}
          >
            <Ionicons name="remove" size={18} color={colors.text.primary} />
          </Pressable>
          <Text style={styles.quantity}>{entry.quantity}</Text>
          <Pressable
            accessibilityLabel={`Sumar uno a ${entry.item.term}`}
            hitSlop={8}
            onPress={() => onUpdate({ quantity: Math.min(99, entry.quantity + 1) })}
            style={styles.stepperButton}
          >
            <Ionicons name="add" size={18} color={colors.text.primary} />
          </Pressable>
        </View>
      </View>

      {entry.item.brands.length > 0 ? (
        <>
          <Text style={styles.question}>¿De qué marca?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow} keyboardShouldPersistTaps="handled">
            {brandOptions.map((brand) => {
              const selected = entry.brandId === brand.id;
              return (
                <AnimatedPressable
                  key={brand.id ?? "any"}
                  accessibilityLabel={brand.name}
                  haptic={false}
                  onPress={() => onPickBrand(brand.id)}
                  style={[styles.chip, selected ? styles.chipSelected : null]}
                >
                  <Text style={[styles.chipLabel, selected ? styles.chipLabelSelected : null]}>{brand.name}</Text>
                </AnimatedPressable>
              );
            })}
          </ScrollView>
        </>
      ) : null}

      <View style={styles.result}>
        {entry.loading ? (
          <ActivityIndicator size="small" color={colors.text.secondary} />
        ) : entry.product ? (
          <Text style={styles.resultText} numberOfLines={2}>
            Se agrega: <Text style={styles.resultName}>{entry.product.name}</Text>
            {entry.product.brandName ? ` · ${entry.product.brandName}` : ""}
          </Text>
        ) : (
          <Text style={styles.resultMissing}>No encontramos este producto.</Text>
        )}
        <View style={styles.resultActions}>
          <Pressable
            accessibilityLabel={entry.product ? `Cambiar ${entry.item.term}` : `Buscar ${entry.item.term} a mano`}
            hitSlop={10}
            onPress={() => onUpdate({ picking: !entry.picking })}
          >
            <Text style={styles.remove}>{entry.product ? "Cambiar" : "Buscar"}</Text>
          </Pressable>
          <Pressable accessibilityLabel={`Quitar ${entry.item.term}`} hitSlop={10} onPress={() => onUpdate({ removed: true })}>
            <Text style={styles.remove}>Quitar</Text>
          </Pressable>
        </View>
      </View>

      {entry.picking ? (
        <ProductPicker
          initialQuery={entry.item.term}
          typeId={entry.item.typeId}
          onClose={() => onUpdate({ picking: false })}
          onPick={(product) => onUpdate({ product, picking: false, loading: false })}
        />
      ) : null}
    </View>
  );
}
