import { View } from "react-native";
import { Button } from "@/components/common/Button";
import { FormField } from "@/components/common/FormField";
import { useStyles } from "../styles";

interface SavePresetFormProps {
  stopCount: number;
  /** `null` = el formulario está cerrado; texto = está abierto con ese nombre */
  name: string | null;
  isSaving: boolean;
  onOpen: () => void;
  onChangeName: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
}

/** Botón para guardar la ruta con un nombre; al tocarlo se abre el campo de nombre. */
export function SavePresetForm(props: SavePresetFormProps) {
  const styles = useStyles();
  if (props.stopCount < 2) return null;

  if (props.name === null) {
    return <Button label="Guardar esta ruta con un nombre" variant="ghost" onPress={props.onOpen} style={styles.savePresetTrigger} />;
  }

  return (
    <View style={styles.savePresetForm}>
      <FormField
        label="Nombre del recorrido"
        value={props.name}
        onChangeText={props.onChangeName}
        placeholder="Ej.: Trabajo → Casa, Ruta del sábado"
        autoFocus
      />
      <View style={styles.savePresetActions}>
        <Button label="Cancelar" variant="ghost" onPress={props.onCancel} style={{ flex: 1 }} />
        <Button
          label={props.isSaving ? "Guardando…" : "Guardar"}
          variant="secondary"
          onPress={props.onSave}
          loading={props.isSaving}
          disabled={!props.name.trim()}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}
