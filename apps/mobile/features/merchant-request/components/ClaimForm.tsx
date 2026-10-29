import { StoreBadge } from "@/components/stores/StoreBadge";
import { Ionicons } from "@expo/vector-icons";
import type { ClaimableBranch } from "@depaso/validation";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { Button } from "@/components/common/Button";
import { FormField } from "@/components/common/FormField";
import { merchantClient } from "@/lib/apiClient";
import { useColors } from "@/lib/theme";
import { useStyles } from "../styles";
import type { ContactFields as ContactState } from "../useContactFields";
import { ContactFields } from "./ContactFields";

interface ClaimFormProps {
  contact: ContactState;
  isSubmitting: boolean;
  onSubmit: (branch: ClaimableBranch) => void;
}

/** "Mi comercio ya está en DePaso": se busca la sucursal importada y se pide administrarla. */
export function ClaimForm({ contact, isSubmitting, onSubmit }: ClaimFormProps) {
  const colors = useColors();
  const styles = useStyles();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ClaimableBranch[]>([]);
  const [claimed, setClaimed] = useState<ClaimableBranch | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // busco sucursales libres mientras se escribe (con una pausa corta)
  useEffect(() => {
    let cancelled = false;
    setIsSearching(true);
    const timer = setTimeout(() => {
      merchantClient
        .claimableBranches(query.trim())
        .then(({ branches }) => {
          if (!cancelled) setResults(branches);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setIsSearching(false);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <>
      <Text style={styles.intro}>
        Los supermercados que publican precios en SEPA ya están cargados. Buscá el tuyo y pedí administrarlo: vas a poder
        corregir precios y nombres.
      </Text>
      <FormField
        label="Buscar tu supermercado"
        value={query}
        onChangeText={(text) => {
          setQuery(text);
          setClaimed(null);
        }}
        placeholder="Nombre o dirección"
      />
      {isSearching ? <ActivityIndicator color={colors.text.secondary} /> : null}

      {results.map((branch) => {
        const selected = claimed?.id === branch.id;
        return (
          <AnimatedPressable
            key={branch.id}
            accessibilityLabel={`Elegir ${branch.storeName}, ${branch.address}`}
            haptic={false}
            onPress={() => setClaimed(branch)}
            style={[styles.branchRow, selected ? styles.branchRowSelected : null]}
          >
            <StoreBadge storeName={branch.storeName} size={34} />
            <View style={styles.flex}>
              <Text style={styles.branchName}>{branch.storeName}</Text>
              <Text style={styles.branchMeta} numberOfLines={1}>
                {branch.address} · {branch.priceCount} precios
              </Text>
            </View>
            {selected ? <Ionicons name="checkmark-circle" size={22} color={colors.text.primary} /> : null}
          </AnimatedPressable>
        );
      })}
      {!isSearching && results.length === 0 ? (
        <Text style={styles.intro}>No encontramos sucursales libres con eso. Si tu comercio no está, elegí "Es nuevo".</Text>
      ) : null}

      <ContactFields contact={contact} />
      <Button
        label={isSubmitting ? "Enviando..." : claimed ? `Pedir administrar ${claimed.storeName}` : "Elegí tu sucursal"}
        onPress={() => claimed && onSubmit(claimed)}
        loading={isSubmitting}
        disabled={!claimed}
      />
    </>
  );
}
