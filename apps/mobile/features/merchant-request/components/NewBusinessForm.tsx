import { useState } from "react";
import { Button } from "@/components/common/Button";
import { FormField } from "@/components/common/FormField";
import type { ContactFields as ContactState } from "../useContactFields";
import { ContactFields } from "./ContactFields";

interface NewBusinessFormProps {
  contact: ContactState;
  isSubmitting: boolean;
  /** Error de dirección que devuelve el servidor (no se pudo ubicar) */
  addressError: string | undefined;
  onSubmit: (data: { businessName: string; address: string; note: string }) => void;
}

/** Pedido de un comercio que todavía no está en DePaso: nombre, dirección, contacto y comentario. */
export function NewBusinessForm({ contact, isSubmitting, addressError, onSubmit }: NewBusinessFormProps) {
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<{ businessName?: string; address?: string }>({});

  const submit = () => {
    const next: typeof errors = {};
    if (businessName.trim().length < 2) next.businessName = "Ingresá el nombre de tu comercio.";
    if (address.trim().length < 3) next.address = "Ingresá la dirección de tu comercio.";
    setErrors(next);
    const contactOk = contact.validate();
    if (Object.keys(next).length > 0 || !contactOk) return;
    onSubmit({ businessName: businessName.trim(), address: address.trim(), note: note.trim() });
  };

  return (
    <>
      <FormField
        label="Nombre del comercio"
        value={businessName}
        onChangeText={(text) => {
          setBusinessName(text);
          setErrors((e) => ({ ...e, businessName: undefined }));
        }}
        autoCapitalize="words"
        error={errors.businessName}
      />
      <FormField
        label="Dirección"
        value={address}
        onChangeText={(text) => {
          setAddress(text);
          setErrors((e) => ({ ...e, address: undefined }));
        }}
        placeholder="Calle, número, ciudad"
        autoCapitalize="words"
        error={errors.address ?? addressError}
      />
      <ContactFields contact={contact} />
      <FormField
        label="Comentario para el administrador (opcional)"
        value={note}
        onChangeText={setNote}
        multiline
        autoCapitalize="sentences"
      />
      <Button label={isSubmitting ? "Enviando..." : "Enviar solicitud"} onPress={submit} loading={isSubmitting} />
    </>
  );
}
