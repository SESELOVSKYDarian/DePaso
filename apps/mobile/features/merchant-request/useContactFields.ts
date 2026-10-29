import { useState } from "react";

/** Teléfono y correo de contacto del comercio, con sus errores y la validación. */
export function useContactFields() {
  const [phone, setPhoneValue] = useState("");
  const [contactEmail, setEmailValue] = useState("");
  const [errors, setErrors] = useState<{ phone?: string; contactEmail?: string }>({});

  // al escribir se limpia el error de ese campo
  const setPhone = (text: string) => {
    setPhoneValue(text);
    setErrors((e) => ({ ...e, phone: undefined }));
  };
  const setContactEmail = (text: string) => {
    setEmailValue(text);
    setErrors((e) => ({ ...e, contactEmail: undefined }));
  };

  /** Ambos son obligatorios: sirven para confirmar que la persona trabaja en el comercio. */
  const validate = (): boolean => {
    const next: { phone?: string; contactEmail?: string } = {};
    if (phone.replace(/\D/g, "").length < 6) next.phone = "Ingresá un teléfono al que podamos llamarte.";
    if (!/^\S+@\S+\.\S+$/.test(contactEmail.trim())) next.contactEmail = "Ingresá un correo de contacto válido.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  return { phone, contactEmail, errors, setPhone, setContactEmail, validate };
}

export type ContactFields = ReturnType<typeof useContactFields>;
