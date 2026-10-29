import { router } from "expo-router";
import { GroupedList, GroupedRow } from "@/components/common/GroupedList";

interface RoleSectionProps {
  role: string | undefined;
  pendingMerchantRequests: number;
  onSyncPromos: () => void;
}

/** La sección del Perfil que cambia según el rol: administración, comercio o pedir ser comercio. */
export function RoleSection({ role, pendingMerchantRequests, onSyncPromos }: RoleSectionProps) {
  if (role === "ADMIN") {
    return (
      <GroupedList title="Administración">
        <GroupedRow
          icon="storefront-outline"
          label="Solicitudes de comercio"
          {...(pendingMerchantRequests > 0 ? { value: `${pendingMerchantRequests} pendientes` } : {})}
          onPress={() => router.push("/admin/merchant-requests")}
        />
        <GroupedRow icon="pricetags-outline" label="Actualizar promos de bancos y billeteras" onPress={onSyncPromos} />
      </GroupedList>
    );
  }
  if (role === "MERCHANT") {
    return (
      <GroupedList title="Mi comercio">
        <GroupedRow icon="storefront-outline" label="Mis productos y precios" onPress={() => router.push("/merchant")} />
      </GroupedList>
    );
  }
  if (role === "USER") {
    return (
      <GroupedList title="Comercios">
        <GroupedRow icon="storefront-outline" label="Quiero ser comercio" onPress={() => router.push("/merchant/request")} />
      </GroupedList>
    );
  }
  return null;
}
