import type { AssistantItem, AssistantResponse, ProductSearchResult } from "@depaso/validation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { assistantClient, productsClient } from "@/lib/apiClient";
import { makeStyles, useColors } from "@/lib/theme";
import { useStyles } from "../styles";

/** Buscador chico para cambiar el producto elegido, o buscarlo a mano si no se encontró. */
export function ProductPicker({
  initialQuery,
  typeId,
  onPick,
  onClose,
}: {
  initialQuery: string;
  typeId: string | null;
  onPick: (product: ProductSearchResult) => void;
  onClose: () => void;
}) {
  const colors = useColors();
  const styles = useStyles();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<ProductSearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) {
      setResults(null);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(() => {
      productsClient
        .search(value, typeId && value === initialQuery ? { type: typeId } : {})
        .then((response) => {
          if (!cancelled) setResults(response.results.slice(0, 6));
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, typeId, initialQuery]);

  return (
    <View style={styles.picker}>
      <View style={styles.pickerInputRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar producto o marca"
          placeholderTextColor={colors.text.muted}
          autoFocus
          returnKeyType="search"
          accessibilityLabel="Buscar producto"
          style={styles.pickerInput}
        />
        <Pressable accessibilityLabel="Cerrar búsqueda" hitSlop={10} onPress={onClose}>
          <Text style={styles.remove}>Cerrar</Text>
        </Pressable>
      </View>
      {searching ? <ActivityIndicator size="small" color={colors.text.secondary} /> : null}
      {results && results.length === 0 && !searching ? (
        <Text style={styles.resultMissing}>No encontramos nada con eso. Probá con otra palabra.</Text>
      ) : null}
      {(results ?? []).map((product) => (
        <Pressable
          key={product.id}
          accessibilityRole="button"
          accessibilityLabel={`Elegir ${product.name}`}
          onPress={() => onPick(product)}
          style={({ pressed }) => [styles.pickerRow, pressed ? styles.micPressed : null]}
        >
          <Text style={styles.resultName} numberOfLines={2}>
            {product.name}
          </Text>
          {product.brandName ? <Text style={styles.resultText}>{product.brandName}</Text> : null}
        </Pressable>
      ))}
    </View>
  );
}
