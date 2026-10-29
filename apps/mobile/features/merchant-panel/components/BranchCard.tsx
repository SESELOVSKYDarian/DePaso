import { Text, View } from "react-native";
import type { MerchantBranchResponse } from "@depaso/validation";
import { StoreBadge } from "@/components/stores/StoreBadge";
import { useStyles } from "../styles";

interface BranchCardProps {
  branch: MerchantBranchResponse;
  total: number;
  hasFilters: boolean;
}

/** La sucursal que administra el comercio: logo, nombre, dirección y cuántos productos tiene. */
export function BranchCard({ branch, total, hasFilters }: BranchCardProps) {
  const styles = useStyles();
  return (
    <View style={styles.branchCard}>
      <StoreBadge storeName={branch.storeName} size={44} />
      <View style={styles.flex}>
        <Text style={styles.branchName}>{branch.storeName}</Text>
        <Text style={styles.branchAddress} numberOfLines={1}>
          {branch.address}
        </Text>
      </View>
      <View style={styles.counter}>
        <Text style={styles.counterValue}>{total}</Text>
        <Text style={styles.counterLabel}>{hasFilters ? "encontrados" : "productos"}</Text>
      </View>
    </View>
  );
}
