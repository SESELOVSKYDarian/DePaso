import { Text } from "react-native";
import { FormField } from "@/components/common/FormField";
import type { ContactFields as ContactState } from "../useContactFields";
import { useStyles } from "../styles";

/** Campos de teléfono y correo de contacto, con el aviso de que se verifica antes de aprobar. */
export function ContactFields({ contact }: { contact: ContactState }) {
  const styles = useStyles();

  return (
    <>
      <FormField
        label="Teléfono de contacto"
        value={contact.phone}
        onChangeText={contact.setPhone}
        keyboardType="phone-pad"
        error={contact.errors.phone}
      />
      <FormField
        label="Correo de contacto"
        value={contact.contactEmail}
        onChangeText={contact.setContactEmail}
        keyboardType="email-address"
        autoComplete="email"
        error={contact.errors.contactEmail}
      />
      <Text style={styles.intro}>
        Te vamos a llamar o escribir para confirmar que trabajás en el comercio antes de aprobarlo. Sin esa verificación
        no se da el alta.
      </Text>
    </>
  );
}
