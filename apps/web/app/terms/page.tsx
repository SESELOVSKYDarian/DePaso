import { LegalPage, PendingNotice } from "@/components/legal";

export const metadata = { title: "Términos y Condiciones — DePaso" };

export default function TermsPage() {
  return (
    <LegalPage title="Términos y Condiciones">
      <p>
        Fuente completa: <code>docs/legal-functional/LEGAL.md</code> (25 cláusulas del
        Blueprint Legal &amp; Funcional v1.0). Puntos ya decididos:
      </p>
      <ul>
        <li>
          DePaso es una herramienta informativa. No vendemos productos ni somos el comercio —
          el precio final lo determina siempre el comercio.
        </li>
        <li>
          Los precios y ahorros que mostramos son estimaciones y pueden variar por sucursal,
          stock, promociones o medio de pago. Verificá el valor final en el comercio.
        </li>
        <li>Nunca prometemos "el precio garantizado" ni "siempre el más barato".</li>
        <li>Para crear una cuenta declarás tener 18 años o más.</li>
        <li>
          Los aportes de la comunidad (reportes de precio) deben ser de buena fe — moderamos
          con trazabilidad, nunca por discrepar de un precio.
        </li>
      </ul>
      <PendingNotice />
    </LegalPage>
  );
}
