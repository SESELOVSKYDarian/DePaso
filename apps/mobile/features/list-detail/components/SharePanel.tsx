import type { ShoppingListResponse } from "@depaso/validation";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { useColors } from "@/lib/theme";
import { useStyles } from "../styles";

interface SharePanelProps {
  list: ShoppingListResponse;
  isOwner: boolean;
  isSharing: boolean;
  /** id del usuario actual, para el botón "Salir" de quien recibió la lista */
  currentUserId: string | undefined;
  onShare: (email: string) => Promise<boolean>;
  onRemoveMember: (memberUserId: string) => void;
}

/** Panel para compartir la lista por email, ver con quién está compartida o salir de ella. */
export function SharePanel({ list, isOwner, isSharing, currentUserId, onShare, onRemoveMember }: SharePanelProps) {
  const colors = useColors();
  const styles = useStyles();
  const [email, setEmail] = useState("");

  const submit = async () => {
    const shared = await onShare(email.trim());
    if (shared) setEmail("");
  };

  if (!isOwner) {
    return (
      <View style={styles.sharePanel}>
        <View style={styles.memberRow}>
          <Text style={styles.memberName} numberOfLines={1}>
            Compartida por {list.ownerName ?? "otra persona"}
          </Text>
          <AnimatedPressable
            accessibilityLabel="Salir de la lista"
            haptic={false}
            onPress={() => currentUserId && onRemoveMember(currentUserId)}
          >
            <Text style={styles.memberRemove}>Salir</Text>
          </AnimatedPressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.sharePanel}>
      <Text style={styles.shareTitle}>{list.members.length === 0 ? "Compartir esta lista" : "Compartida con"}</Text>
      {list.members.map((member) => (
        <View key={member.userId} style={styles.memberRow}>
          <Text style={styles.memberName} numberOfLines={1}>
            {member.displayName ?? member.email}
          </Text>
          <AnimatedPressable
            accessibilityLabel={`Dejar de compartir con ${member.email}`}
            haptic={false}
            onPress={() => onRemoveMember(member.userId)}
          >
            <Text style={styles.memberRemove}>Quitar</Text>
          </AnimatedPressable>
        </View>
      ))}
      <View style={styles.shareRow}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email de quien ya usa DePaso"
          placeholderTextColor={colors.text.muted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          style={styles.shareInput}
        />
        <AnimatedPressable
          accessibilityLabel="Compartir lista"
          haptic={false}
          onPress={() => void submit()}
          style={[styles.shareButton, isSharing || !email.trim() ? styles.shareButtonDisabled : null]}
        >
          <Text style={styles.shareButtonLabel}>{isSharing ? "..." : "Compartir"}</Text>
        </AnimatedPressable>
      </View>
    </View>
  );
}
