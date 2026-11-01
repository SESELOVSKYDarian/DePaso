import { isEmailConfigured } from "@/lib/integrations/email";

interface UserRow {
  id: string;
  email: string;
  displayName: string | null;
  role: "USER" | "MERCHANT" | "ADMIN";
  createdAt: Date;
  emailVerifiedAt: Date | null;
}

/**
 * Usuario que se le devuelve a la app (nunca incluye el hash). `emailVerificationRequired` es
 * `true` sólo si falta confirmar el mail y el servidor puede mandar mails: sin SMTP no se
 * bloquea a nadie.
 */
export function toUserPayload(user: UserRow, marketingOptIn: boolean, role: UserRow["role"] = user.role) {
  const emailVerified = user.emailVerifiedAt !== null;
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    marketingOptIn,
    role,
    createdAt: user.createdAt.toISOString(),
    emailVerified,
    emailVerificationRequired: !emailVerified && isEmailConfigured(),
  };
}
