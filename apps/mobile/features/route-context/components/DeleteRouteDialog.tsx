import type { RouteContextResponse } from "@depaso/validation";
import { Dialog } from "@/components/common/Dialog";

interface DeleteRouteDialogProps {
  /** La ruta que se va a borrar; `null` = el diálogo está cerrado. */
  route: RouteContextResponse | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/** "¿Borrar esta ruta?": borrar una ruta guardada no se puede deshacer, así que se confirma. */
export function DeleteRouteDialog({ route, onConfirm, onCancel }: DeleteRouteDialogProps) {
  return (
    <Dialog
      visible={route !== null}
      title="¿Borrar esta ruta?"
      description={route ? `Se borra "${route.name}" de tus rutas guardadas.` : undefined}
      confirmLabel="Borrar"
      destructive
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
