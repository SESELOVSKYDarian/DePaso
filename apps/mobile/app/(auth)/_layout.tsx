import { Stack } from "expo-router";
import { NarrowScreen } from "@/components/common/NarrowScreen";
import { useColors } from "@/lib/theme";

export default function AuthLayout() {
  const colors = useColors();
  return (
    <NarrowScreen>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.surface.base },
        }}
      />
    </NarrowScreen>
  );
}