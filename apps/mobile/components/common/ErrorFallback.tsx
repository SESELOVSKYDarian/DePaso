import { Pressable, Text, View } from "react-native";

/**
 * Si una pantalla falla al dibujarse, en vez de cerrar la app se muestra esto y se puede
 * reintentar. Va sin providers (puede fallar uno de ellos), por eso los colores son fijos.
 */
export function ErrorFallback({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  return (
    <View style={{ flex: 1, backgroundColor: "#000000", alignItems: "center", justifyContent: "center", padding: 32, gap: 12 }}>
      <Text style={{ color: "#F5F5F7", fontSize: 22, fontWeight: "700", textAlign: "center" }}>Algo se nos cruzó en el camino</Text>
      <Text style={{ color: "#A1A1A6", fontSize: 15, textAlign: "center" }}>No perdiste nada: tocá para volver a intentar.</Text>
      <Text style={{ color: "#6B6B70", fontSize: 12, textAlign: "center" }} numberOfLines={3}>
        {error.message}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => void retry()}
        style={{ marginTop: 12, minHeight: 48, paddingHorizontal: 28, borderRadius: 999, backgroundColor: "#F5F5F7", justifyContent: "center" }}
      >
        <Text style={{ color: "#000000", fontSize: 16, fontWeight: "600" }}>Reintentar</Text>
      </Pressable>
    </View>
  );
}
