import type { OptimizationPlanResponse } from "@depaso/validation";
import { Pressable, Text, View } from "react-native";
import { useStyles } from "../styles";

interface PlanTabsProps {
  plans: OptimizationPlanResponse[];
  selectedLabel: string | undefined;
  onSelect: (plan: OptimizationPlanResponse) => void;
}

const TITLES: Record<string, string> = { FASTEST: "Sin desvíos", BALANCED: "Intermedio" };

/** Pestañas para cambiar entre las opciones de compra (sin desvíos, intermedio, hipereconómico). */
export function PlanTabs({ plans, selectedLabel, onSelect }: PlanTabsProps) {
  const s = useStyles();

  return (
    <View accessibilityRole="tablist" style={s.planTabs}>
      {plans.map((option) => {
        const selected = selectedLabel === option.label;
        const title = TITLES[option.label] ?? "Hipereconómico";
        return (
          <Pressable
            key={option.label}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={`Ver la opción ${title}`}
            onPress={() => onSelect(option)}
            style={[s.planTab, selected ? s.planTabSelected : null]}
          >
            <Text style={[s.planTabLabel, selected ? s.planTabLabelSelected : null]} numberOfLines={1}>
              {title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
