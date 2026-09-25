/**
 * Catálogo de medios de pago que el usuario puede declarar tener. Los slugs son los que se
 * guardan en `UserPaymentMethod.methodSlug` y en `PaymentPromo.methodSlugs`.
 */
export type PaymentMethodGroup = "WALLET" | "CARD";

export interface PaymentMethodInfo {
  slug: string;
  label: string;
  group: PaymentMethodGroup;
}

export const PAYMENT_METHODS: readonly PaymentMethodInfo[] = [
  { slug: "cuenta-dni", label: "Cuenta DNI", group: "WALLET" },
  { slug: "mercado-pago", label: "Mercado Pago", group: "WALLET" },
  { slug: "modo", label: "MODO", group: "WALLET" },
  { slug: "visa", label: "Visa", group: "CARD" },
  { slug: "mastercard", label: "Mastercard", group: "CARD" },
  { slug: "american-express", label: "American Express", group: "CARD" },
  { slug: "cabal", label: "Cabal", group: "CARD" },
  { slug: "naranja", label: "Naranja X", group: "CARD" },
];

export const PAYMENT_METHOD_SLUGS = PAYMENT_METHODS.map((method) => method.slug);

export function paymentMethodLabel(slug: string): string {
  return PAYMENT_METHODS.find((method) => method.slug === slug)?.label ?? slug;
}
